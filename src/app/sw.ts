import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, StaleWhileRevalidate } from "serwist";

declare const self: { __SW_MANIFEST: any };

// ── Página offline de respaldo (fallback HTML minimalista) ────────────────
// Se usa cuando NetworkFirst no puede obtener respuesta ni de la red ni del caché.
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Puerto Habana — Sin conexión</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #0f172a; color: #f1f5f9;
      text-align: center; padding: 24px;
    }
    .card { max-width: 420px; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 0.9rem; color: #94a3b8; line-height: 1.6; }
    .btn {
      display: inline-block; margin-top: 20px; padding: 10px 24px;
      background: #3b82f6; color: #fff; border: none; border-radius: 8px;
      font-size: 0.9rem; cursor: pointer; text-decoration: none;
    }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔌</div>
    <h1>Sin conexión</h1>
    <p>Parece que no hay conexión a Internet en este momento. Intenta de nuevo más tarde.</p>
    <button class="btn" onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>`;

// Plugin que atrapa errores "no-response" de Serwist y devuelve la página offline
const offlineFallbackPlugin = {
  handlerDidError: async () => {
    return new Response(OFFLINE_PAGE, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

// ── Modificar defaultCache para agregar handlerDidError a páginas HTML ────
// Busca la entrada de defaultCache que cachead HTML pages (NetworkFirst)
// y le agrega el plugin de fallback offline.
const patchedDefaultCache = defaultCache.map((entry) => {
  // Si la estrategia es NetworkFirst y el cacheName incluye 'pages'
  // (HTML pages), le agregamos el plugin offlineFallbackPlugin.
  if (
    entry.handler instanceof NetworkFirst &&
    'cacheName' in entry.handler &&
    typeof (entry.handler as any).cacheName === 'string' &&
    (entry.handler as any).cacheName === 'pages'
  ) {
    const originalPlugins = (entry.handler as any).plugins || [];
    return {
      ...entry,
      handler: new NetworkFirst({
        cacheName: (entry.handler as any).cacheName,
        networkTimeoutSeconds: (entry.handler as any).networkTimeoutSeconds,
        fetchOptions: (entry.handler as any).fetchOptions,
        matchOptions: (entry.handler as any).matchOptions,
        plugins: [...originalPlugins, offlineFallbackPlugin],
      }),
    };
  }
  return entry;
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Default Next.js caching (pages, chunks, static assets)
    ...patchedDefaultCache,
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
          offlineFallbackPlugin,
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

// ── Cache buster: fuerza limpieza de cachés viejos al activarse ────────
(self as any).addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      return (self as any).clients.claim();
    })
  );
});

// ── Push notifications ───────────────────────────────────────────────────
// Web Push (VAPID) se maneja aquí. El server-side envía el push desde los
// endpoints de notificaciones. Ver public/sw.js original para referencia.
// Usamos `as any` porque ServiceWorkerGlobalScope no está en el lib DOM.
const swSelf = self as any;

swSelf.addEventListener('push', (event: any) => {
  let data: { titulo?: string; mensaje?: string; url?: string; rol_destino?: string } = {};
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
      sound: '/notification.mp3',
      data: { url: data.url || '/', rol_destino: data.rol_destino || '' },
    })
  );
});

// Click en notificación → abrir/enfocar la app y navegar según el tipo
swSelf.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';
  const rolDestino = data.rol_destino || '';
  
  // Si el push incluyó una URL específica, usarla; si no, mapear por rol
  const rutas: Record<string, string> = {
    cocina: '/cocina',
    mozo: '/mozo',
    admin: '/admin/dashboard',
    lavaplato: '/lavaplato',
  };
  const ruta = url !== '/' ? url : (rutas[rolDestino] || '/');

  event.waitUntil(
    swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients: any[]) => {
      if (clients.length > 0) {
        const client = clients[0];
        client.focus();
        // Enviar mensaje al cliente para navegar (manejado en el layout)
        client.postMessage({ type: 'NAVIGATE', url: ruta });
      } else {
        swSelf.clients.openWindow(ruta);
      }
    })
  );
});
