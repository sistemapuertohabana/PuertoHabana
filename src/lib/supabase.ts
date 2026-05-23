import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// ── Cliente público (browser / Realtime) ──────────────────────────────────────
// Se instancia de forma lazy para que el build no falle si las env no están.
let _publicClient: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_publicClient) {
    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida');
    _publicClient = createClient(supabaseUrl, supabaseKey);
  }
  return _publicClient;
}

// Alias named export para compatibilidad con código que importa `supabase` directamente
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabase().from(...args),
  channel: (...args: Parameters<SupabaseClient['channel']>) => getSupabase().channel(...args),
  removeChannel: (...args: Parameters<SupabaseClient['removeChannel']>) => getSupabase().removeChannel(...args),
};

// ── Cliente de servicio (API routes — solo servidor) ──────────────────────────
let _serviceClient: SupabaseClient | null = null;
export function getServiceSupabase(): SupabaseClient {
  if (!_serviceClient) {
    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida');
    if (!serviceKey)  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida');
    _serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _serviceClient;
}
