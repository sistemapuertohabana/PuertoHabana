/**
 * Genera un par de llaves VAPID para las notificaciones push.
 * Ejecutar: node scripts/generate-vapid.js
 *
 * Luego agrega las llaves generadas a tu archivo .env.local:
 *
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
 *   VAPID_PRIVATE_KEY=<privateKey>
 *   NEXT_PUBLIC_VAPID_SUBJECT=mailto:admin@puertohabana.com
 */

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║               🔐 LLAVES VAPID GENERADAS                 ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(' Agrega lo siguiente a tu archivo .env.local:\n');
console.log(` NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(` VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(' NEXT_PUBLIC_VAPID_SUBJECT=mailto:admin@puertohabana.com');
console.log('');
console.log('⚠️  La VAPID_PRIVATE_KEY debe mantenerse en secreto y NUNCA');
console.log('   exponerse en el frontend o en variables NEXT_PUBLIC_.');
console.log('');
