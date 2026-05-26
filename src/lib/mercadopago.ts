import { getServiceSupabase } from './supabase';

/**
 * Obtiene el Access Token de Mercado Pago.
 * Prioriza process.env, luego Supabase config.
 */
export async function getMercadoPagoToken(): Promise<string | null> {
  // 1. Intentar desde variable de entorno
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return process.env.MERCADOPAGO_ACCESS_TOKEN;
  }

  // 2. Fallback: leer desde Supabase config
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('configuracion')
      .select('valor')
      .eq('clave', 'mp_access_token')
      .maybeSingle();

    if (!error && data?.valor) {
      return data.valor as string;
    }
  } catch {
    // Ignorar errores de conexión
  }

  return null;
}

/**
 * Verifica si el token de MP está configurado.
 */
export async function isMercadoPagoConfigured(): Promise<boolean> {
  const token = await getMercadoPagoToken();
  return token !== null && token.length > 0;
}
