import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PUT /api/inventario/:seccion/:id
export async function PUT(request: Request, { params }: { params: Promise<{ seccion: string; id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const { nombre, categoria, tipo, precio, cantidad, unidad, minimo } = await request.json();

  const { error } = await sb
    .from('inventario')
    .update({ nombre, categoria: categoria || null, tipo: tipo || null, precio: precio || 0, cantidad: cantidad || 0, unidad: unidad || 'unidad', minimo: minimo || 5 })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
