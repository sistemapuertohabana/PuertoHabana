/**
 * Script de prueba para verificar que las notificaciones push funcionan.
 *
 * Uso:
 *   node scripts/test-push.js                        # Envía un test a TODAS las suscripciones
 *   node scripts/test-push.js --rol mozo             # Solo a suscripciones de mozo
 *   node scripts/test-push.js --rol admin            # Solo a suscripciones de admin
 *   node scripts/test-push.js --list                 # Lista suscripciones activas sin enviar
 *   node scripts/test-push.js --check-env            # Verifica que las VAPID keys existan
 *   node scripts/test-push.js --clean                # Limpia suscripciones inválidas
 *
 * Requisitos:
 *   - .env.local con VAPID keys y Supabase config
 *   - Un navegador con la app abierta y notificaciones activadas
 *     (ve a Perfil → activar notificaciones y concede permiso)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

// ── Cargar .env.local manualmente (sin depender de dotenv) ───────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Remover comillas si existen
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
} catch (err) {
  console.error('\n❌ No se pudo leer .env.local:', err.message);
  console.error('   Asegúrate de ejecutar el script desde la raíz del proyecto.');
  process.exit(1);
}

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT     = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@puertohabana.com';
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// ── Parsear args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS = {
  rol:      args.includes('--rol')      ? args[args.indexOf('--rol') + 1]      : null,
  list:     args.includes('--list'),
  checkEnv: args.includes('--check-env'),
  clean:    args.includes('--clean'),
};

// ── Colores para consola ─────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(msg, color = C.reset) {
  console.log(color + msg + C.reset);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. VERIFICAR ENTORNO
// ═══════════════════════════════════════════════════════════════════════════════

function checkEnv() {
  log('\n╔══════════════════════════════════════════════════════╗', C.cyan);
  log('║   🔍 VERIFICANDO CONFIGURACIÓN DEL ENTORNO        ║', C.cyan);
  log('╚══════════════════════════════════════════════════════╝', C.cyan);

  let ok = true;

  if (VAPID_PUBLIC_KEY) {
    log(`  ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY = ${VAPID_PUBLIC_KEY.slice(0, 20)}...`, C.green);
  } else {
    log('  ❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY no está definida', C.red);
    ok = false;
  }

  if (VAPID_PRIVATE_KEY) {
    log(`  ✅ VAPID_PRIVATE_KEY = ${VAPID_PRIVATE_KEY.slice(0, 10)}...`, C.green);
  } else {
    log('  ❌ VAPID_PRIVATE_KEY no está definida', C.red);
    ok = false;
  }

  if (VAPID_SUBJECT) {
    log(`  ✅ NEXT_PUBLIC_VAPID_SUBJECT = ${VAPID_SUBJECT}`, C.green);
  }

  if (SUPABASE_URL) {
    log(`  ✅ NEXT_PUBLIC_SUPABASE_URL = ${SUPABASE_URL}`, C.green);
  } else {
    log('  ❌ NEXT_PUBLIC_SUPABASE_URL no está definida', C.red);
    ok = false;
  }

  if (SUPABASE_KEY) {
    log(`  ✅ Supabase Key presente (${SUPABASE_KEY.slice(0, 8)}...)`, C.green);
  } else {
    log('  ❌ No hay keys de Supabase configuradas', C.red);
    ok = false;
  }

  // Verificar que web-push funciona con las VAPID keys
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    log('  ✅ web-push inicializado correctamente con VAPID keys', C.green);
  } catch (err) {
    log(`  ❌ Error al inicializar web-push: ${err.message}`, C.red);
    ok = false;
  }

  return ok;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  2. LISTAR SUSCRIPCIONES
// ═══════════════════════════════════════════════════════════════════════════════

async function listSubscriptions(supabase) {
  log('\n╔══════════════════════════════════════════════════════╗', C.cyan);
  log('║   📋 SUSCRIPCIONES PUSH ACTIVAS                    ║', C.cyan);
  log('╚══════════════════════════════════════════════════════╝', C.cyan);

  let query = supabase
    .from('suscripciones_push')
    .select('id, usuario_id, rol, created_at');

  if (FLAGS.rol) {
    query = query.eq('rol', FLAGS.rol);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    log(`  ❌ Error al consultar suscripciones: ${error.message}`, C.red);
    return [];
  }

  if (!data || data.length === 0) {
    log('  ⚠️  No hay suscripciones push activas.', C.yellow);
    log('  💡 Abre la app en un navegador, ve a Perfil → activa notificaciones', C.dim);
    log('      y concede el permiso cuando el navegador lo solicite.', C.dim);
    return [];
  }

  log(`  📊 Total: ${data.length} suscripciones activas\n`, C.bold);
  data.forEach((sub, i) => {
    log(`  ${i + 1}. ID: ${sub.id}  |  Rol: ${sub.rol || '—'}  |  Usuario: ${sub.usuario_id ? sub.usuario_id.slice(0, 8) + '...' : '—'}  |  ${new Date(sub.created_at).toLocaleString()}`, C.dim);
  });

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. ENVIAR NOTIFICACIÓN DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════════

async function sendTestPush(supabase) {
  log('\n╔══════════════════════════════════════════════════════╗', C.cyan);
  log('║   📨 ENVIANDO NOTIFICACIÓN PUSH DE PRUEBA          ║', C.cyan);
  log('╚══════════════════════════════════════════════════════╝', C.cyan);

  // Inicializar web-push
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Obtener suscripciones
  let query = supabase
    .from('suscripciones_push')
    .select('id, usuario_id, rol, subscription');

  if (FLAGS.rol) {
    log(`  🎯 Filtrando por rol: ${FLAGS.rol}`, C.blue);
    query = query.eq('rol', FLAGS.rol);
  } else {
    log('  🎯 Enviando a TODOS los roles', C.blue);
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    log(`  ❌ Error al consultar suscripciones: ${error.message}`, C.red);
    return { sent: 0, removed: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    log('  ⚠️  No hay suscripciones para enviar.', C.yellow);
    log('  💡 Abre la app en un navegador, activa notificaciones en Perfil', C.dim);
    return { sent: 0, removed: 0 };
  }

  log(`  📊 Enviando a ${subscriptions.length} suscripciones...\n`, C.bold);

  const payload = JSON.stringify({
    titulo: '🔔 Notificación de Prueba',
    mensaje: 'Si ves esto, ¡las notificaciones push funcionan correctamente! 🎉',
    url: '/',
    rol_destino: FLAGS.rol || 'todos',
  });

  let sent = 0;
  let failed = 0;
  const toRemove = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub.subscription, payload);
      sent++;
      log(`  ✅ Enviada a suscripción #${sub.id} (${sub.rol || 'sin rol'})`, C.green);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        log(`  ❌ Suscripción #${sub.id} expirada (410 Gone) — será eliminada`, C.red);
        toRemove.push(sub.id);
      } else {
        log(`  ❌ Error en suscripción #${sub.id}: ${err.message}`, C.red);
        failed++;
      }
    }
  }

  // Limpiar suscripciones inválidas
  if (toRemove.length > 0) {
    log(`\n  🧹 Eliminando ${toRemove.length} suscripciones expiradas...`, C.yellow);
    const { error: delErr } = await supabase
      .from('suscripciones_push')
      .delete()
      .in('id', toRemove);
    if (delErr) {
      log(`  ❌ Error al limpiar: ${delErr.message}`, C.red);
    } else {
      log(`  ✅ ${toRemove.length} suscripciones expiradas eliminadas`, C.green);
    }
  }

  log(`\n  ───────────────────────────────────────`, C.dim);
  log(`  📨 Enviadas: ${sent}  |  ❌ Fallos: ${failed}  |  🗑️ Removidas: ${toRemove.length}`, C.bold);
  log(`  ───────────────────────────────────────`, C.dim);

  return { sent, removed: toRemove.length };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  4. LIMPIAR SUSCRIPCIONES INVÁLIDAS
// ═══════════════════════════════════════════════════════════════════════════════

async function cleanSubscriptions(supabase) {
  log('\n╔══════════════════════════════════════════════════════╗', C.cyan);
  log('║   🧹 LIMPIANDO SUSCRIPCIONES INVÁLIDAS              ║', C.cyan);
  log('╚══════════════════════════════════════════════════════╝', C.cyan);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const { data: subscriptions, error } = await supabase
    .from('suscripciones_push')
    .select('id, subscription');

  if (error) {
    log(`  ❌ Error: ${error.message}`, C.red);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    log('  ✅ No hay suscripciones que limpiar', C.green);
    return;
  }

  log(`  🔍 Probando ${subscriptions.length} suscripciones...`, C.blue);
  const toRemove = [];

  for (const sub of subscriptions) {
    try {
      // Enviar un push con TTL=0 para probar sin mostrar al usuario
      await webpush.sendNotification(sub.subscription, JSON.stringify({}), { TTL: 0 });
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        toRemove.push(sub.id);
      }
    }
  }

  if (toRemove.length > 0) {
    await supabase.from('suscripciones_push').delete().in('id', toRemove);
    log(`  🗑️  Eliminadas ${toRemove.length} suscripciones inválidas`, C.yellow);
  } else {
    log('  ✅ Todas las suscripciones son válidas', C.green);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  log('', C.reset);
  log('╔══════════════════════════════════════════════════════╗', C.cyan);
  log('║   🚀 PUERTO HABANA — TEST DE NOTIFICACIONES PUSH   ║', C.cyan);
  log('╚══════════════════════════════════════════════════════╝', C.cyan);

  // ── Check env ──
  const envOk = checkEnv();
  if (FLAGS.checkEnv) {
    process.exit(envOk ? 0 : 1);
  }
  if (!envOk) {
    log('\n  ❌ Configuración inválida. Corrige los errores y vuelve a intentar.', C.red);
    log('  💡 Ejecuta: node scripts/generate-vapid.js para generar nuevas llaves VAPID\n', C.dim);
    process.exit(1);
  }

  // ── Conectar Supabase ──
  log('\n  🔌 Conectando a Supabase...', C.blue);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Probar conexión
  const { error: pingErr } = await supabase.from('suscripciones_push').select('count', { count: 'exact', head: true });
  if (pingErr) {
    log(`  ❌ Error de conexión a Supabase: ${pingErr.message}`, C.red);
    process.exit(1);
  }
  log('  ✅ Conexión a Supabase exitosa', C.green);

  // ── Ejecutar según flags ──
  if (FLAGS.list) {
    await listSubscriptions(supabase);
  } else if (FLAGS.clean) {
    await cleanSubscriptions(supabase);
  } else {
    // Mostrar resumen de suscripciones
    const subs = await listSubscriptions(supabase);

    if (subs.length > 0) {
      // Enviar test
      const result = await sendTestPush(supabase);

      if (result.sent > 0) {
        log('\n  ✅ NOTIFICACIONES PUSH FUNCIONANDO CORRECTAMENTE 🎉', C.green);
        log('  💡 Abre la app en el navegador — debería aparecer una notificación nativa', C.dim);
        log('      con sonido 🔔 en unos segundos.', C.dim);
      } else {
        log('\n  ⚠️  No se pudo enviar ninguna notificación.', C.yellow);
        if (result.removed > 0) {
          log('  ✅ Suscripciones expiradas fueron limpiadas automáticamente.', C.green);
          log('  💡 Vuelve a abrir la app, activa notificaciones en Perfil y prueba de nuevo.', C.dim);
        }
      }
    }
  }

  log('\n' + '─'.repeat(50), C.dim);
  log('', C.reset);
}

main().catch((err) => {
  console.error('\n❌ Error inesperado:', err);
  process.exit(1);
});
