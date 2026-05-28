import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const sb = getServiceSupabase();
    const { mozo_id, mozo_nombre, fecha, turno, total, detalle } = await request.json();

    if (!mozo_id || !mozo_nombre || !fecha) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Update comandas to Cerrado
    const { error: updateErr } = await sb
      .from('comandas')
      .update({ estado: 'Cerrado' })
      .eq('mozo_id', mozo_id)
      .eq('fecha', fecha)
      .eq('estado', 'Entregado');

    if (updateErr) {
      console.error('Error cerrando pedidos:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. Insert nota for Admin history
    const contenido = `Cierre de Caja - Mozo: ${mozo_nombre}\nFecha: ${fecha}\nTurno: ${turno}\nTotal: S/ ${Number(total).toFixed(2)}\n\nDetalle:\n${detalle}`;
    const { error: notaErr } = await sb
      .from('notas')
      .insert([{
        contenido,
        tags: ['cierre', 'caja', mozo_nombre.toLowerCase()],
        monto: Number(total),
        created_at: new Date().toISOString()
      }]);

    if (notaErr) {
      console.error('Error creando nota de cierre:', notaErr.message);
      // No devolvemos 500 aquí para que el cierre de caja no falle
      // si el admin aún no ha creado la tabla notas.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Cierre Caja Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
