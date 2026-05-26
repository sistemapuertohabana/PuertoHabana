import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/promociones?activa=true
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const activa = searchParams.get('activa');

  const tipo = searchParams.get('tipo');

  // Si es consulta de historial de envíos
  if (tipo === 'envios') {
    const { data: envios, error: enviosErr } = await sb
      .from('envios_whatsapp')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (enviosErr) return NextResponse.json({ error: enviosErr.message }, { status: 500 });
    return NextResponse.json({ envios: envios || [] });
  }

  let query = sb.from('promociones').select('*').order('created_at', { ascending: false });

  if (activa === 'true') query = query.eq('activa', true);
  if (activa === 'false') query = query.eq('activa', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/promociones
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const body = await request.json();
  const { titulo, descripcion, tipo, descuento_porcentaje, fecha_inicio, fecha_fin, activa, imagen_url } = body;

  if (!titulo || !descripcion) {
    return NextResponse.json({ error: 'titulo y descripcion son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('promociones')
    .insert([{
      titulo,
      descripcion,
      tipo: tipo || 'general',
      descuento_porcentaje: descuento_porcentaje || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      activa: activa !== undefined ? activa : true,
      imagen_url: imagen_url || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/promociones?id=xxx
export async function PATCH(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const body = await request.json();
  const campos = ['titulo', 'descripcion', 'tipo', 'descuento_porcentaje', 'fecha_inicio', 'fecha_fin', 'activa', 'imagen_url'];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  for (const campo of campos) {
    if (body[campo] !== undefined) updates[campo] = body[campo];
  }

  const { data, error } = await sb
    .from('promociones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/promociones?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('promociones').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
