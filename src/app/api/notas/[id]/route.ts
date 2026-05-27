import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/notas/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { contenido } = await request.json();

  if (!contenido || !contenido.trim()) {
    return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
  }

  const { error } = await sb
    .from('notas')
    .update({ contenido: contenido.trim() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/notas/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('notas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
