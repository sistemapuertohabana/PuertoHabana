import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/notificaciones?rol=mozo&usuario_id=xxx
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const rol = searchParams.get('rol');
  const usuario_id = searchParams.get('usuario_id');

  let query = sb.from('notificaciones').select('*').eq('leida', 0).order('created_at', { ascending: false }).limit(10);

  if (usuario_id && usuario_id !== 'null') {
    query = query.eq('usuario_id', usuario_id);
  } else if (rol) {
    query = query.eq('rol_destino', rol);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/notificaciones
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { usuario_id, rol_destino, titulo, mensaje } = await request.json();

  const { error } = await sb.from('notificaciones').insert([{
    usuario_id: usuario_id || null,
    rol_destino: rol_destino || null,
    titulo,
    mensaje,
    leida: 0
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
