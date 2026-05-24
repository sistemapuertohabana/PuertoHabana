import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, StaleWhileRevalidate } from "serwist";

declare const self: { __SW_MANIFEST: any };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Default Next.js caching (pages, chunks, static assets)
    ...defaultCache,
    {
      // Network-First for API routes — usa la red si está disponible,
      // fallback a cache si estás offline
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Solo cachear respuestas exitosas (GET)
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
          },
        ],
      }),
    },
    {
      // Stale-while-revalidate para imágenes y assets
      matcher: ({ url }) =>
        url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/i) !== null,
      handler: new StaleWhileRevalidate({
        cacheName: "image-cache",
      }),
    },
  ],
});

serwist.addEventListeners();

// ── Push notifications ───────────────────────────────────────────────────
// Web Push (VAPID) se maneja aquí. El server-side envía el push desde los
// endpoints de notificaciones. Ver public/sw.js original para referencia.
// Usamos `as any` porque ServiceWorkerGlobalScope no está en el lib DOM.
const swSelf = self as any;

swSelf.addEventListener('push', (event: any) => {
  let data: { titulo?: string; mensaje?: string } = {};
  if (event.data) {
    try { data = event.data.json(); } catch { data = { titulo: event.data.text() }; }
  }
  const title = data.titulo || 'Puerto Habana';
  const body  = data.mensaje || 'Tienes una nueva notificación';
  event.waitUntil(
    swSelf.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      vibrate: [200, 100, 200],
    })
  );
});

// Click en notificación → abrir/enfocar la app
swSelf.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients: any[]) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        swSelf.clients.openWindow('/');
      }
    })
  );
});
