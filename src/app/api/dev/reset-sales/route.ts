import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST() {
  const sb = getServiceSupabase();
  
  // Limpiar comandas (comanda_items se borran por CASCADE si la FK está bien configurada)
  const { error: errorComandas } = await sb.from('comandas').delete().neq('id', 0);
  if (errorComandas) return NextResponse.json({ error: errorComandas.message }, { status: 500 });

  // Limpiar ventas diarias
  const { error: errorVentas } = await sb.from('ventas_diarias').delete().neq('id', 0);
  if (errorVentas) return NextResponse.json({ error: errorVentas.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Todas las ventas y comandas han sido borradas.' });
}
