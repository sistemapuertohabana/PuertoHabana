import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const sb = getServiceSupabase();
    
    // Eliminar todas las boletas que tengan estado_sunat = 'rechazado'
    const { data, error } = await sb
      .from('boletas_electronicas')
      .delete()
      .eq('estado_sunat', 'rechazado');

    if (error) {
      console.error('[SUNAT] Error limpiando rechazados:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Historial de rechazados limpiado correctamente' });
  } catch (err) {
    console.error('[SUNAT] Error interno limpiando rechazados:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
