import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// PATCH /api/tareas/:id — actualizar tarea (ej: marcar como completada)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;
  const body = await request.json();

  const updateData: any = {};
  if (body.titulo !== undefined) updateData.titulo = body.titulo;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.estado !== undefined) {
    updateData.estado = body.estado;
    if (body.estado === 'completada') {
      updateData.completada_en = new Date().toISOString();
    }
  }
  if (body.fecha_limite !== undefined) updateData.fecha_limite = body.fecha_limite;

  const { data, error } = await sb
    .from('tareas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/tareas/:id — eliminar tarea
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = getServiceSupabase();
  const { id } = await params;

  const { error } = await sb.from('tareas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
