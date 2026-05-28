import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/pedidos/split — dividir items de una comanda en una nueva comanda
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { comanda_id, item_ids } = await request.json();

  if (!comanda_id || !item_ids || item_ids.length === 0) {
    return NextResponse.json({ error: 'Se requieren comanda_id y item_ids' }, { status: 400 });
  }

  // 1. Obtener la comanda original
  const { data: comanda, error: comandaErr } = await sb
    .from('comandas')
    .select('*')
    .eq('id', comanda_id)
    .single();

  if (comandaErr || !comanda) {
    return NextResponse.json({ error: 'Comanda no encontrada' }, { status: 404 });
  }

  // No dividir si ya está pagada
  if (comanda.estado === 'Entregado' || comanda.estado === 'Cerrado') {
    return NextResponse.json({ error: 'No se puede dividir una comanda ya pagada' }, { status: 400 });
  }

  // 2. Obtener los items a dividir
  const { data: splitItems, error: itemsErr } = await sb
    .from('comanda_items')
    .select('*')
    .in('id', item_ids)
    .eq('comanda_id', comanda_id);

  if (itemsErr || !splitItems || splitItems.length === 0) {
    return NextResponse.json({ error: 'Items no encontrados en esta comanda' }, { status: 404 });
  }

  // Verificar que ninguno de los items ya esté pagado
  const alreadyPaid = splitItems.filter(i => i.estado === 'Entregado');
  if (alreadyPaid.length > 0) {
    return NextResponse.json({
      error: `No se pueden dividir items ya pagados: ${alreadyPaid.map(i => i.nombre).join(', ')}`
    }, { status: 400 });
  }

  // 3. Verificar que no se intenten dividir TODOS los items
  const { data: allItems, count: allCount } = await sb
    .from('comanda_items')
    .select('id', { count: 'exact', head: false })
    .eq('comanda_id', comanda_id);

  if (allItems && item_ids.length >= allItems.length) {
    return NextResponse.json({
      error: 'No se pueden dividir todos los items. Debe quedar al menos un item en la comanda original.'
    }, { status: 400 });
  }

  // 4. Calcular total de los items a dividir
  const splitTotal = splitItems.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);

  // 5. Crear nueva comanda con los items seleccionados
  const { data: newComanda, error: createErr } = await sb
    .from('comandas')
    .insert([{
      mesa_nombre: comanda.mesa_nombre,
      mozo_id: comanda.mozo_id,
      mozo_nombre: comanda.mozo_nombre,
      estado: 'Pendiente',
      total: splitTotal,
      fecha: comanda.fecha,
      hora: comanda.hora,
    }])
    .select()
    .single();

  if (createErr || !newComanda) {
    return NextResponse.json({ error: 'Error al crear nueva comanda: ' + (createErr?.message || '') }, { status: 500 });
  }

  // 6. Mover los items a la nueva comanda
  const { error: moveErr } = await sb
    .from('comanda_items')
    .update({ comanda_id: newComanda.id })
    .in('id', item_ids);

  if (moveErr) {
    // Rollback: eliminar la nueva comanda
    await sb.from('comandas').delete().eq('id', newComanda.id);
    return NextResponse.json({ error: 'Error al mover items: ' + moveErr.message }, { status: 500 });
  }

  // 7. Recalcular total de la comanda original
  const { data: remainingItems } = await sb
    .from('comanda_items')
    .select('precio, cantidad')
    .eq('comanda_id', comanda_id);

  const remainingTotal = remainingItems && remainingItems.length > 0
    ? remainingItems.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0)
    : 0;

  await sb.from('comandas').update({ total: remainingTotal }).eq('id', comanda_id);

  // 8. Notificar al admin
  await sb
    .from('notificaciones')
    .insert([{
      rol_destino: 'admin',
      titulo: '✂️ Cuenta Dividida',
      mensaje: `Se dividió comanda #${comanda_id} (${comanda.mesa_nombre}): ${splitItems.length} item(s) → nueva comanda #${newComanda.id} por S/ ${splitTotal.toFixed(2)}`,
    }])
    .maybeSingle();

  return NextResponse.json({
    success: true,
    original_comanda: { id: comanda_id, total: remainingTotal },
    new_comanda: { id: newComanda.id, total: splitTotal, mesa: comanda.mesa_nombre },
  });
}
