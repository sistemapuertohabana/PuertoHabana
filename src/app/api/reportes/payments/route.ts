import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/reportes/payments
export async function GET() {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('pagos_personal')
    .select('id, nombre, monto, concepto, fecha')
    .order('fecha', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/reportes/payments
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { nombre, monto, concepto, fecha, usuario_id } = await request.json();
  if (!nombre || !monto || !concepto) {
    return NextResponse.json({ error: 'nombre, monto y concepto son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('pagos_personal')
    .insert([{
      usuario_id: usuario_id || null,
      nombre,
      monto: parseFloat(monto),
      concepto,
      fecha: fecha || new Date().toISOString().split('T')[0],
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// DELETE /api/reportes/payments?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('pagos_personal').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
