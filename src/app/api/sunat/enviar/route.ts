import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { enviarBoleta, generarPayloadBoleta, generarSerie } from '@/lib/nubefact';

export const dynamic = 'force-dynamic';

// POST /api/sunat/enviar
export async function POST(request: Request) {
  try {
    const sb = getServiceSupabase();
    const body = await request.json();
    const { comanda_id, cliente_id, tipo_doc, items, cliente } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'items requeridos' }, { status: 400 });
    }

    // Safety: asegurar que cliente siempre tenga valores
    const clienteData = {
      tipo_doc: (cliente?.tipo_doc as 'DNI' | 'RUC') || 'DNI',
      numero_doc: cliente?.numero_doc || '00000000',
      razon_social: cliente?.razon_social || 'CLIENTE VARIOS',
      direccion: cliente?.direccion || '',
    };

    // Obtener el último número de boleta emitida
    const { data: ultima, error: queryError } = await sb
      .from('boletas_electronicas')
      .select('numero, nubefact_id')
      .eq('tipo_doc', tipo_doc || 'boleta')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) console.error('[SUNAT] Error consultando última boleta:', queryError.message);

    const ultimoNumero = ultima?.numero ? parseInt(ultima.numero) : 0;
    const { serie, numero } = generarSerie(tipo_doc === 'factura' ? 'FACTURA' : 'BOLETA', ultimoNumero);

    // Generar payload completo
    const payload = generarPayloadBoleta({
      tipoDoc: tipo_doc === 'factura' ? 'FACTURA' : 'BOLETA',
      cliente: clienteData,
      items,
      serie,
      observaciones: body.observaciones,
    });

    console.log('[SUNAT] Enviando boleta:', { serie, numero, total: payload.total });

    // Enviar a Nubefact
    const resultado = await enviarBoleta(payload);

    // Guardar en BD
    const totalIGV = payload.total_igv || 0;
    const { data: boletaDb, error: dbError } = await sb
      .from('boletas_electronicas')
      .insert([{
        comanda_id: comanda_id || null,
        cliente_id: cliente_id || null,
        tipo_doc: tipo_doc || 'boleta',
        numero_doc: `${serie}-${numero}`,
        razon_social: payload.cliente.razon_social,
        direccion: payload.cliente.direccion,
        total: payload.total,
        igv: totalIGV,
        estado_sunat: resultado.success ? 'aceptado' : 'rechazado',
        respuesta_sunat: resultado,
        nubefact_id: resultado.nro_doc || `${serie}-${numero}`,
        serie,
        numero,
      }])
      .select()
      .single();

    if (dbError) console.error('[SUNAT] Error guardando en BD:', dbError.message);

    return NextResponse.json({
      success: resultado.success,
      boleta: boletaDb || {
        id: Date.now(),
        serie,
        numero,
        numero_doc: `${serie}-${numero}`,
        total: payload.total,
        estado_sunat: resultado.success ? 'aceptado' : 'rechazado',
      },
      nubefact: resultado,
      mensaje: resultado.mensaje || (resultado.success ? 'Boleta enviada a SUNAT correctamente' : 'Error al enviar a SUNAT'),
    }, { status: resultado.success ? 201 : 500 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[SUNAT] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
