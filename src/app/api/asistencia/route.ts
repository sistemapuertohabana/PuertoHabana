import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

interface AsistenciaRow {
  id: number;
  usuario_id: string;
  fecha: string;
  hora_llegada: string;
  created_at: string;
  usuarios?: {
    nombre: string;
    rol: string;
    foto_url?: string;
  } | null;
}

// GET /api/asistencia
//   ?fecha=2026-05-25       — filtrar por fecha (opcional, default hoy)
//   ?usuario_id=xxx         — filtrar por usuario (opcional)
//   ?today                  — solo las de hoy (shortcut)
//   ?mes=2026-05            — filtrar por mes completo
export async function GET(request: Request) {
  const sb = getServiceSupabase();
  const { searchParams } = new URL(request.url);

  let fecha = searchParams.get('fecha');
  const mes = searchParams.get('mes');
  if (!fecha && searchParams.has('today')) {
    const hoy = new Date();
    const utcMs = hoy.getTime() + (hoy.getTimezoneOffset() * 60000);
    const peruMs = utcMs - (5 * 60 * 60 * 1000);
    const peruDate = new Date(peruMs);
    fecha = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
  }

  const usuarioId = searchParams.get('usuario_id');

  let query = sb
    .from('asistencia')
    .select(`
      id,
      usuario_id,
      fecha,
      hora_llegada,
      created_at,
      usuarios!inner(nombre, rol, foto_url)
    `)
    .order('hora_llegada', { ascending: true });

  if (fecha) query = query.eq('fecha', fecha);
  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    const inicio = `${year}-${String(month).padStart(2, '0')}-01`;
    const fin = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    query = query.gte('fecha', inicio).lt('fecha', fin);
  }
  if (usuarioId) query = query.eq('usuario_id', usuarioId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/asistencia — registrar asistencia (check-in)
// Body: { usuario_id: string }
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const { usuario_id } = await request.json();

  if (!usuario_id) {
    return NextResponse.json({ error: 'usuario_id es requerido' }, { status: 400 });
  }

  // Verificar que el usuario existe y está activo
  const { data: usuario, error: userError } = await sb
    .from('usuarios')
    .select('id, nombre, rol')
    .eq('id', usuario_id)
    .eq('activo', true)
    .single();

  if (userError || !usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 });
  }

  // Fecha y hora actual en UTC-5 (Perú)
  const ahora = new Date();
  // Convertir a Perú (UTC-5) independientemente de la zona horaria del servidor
  const utcMs = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
  const peruMs = utcMs - (5 * 60 * 60 * 1000); // UTC-5
  const peruDate = new Date(peruMs);
  const fechaLocal = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
  const horaLocal = `${String(peruDate.getHours()).padStart(2, '0')}:${String(peruDate.getMinutes()).padStart(2, '0')}:${String(peruDate.getSeconds()).padStart(2, '0')}`;

  // Intentar insertar — si ya existe (unique constraint), devolver error
  const { data, error } = await sb
    .from('asistencia')
    .insert([{
      usuario_id,
      fecha: fechaLocal,
      hora_llegada: horaLocal,
    }])
    .select('id, usuario_id, fecha, hora_llegada')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique violation — ya registró asistencia hoy
      return NextResponse.json({ error: 'Ya registraste tu asistencia hoy' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Crear notificación para el admin y enviar push
  const rolLabel: Record<string, string> = {
    mozo: 'Mozo',
    cocina: 'Cocinero',
    ayudante_cocina: 'Ayudante de Cocina',
    lavaplato: 'Lavaplatos',
  };

  const tituloNotif = '👋 Asistencia Registrada';
  const mensajeNotif = `${rolLabel[usuario.rol] || usuario.rol} ${usuario.nombre} marcó asistencia a las ${horaLocal.slice(0, 5)} hrs`;
  const urlNotif = '/admin/personal';

  try {
    await sb
      .from('notificaciones')
      .insert([{
        rol_destino: 'admin',
        titulo: tituloNotif,
        mensaje: mensajeNotif,
      }])
      .select('id')
      .single();

    // Enviar push notification directa al admin (no bloqueante)
    sendPushNotification({
      rol_destino: 'admin',
      titulo: tituloNotif,
      mensaje: mensajeNotif,
      url: urlNotif,
    }).catch(() => {});
  } catch {}

  return NextResponse.json({ success: true, data }, { status: 201 });
}
