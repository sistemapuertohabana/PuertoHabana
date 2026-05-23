self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // Manejo de Web Push en el futuro si se añade VAPID
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.titulo || 'Notificación', {
      body: data.mensaje || 'Tienes una nueva alerta',
      icon: '/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
