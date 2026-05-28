import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/dev/abrir-caja — revierte el cierre de caja de un turno para la fecha dada
export async function POST(request: Request) {
  try {
    const sb = getServiceSupabase();
    const { fecha, turno } = await request.json();

    if (!fecha) {
      return NextResponse.json({ error: 'Falta la fecha' }, { status: 400 });
    }

    // 1. Revertir comandas de 'Cerrado' a 'Entregado'
    const { error: revertErr, count } = await sb
      .from('comandas')
      .update({ estado: 'Entregado' })
      .eq('estado', 'Cerrado')
      .eq('fecha', fecha);

    if (revertErr) {
      return NextResponse.json({ error: revertErr.message }, { status: 500 });
    }

    // 2. Eliminar la nota de cierre de caja más reciente de esta fecha
    const { data: notas } = await sb
      .from('notas')
      .select('id')
      .ilike('contenido', '%Cierre de Caja%')
      .ilike('contenido', `%${fecha}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let notaBorrada = false;
    if (notas && notas.length > 0) {
      await sb.from('notas').delete().eq('id', notas[0].id);
      notaBorrada = true;
    }

    const turnoLabel = turno === 'maniana' ? 'Turno Mañana' : 'Turno Noche';
    return NextResponse.json({
      success: true,
      message: `✅ Caja reabierta (${turnoLabel} · ${fecha}). ${count ?? 0} comanda(s) revertidas.${notaBorrada ? ' Nota de cierre eliminada.' : ''}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
