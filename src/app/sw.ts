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
