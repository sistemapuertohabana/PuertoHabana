import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/pedidos/:id — actualizar estado y/o agregar items
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { estado, metodo_pago, items, paid_item_ids } = await request.json();

  // Pago parcial: marcar solo items específicos como Entregado
  if (paid_item_ids && paid_item_ids.length > 0) {
    const { error: paidErr } = await sb
      .from('comanda_items')
      .update({ estado: 'Entregado' })
      .in('id', paid_item_ids);

    if (paidErr) return NextResponse.json({ error: paidErr.message }, { status: 500 });

    // Recalcular total solo con items no entregados
    const { data: remainingItems } = await sb
      .from('comanda_items')
      .select('precio, cantidad')
      .eq('comanda_id', id)
      .neq('estado', 'Entregado');

    if (remainingItems && remainingItems.length > 0) {
      // Quedan items sin pagar → actualizar total y mantener comanda activa
      const nuevoTotal = remainingItems.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
      const updateData: any = { total: nuevoTotal };
      if (metodo_pago) {
        updateData.metodo_pago = metodo_pago.startsWith('Mixto') ? 'Otro' : metodo_pago;
        if (metodo_pago.startsWith('Mixto')) updateData.notas = metodo_pago;
      }
      await sb.from('comandas').update(updateData).eq('id', id);
    } else {
      // Todos los items pagados → marcar comanda como Entregado
      const updateData: any = { estado: 'Entregado' };
      if (metodo_pago) {
        updateData.metodo_pago = metodo_pago.startsWith('Mixto') ? 'Otro' : metodo_pago;
        if (metodo_pago.startsWith('Mixto')) updateData.notas = metodo_pago;
      }
      await sb.from('comandas').update(updateData).eq('id', id);
    }

    // Notificar al admin
    await sb
      .from('notificaciones')
      .insert([{
        rol_destino: 'admin',
        titulo: '💰 Pago Parcial',
        mensaje: `Se cobraron ${paid_item_ids.length} item(s) de comanda #${id} con ${metodo_pago || 'pago'}`,
      }])
      .maybeSingle();

    return NextResponse.json({ success: true, partial: true });
  }

  // Agregar items adicionales a la comanda
  if (items && items.length > 0) {
    // Determinar estado de los nuevos items según el estado actual de la comanda
    const { data: comanda } = await sb
      .from('comandas')
      .select('estado')
      .eq('id', id)
      .single();
    
    const comandaActiva = comanda && comanda.estado !== 'Entregado' && comanda.estado !== 'Cerrado';
    
    const cmdItems = items.map((item: any) => ({
      comanda_id: id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      categoria: item.categoria || 'comida',
      notas: item.notas || null,
      estado: comandaActiva ? 'Pendiente' : 'Entregado', // Pendiente si la comanda está activa (va a cocina), Entregado si ya está pagada (tapers)
    }));

    const { error: itemsErr } = await sb.from('comanda_items').insert(cmdItems);
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    // Recalcular total de la comanda sumando los items agregados
    const { data: allItems } = await sb.from('comanda_items').select('precio, cantidad').eq('comanda_id', id);
    if (allItems) {
      const nuevoTotal = allItems.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
      await sb.from('comandas').update({ total: nuevoTotal }).eq('id', id);
    }

    // Si la comanda estaba marcada como Listo pero ahora tiene items Pendientes, volver a Pendiente
    if (comandaActiva && comanda?.estado === 'Listo') {
      await sb.from('comandas').update({ estado: 'Pendiente' }).eq('id', id);
    }

    return NextResponse.json({ success: true });
  }

  // Actualizar estado normal
  const updateData: any = { estado };
  if (metodo_pago) {
    if (metodo_pago.startsWith('Mixto')) {
      updateData.metodo_pago = 'Otro';
      updateData.notas = metodo_pago;
    } else {
      updateData.metodo_pago = metodo_pago;
    }
  }

  const { error } = await sb.from('comandas').update(updateData).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // También actualizar items si se marca como Entregado
  if (estado === 'Entregado') {
    await sb.from('comanda_items').update({ estado: 'Entregado' }).eq('comanda_id', id);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/pedidos/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('comandas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
