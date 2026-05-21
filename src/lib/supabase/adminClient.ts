import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Server‑side Supabase client that uses the SERVICE_ROLE_KEY.
 * This client bypasses RLS and can read/write any table.
 * It must only be used in server‑only code (API routes, server actions, etc.).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY missing. Check your environment variables.');
  }
  return createSupabaseClient<Database>(url, serviceKey);
}
