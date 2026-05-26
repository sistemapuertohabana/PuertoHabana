import webpush from 'web-push';
import { getServiceSupabase } from './supabase';

// ── Low stock alert helper ────────────────────────────────────────────────────
// Se llama después de actualizar stock para notificar al admin si un producto
// quedó por debajo de su mínimo.
export async function checkAndNotifyLowStock(item: {
  id: string | number;
  nombre: string;
  seccion: string;
  cantidad: number;
  minimo?: number;
  unidad?: string;
}): Promise<void> {
  const minimo = item.minimo ?? 3;
  if (item.cantidad > minimo) return;

  const sb = getServiceSupabase();
  const titulo = `⚠️ Stock Bajo: ${item.nombre}`;
  const unidad = item.unidad || 'unid';
  const mensaje = `"${item.nombre}" (${item.seccion}) tiene solo ${item.cantidad} ${unidad} — mínimo: ${minimo}`;

  // Crear notificación en BD (para toasts en la app)
  await sb
    .from('notificaciones')
    .insert([{ rol_destino: 'admin', titulo, mensaje }])
    .maybeSingle();

  // Enviar push notification nativa (no bloqueante)
  sendPushNotification({
    rol_destino: 'admin',
    titulo,
    mensaje,
    url: '/admin/inventario',
  }).catch(() => {});
}

// ── VAPID Configuration ──────────────────────────────────────────────────────
const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const vapidSubject    = process.env.NEXT_PUBLIC_VAPID_SUBJECT ?? 'mailto:admin@puertohabana.com';

let initialized = false;

function ensureVapid() {
  if (initialized) return true;
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured — push notifications disabled.');
    return false;
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  initialized = true;
  return true;
}

// ── Send push notification to a specific user or role ────────────────────────
export async function sendPushNotification({
  usuario_id,
  rol_destino,
  titulo,
  mensaje,
  url,
}: {
  usuario_id?: string;
  rol_destino?: string;
  titulo: string;
  mensaje: string;
  url?: string;
}): Promise<{ sent: number; removed: number }> {
  if (!ensureVapid()) return { sent: 0, removed: 0 };

  const sb = getServiceSupabase();

  // Build query for subscriptions
  let query = sb.from('suscripciones_push').select('id, usuario_id, subscription');

  if (usuario_id) {
    query = query.eq('usuario_id', usuario_id);
  } else if (rol_destino) {
    query = query.eq('rol', rol_destino);
  } else {
    return { sent: 0, removed: 0 };
  }

  const { data: subscriptions, error } = await query;
  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const payload = JSON.stringify({ titulo, mensaje, url: url || '/', rol_destino });
  let sent = 0;
  const toRemove: number[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription as any, payload);
        sent++;
      } catch (err: any) {
        // Si el push service devuelve 410 Gone o 404 Not Found, la suscripción expiró
        if (err.statusCode === 410 || err.statusCode === 404) {
          toRemove.push(sub.id);
        } else {
          console.warn('[Push] Error sending notification:', err.message);
        }
      }
    })
  );

  // Remove invalid subscriptions
  if (toRemove.length > 0) {
    try {
      await sb.from('suscripciones_push').delete().in('id', toRemove);
    } catch {}
  }

  return { sent, removed: toRemove.length };
}
