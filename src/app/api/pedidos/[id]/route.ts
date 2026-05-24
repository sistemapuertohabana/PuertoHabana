import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/pedidos/:id — actualizar estado y/o agregar items
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { estado, metodo_pago, items } = await request.json();

  // Agregar items adicionales a la comanda (ej. tapers a cuenta ya cobrada)
  if (items && items.length > 0) {
    const cmdItems = items.map((item: any) => ({
      comanda_id: id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      categoria: item.categoria || 'tapers',
      notas: item.notas || null,
      estado: 'Entregado', // se marcan como entregados directamente
    }));

    const { error: itemsErr } = await sb.from('comanda_items').insert(cmdItems);
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    // Recalcular total de la comanda sumando los items agregados
    const { data: allItems } = await sb.from('comanda_items').select('precio, cantidad').eq('comanda_id', id);
    if (allItems) {
      const nuevoTotal = allItems.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
      await sb.from('comandas').update({ total: nuevoTotal }).eq('id', id);
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
