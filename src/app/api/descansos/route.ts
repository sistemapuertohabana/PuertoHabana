import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

// GET /api/descansos?usuario_id=xxx&mes=2026-05
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuario_id');
  const mes = searchParams.get('mes'); // formato YYYY-MM

  let query = sb.from('descansos').select('*').order('fecha', { ascending: false });

  if (usuarioId) query = query.eq('usuario_id', usuarioId);
  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    const inicio = `${year}-${String(month).padStart(2, '0')}-01`;
    const fin = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    query = query.gte('fecha', inicio).lt('fecha', fin);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/descansos
// Body: { usuario_id, fecha, motivo? }
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { usuario_id, fecha, motivo } = await request.json();

  if (!usuario_id || !fecha) {
    return NextResponse.json({ error: 'usuario_id y fecha son requeridos' }, { status: 400 });
  }

  // Verificar que el usuario existe
  const { data: usuario } = await sb
    .from('usuarios')
    .select('id, nombre, rol')
    .eq('id', usuario_id)
    .single();

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // Insertar o actualizar (si ya tiene descanso ese día, se reemplaza)
  const { data, error } = await sb
    .from('descansos')
    .upsert(
      { usuario_id, fecha, motivo: motivo || null },
      { onConflict: 'usuario_id, fecha', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    // Si la tabla no existe, intentar crearla
    if (error.code === '42P01') {
      try {
        await sb.rpc('crear_tabla_descansos');
      } catch {}
      return NextResponse.json({ error: 'Tabla descansos no disponible. Usando almacenamiento local.' }, { status: 501 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enviar notificación al empleado
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  sendPushNotification({
    usuario_id,
    titulo: '🌴 Día de Descanso Asignado',
    mensaje: `Has sido asignado para descansar el ${fechaFormateada}${motivo ? ` (${motivo})` : ''}`,
    url: '/',
  }).catch(() => {});

  // También notificar al admin como confirmación
  sendPushNotification({
    rol_destino: 'admin',
    titulo: '✅ Descanso Registrado',
    mensaje: `${usuario.nombre} descansará el ${fechaFormateada}`,
    url: '/admin/personal',
  }).catch(() => {});

  return NextResponse.json({ success: true, data }, { status: 201 });
}

// DELETE /api/descansos?id=xxx  o  ?usuario_id=xxx&fecha=YYYY-MM-DD
export async function DELETE(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const usuarioId = searchParams.get('usuario_id');
  const fecha = searchParams.get('fecha');

  let query = sb.from('descansos').delete();

  if (id) {
    query = query.eq('id', id);
  } else if (usuarioId && fecha) {
    query = query.eq('usuario_id', usuarioId).eq('fecha', fecha);
  } else {
    return NextResponse.json({ error: 'Se requiere id o (usuario_id + fecha)' }, { status: 400 });
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
