import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { checkAndNotifyLowStock } from '@/lib/push';

// PATCH /api/inventario/stock — { id, delta, referencia, notas }
// Decrementa o incrementa el stock y registra el movimiento
export async function PATCH(request: Request) {
  const sb = getServiceSupabase();
  const { id, delta, referencia, referencia_id, notas } = await request.json();

  if (!id || delta === undefined || delta === 0) {
    return NextResponse.json({ error: 'id y delta requeridos (delta != 0)' }, { status: 400 });
  }

  // Fetch current item
  const { data: item, error: fetchErr } = await sb
    .from('inventario')
    .select('id, cantidad, nombre, seccion, minimo, unidad')
    .eq('id', id)
    .single();

  if (fetchErr || !item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
  }

  const stockAnterior = item.cantidad;
  const stockNuevo = Math.max(0, stockAnterior + delta);
  const tipo = delta > 0 ? 'entrada' : 'salida';

  // Actualizar stock
  const { error: updateErr } = await sb
    .from('inventario')
    .update({ cantidad: stockNuevo })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Registrar movimiento
  const { data: movimiento, error: movErr } = await sb
    .from('inventario_movimientos')
    .insert([{
      inventario_id: id,
      tipo,
      cantidad: Math.abs(delta),
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia: referencia || null,
      referencia_id: referencia_id || null,
      notas: notas || null,
    }])
    .select()
    .single();

  if (movErr) {
    // No fallar por el movimiento, solo log
    console.error('Error registrando movimiento:', movErr.message);
  }

  // Verificar si el stock quedó por debajo del mínimo
  if (delta < 0) {
    checkAndNotifyLowStock({
      id: item.id,
      nombre: item.nombre,
      seccion: item.seccion,
      cantidad: stockNuevo,
      minimo: item.minimo,
      unidad: item.unidad,
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    stock_anterior: stockAnterior,
    stock_nuevo: stockNuevo,
    movimiento,
  });
}

// GET /api/inventario/stock?inventario_id=123
// Obtiene el historial de movimientos de un item
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const inventarioId = searchParams.get('inventario_id');
  const tipo = searchParams.get('tipo');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = sb
    .from('inventario_movimientos')
    .select('*, inventario:inventario_id(nombre, seccion)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (inventarioId) query = query.eq('inventario_id', inventarioId);
  if (tipo) query = query.eq('tipo', tipo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/inventario/stock
// Elimina todo el historial de movimientos de inventario
export async function DELETE() {
  const sb = getServiceSupabase();

  const { error } = await sb
    .from('inventario_movimientos')
    .delete()
    .neq('id', 0); // Delete all rows

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Historial de movimientos eliminado correctamente' });
}
