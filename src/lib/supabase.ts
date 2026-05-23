import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

// Cliente público para usar en el navegador y suscripciones realtime
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para obtener un cliente de administración (solo para usar en /api)
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(supabaseUrl, serviceKey);
};
