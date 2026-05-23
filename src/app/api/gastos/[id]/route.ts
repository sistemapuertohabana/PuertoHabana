import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/gastos/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { descripcion, categoria, monto, fecha } = await request.json();

  const { error } = await sb
    .from('gastos')
    .update({ descripcion, categoria, monto: parseFloat(monto), fecha })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/gastos/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('gastos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
