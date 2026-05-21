# Configuración Supabase — Puerto Habana

## 1. Crear proyecto

1. Ir a [supabase.com](https://supabase.com) y crear un proyecto (región `sa-east-1` recomendada).
2. Copiar **Project URL** y **anon key** desde Settings → API.

## 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # solo servidor, opcional
PRINTER_HOST=192.168.1.100         # IP de la ticketera
PRINTER_PORT=9100
NEXT_PUBLIC_NEGOCIO_RUC=20123456789
NEXT_PUBLIC_NEGOCIO_NOMBRE=Puerto Habana
```

## 3. Ejecutar migración SQL

En el panel Supabase → **SQL Editor**, pegar y ejecutar todo el contenido de:

`supabase/migrations/001_initial.sql`

## 4. Registrar el administrador (recomendado)

1. Añade en `.env.local` la **service_role key** (Supabase → Settings → API):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu-service-role-key
```

2. Reinicia `pnpm dev` y abre **http://localhost:3000/registro-admin**

3. Completa nombre, correo y contraseña (mín. 8 caracteres). Solo funciona **una vez** (si no hay admin en `profiles`).

4. Inicia sesión en `/login` con ese correo y contraseña.

También verás el enlace **“Registrar administrador”** en la pantalla de login si aún no existe un admin.

### Usuarios adicionales (mozo, cocina)

Créalos en **Authentication → Users → Add user** con metadata, por ejemplo:

| Email | Metadata |
|-------|----------|
| mozo@puertohabana.pe | `{"nombre":"Juan Pérez","rol":"mozo"}` |
| cocina@puertohabana.pe | `{"nombre":"Ana Gómez","rol":"cocina"}` |

El trigger `on_auth_user_created` crea la fila en `profiles`.

## 5. Habilitar Realtime

En **Database → Replication**, verificar que `comanda_items`, `comandas` y `mesas` estén en la publicación `supabase_realtime` (la migración lo intenta añadir).

## 6. Ejecutar la app

```bash
pnpm install
pnpm dev
```

Abrir `http://localhost:3000` → redirige a login.

## 7. Ticketera en red

- La impresión RAW TCP se hace desde `POST /api/print/boleta` (servidor Next.js).
- El servidor debe poder alcanzar `PRINTER_HOST` en la LAN del restaurante.
- Si despliegas en Vercel/nube, necesitas VPN o un agente local en la PC de caja.

## Roles y rutas

| Rol | Ruta |
|-----|------|
| admin | `/admin/*` |
| mozo | `/mozo/*` |
| cocina | `/cocina/*` |
