import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * GET /api/configuracion?clave=turnos_config
 * Devuelve el valor de una clave de configuración como JSON parseado.
 */
export async function GET(req: NextRequest) {
  try {
    const clave = req.nextUrl.searchParams.get('clave');
    if (!clave) {
      return NextResponse.json({ error: 'Parámetro "clave" requerido' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', clave)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado — no es error
        return NextResponse.json({ valor: null });
      }
      throw error;
    }

    try {
      return NextResponse.json({ valor: data?.valor ? JSON.parse(data.valor) : null });
    } catch {
      return NextResponse.json({ valor: data?.valor ?? null });
    }
  } catch (err) {
    console.error('[Config API] Error GET:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * POST /api/configuracion
 * Body: { clave: string, valor: any }
 * Upsert: guarda o actualiza la clave en Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clave, valor } = body;

    if (!clave) {
      return NextResponse.json({ error: 'Campo "clave" requerido' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const valorStr = typeof valor === 'string' ? valor : JSON.stringify(valor);

    const { error } = await supabase
      .from('configuracion')
      .upsert({ clave, valor: valorStr }, { onConflict: 'clave' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Config API] Error POST:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
