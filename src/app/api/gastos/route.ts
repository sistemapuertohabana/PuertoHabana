import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/gastos
export async function GET() {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('gastos')
    .select('id, descripcion, categoria, monto, fecha')
    .order('fecha', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/gastos
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { descripcion, categoria, monto, fecha } = await request.json();
  if (!descripcion || !monto) {
    return NextResponse.json({ error: 'descripcion y monto son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('gastos')
    .insert([{
      descripcion,
      categoria: categoria || 'Otros',
      monto: parseFloat(monto),
      fecha: fecha || new Date().toISOString().split('T')[0],
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
