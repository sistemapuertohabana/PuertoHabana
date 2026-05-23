import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/reservas?fecha=YYYY-MM-DD
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');

  let query = sb
    .from('reservas')
    .select('id, mesa_id, cliente, telefono, fecha, hora, personas, notas, estado')
    .order('fecha', { ascending: false });

  if (fecha) query = query.eq('fecha', fecha);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/reservas
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { mesa_id, cliente, telefono, fecha, hora, personas, notas } = await request.json();
  if (!cliente || !fecha || !hora) {
    return NextResponse.json({ error: 'cliente, fecha y hora requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('reservas')
    .insert([{
      mesa_id: mesa_id || null,
      cliente,
      telefono: telefono || null,
      fecha,
      hora,
      personas: personas || 2,
      notas: notas || null,
      estado: 'pendiente',
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// DELETE /api/reservas?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('reservas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
