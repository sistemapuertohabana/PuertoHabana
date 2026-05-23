import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PATCH /api/pedidos/:id — actualizar estado
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { estado } = await request.json();

  const { error } = await sb.from('comandas').update({ estado }).eq('id', id);
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
