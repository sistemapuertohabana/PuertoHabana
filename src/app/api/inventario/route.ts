import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/inventario?seccion=comida
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const seccion = searchParams.get('seccion');

  let query = sb
    .from('inventario')
    .select('id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo')
    .order('nombre');

  if (seccion) query = query.eq('seccion', seccion);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/inventario
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo } = await request.json();
  if (!seccion || !nombre) {
    return NextResponse.json({ error: 'seccion y nombre requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('inventario')
    .insert([{ seccion, nombre, categoria: categoria || null, tipo: tipo || null, precio: precio || 0, cantidad: cantidad || 0, unidad: unidad || 'unidad', minimo: minimo || 5 }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
