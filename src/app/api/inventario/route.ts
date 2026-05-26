import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/inventario?seccion=comida&codigo_barras=123
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const seccion = searchParams.get('seccion');
  const codigoBarras = searchParams.get('codigo_barras');

  let query = sb
    .from('inventario')
    .select('id, seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo, codigo_barras, imagen_url, costo, tamanos')
    .order('nombre');

  if (seccion) query = query.eq('seccion', seccion);
  if (codigoBarras) query = query.eq('codigo_barras', codigoBarras);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/inventario
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { seccion, nombre, categoria, tipo, precio, cantidad, unidad, minimo, codigo_barras, imagen_url, costo, tamanos } = await request.json();
  if (!seccion || !nombre) {
    return NextResponse.json({ error: 'seccion y nombre requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('inventario')
    .insert([{
      seccion, nombre,
      categoria: categoria || null,
      tipo: tipo || null,
      precio: precio || 0,
      cantidad: cantidad || 0,
      unidad: unidad || 'unidad',
      minimo: minimo ?? 3,
      codigo_barras: codigo_barras || null,
      imagen_url: imagen_url || null,
      costo: costo || 0,
      tamanos: tamanos || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
