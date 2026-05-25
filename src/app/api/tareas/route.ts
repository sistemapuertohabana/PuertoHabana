import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/tareas — lista todas las tareas, opcional filtro por asignado_a
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const asignadoA = searchParams.get('asignado_a');
  const estado = searchParams.get('estado');

  let query = sb
    .from('tareas')
    .select('*, creador:creado_por(nombre), asignado:asignado_a(nombre)')
    .order('created_at', { ascending: false });

  if (asignadoA) query = query.eq('asignado_a', asignadoA);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/tareas — crear nueva tarea
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { titulo, descripcion, asignado_a, creado_por, fecha_limite } = await request.json();

  if (!titulo || !asignado_a) {
    return NextResponse.json({ error: 'titulo y asignado_a son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('tareas')
    .insert([{
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      asignado_a,
      creado_por: creado_por || null,
      fecha_limite: fecha_limite || null,
      estado: 'pendiente',
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
