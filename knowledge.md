# Puerto Habana — Sistema de Gestión para Restaurante

## ¿Qué es?
Sistema integral de gestión para **Puerto Habana Cevichería** con 5 portales: Admin, Mozo, Cocina, Lavaplato y Desarrollador. Construido con **Next.js 16 App Router + TypeScript + Tailwind CSS v4 + Supabase (PostgreSQL)**.

## Comandos principales
| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo (puerto 3000) |
| `pnpm build` | Build de producción |
| `pnpm start` | Inicia servidor de producción |
| `pnpm lint` | ESLint (flat config, `eslint.config.mjs`) |

## Estructura clave
- **`src/app/`** — App Router pages y API routes
- **`src/components/`** — Componentes compartidos (Sidebar, Modal, Boleta, etc.)
- **`src/lib/`** — Utilidades: Supabase client, store local, impresión ESC/POS
- **`src/hooks/`** — Custom hooks (Auth, Realtime, Payments, ProfilePhoto)
- **`src/contexts/`** — ColorModeContext
- **`db/supabase_schema.sql`** — Esquema PostgreSQL completo (usuarios, mesas, comandas, inventario, etc.)
- **`lib/db.ts`** — Cliente MySQL alternativo (setup_db.js también configura MySQL)

## Roles y rutas
| Rol | Login | Dashboard |
|-----|-------|-----------|
| admin | `/login-admin` | `/admin/*` |
| mozo | `/login-mozo` | `/mozo/*` |
| cocina | `/login-cocina` | `/cocina/*` |
| lavaplato | `/login-lavaplato` | `/lavaplato/*` |
| desarrollador | *(sin login propio)* | `/desarrollador/*` |

## Convenciones y gotchas

### Alias de imports
Usar `@/` → `./src/*` (configurado en `tsconfig.json`).

### Store local (localStorage)
- Prefijo de keys: `ph_` (ej: `ph_inventario`, `ph_comandas`, `ph_profile_`)
- Evento `ph_store_update` se dispara al modificar datos locales
- Toda operación de inventario primero intenta API, fallback a localStorage

### Sidebars por rol
Cada rol tiene su propio sidebar: `MozoSidebar`, `CocinaSidebar`, `LavaplatoSidebar`, `DevSidebar`, `Sidebar` (admin). Se usan en `layout.tsx` de cada ruta.

### Impresión ticketera
- Endpoint: `POST /api/print/boleta`
- Protocolo: TCP raw ESC/POS
- Config: `PRINTER_HOST` + `PRINTER_PORT` en `.env.local`

### Supabase
- Cliente público: `getSupabase()` — lazy singleton para browser/Realtime
- Cliente de servicio: `getServiceSupabase()` — server-side con service_role key
- Variables de entorno requeridas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Realtime habilitado para: usuarios, mesas, comandas, comanda_items, inventario, reservas, notificaciones

### CSS
- Tailwind CSS v4 con PostCSS (`postcss.config.mjs`)
- Estilo: Glassmorphism / diseño premium
- Sin modo oscuro (eliminado intencionalmente)
- CSS global en `src/app/globals.css`

### Notificaciones
- Tabla `notificaciones` en Supabase con Realtime
- Componente `NotificacionesToast` para mostrar en UI

### TypeScript
- Modo strict habilitado
- Path alias `@/*`
- Target ES2017, moduleResolution "bundler"
