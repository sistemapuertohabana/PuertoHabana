import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/reportes/wastes
export async function GET() {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('mermas')
    .select('id, descripcion, costo, fecha')
    .order('fecha', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/reportes/wastes
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { descripcion, costo, fecha } = await request.json();
  if (!descripcion || !costo) {
    return NextResponse.json({ error: 'descripcion y costo son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('mermas')
    .insert([{
      descripcion,
      costo: parseFloat(costo),
      fecha: fecha || new Date().toISOString().split('T')[0],
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// DELETE /api/reportes/wastes?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('mermas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
