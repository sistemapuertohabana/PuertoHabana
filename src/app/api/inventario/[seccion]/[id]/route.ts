import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/inventario/:seccion/:id
export async function PUT(request: Request, { params }: { params: Promise<{ seccion: string; id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { nombre, categoria, tipo, precio, cantidad, unidad, minimo, codigo_barras, imagen_url, costo, tamanos, turno } = await request.json();

  // Obtener stock anterior para el historial
  const { data: itemAntiguo } = await sb.from('inventario').select('cantidad').eq('id', id).single();
  const stock_anterior = itemAntiguo?.cantidad || 0;

  const { error } = await sb
    .from('inventario')
    .update({
      nombre,
      categoria: categoria || null,
      tipo: tipo || null,
      precio: precio || 0,
      cantidad: cantidad || 0,
      unidad: unidad || 'unidad',
      minimo: minimo ?? 3,
      codigo_barras: codigo_barras || null,
      imagen_url: imagen_url || null,
      costo: costo || 0,
      tamanos: tamanos || null,
      turno: turno || 'ambos',
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registrar movimiento si el stock cambió manualmente
  if (cantidad !== undefined && stock_anterior !== cantidad) {
    const diff = cantidad - stock_anterior;
    await sb.from('inventario_movimientos').insert([{
      inventario_id: id,
      tipo: diff > 0 ? 'entrada' : 'salida',
      cantidad: Math.abs(diff),
      stock_anterior: stock_anterior,
      stock_nuevo: cantidad,
      notas: 'Ajuste de inventario manual (Edición)',
    }]);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/inventario/:seccion/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ seccion: string; id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('inventario').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
