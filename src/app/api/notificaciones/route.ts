import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/notificaciones?usuario_id=xxx  o  ?rol_destino=mozo
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const usuario_id  = searchParams.get('usuario_id');
  const rol_destino = searchParams.get('rol_destino');
  const leidaParam  = searchParams.get('leida');

  let query = sb
    .from('notificaciones')
    .select('id, usuario_id, rol_destino, titulo, mensaje, leida, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (usuario_id)  query = query.eq('usuario_id', usuario_id);
  if (rol_destino) query = query.eq('rol_destino', rol_destino);
  if (leidaParam !== null) {
    query = query.eq('leida', leidaParam === 'true');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/notificaciones — crear notificación
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { usuario_id, rol_destino, titulo, mensaje } = await request.json();
  if (!titulo || !mensaje) {
    return NextResponse.json({ error: 'titulo y mensaje son requeridos' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('notificaciones')
    .insert([{ usuario_id: usuario_id || null, rol_destino: rol_destino || null, titulo, mensaje }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// PATCH /api/notificaciones — marcar como leída
export async function PATCH(request: Request) {
  const sb = getServiceSupabase();
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/notificaciones?id=xxx
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await sb.from('notificaciones').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
