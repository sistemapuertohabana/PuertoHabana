import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { enviarMensajeTexto, enviarMensajeMasivo, formatearBoletaWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// POST /api/whatsapp/enviar
export async function POST(request: Request) {
  const sb = getServiceSupabase();
  const body = await request.json();
  const { tipo, telefono, mensaje, promocion_id, cliente_ids } = body;

  try {
    switch (tipo) {
      case 'individual': {
        // Enviar a un cliente específico
        if (!telefono || !mensaje) {
          return NextResponse.json({ error: 'telefono y mensaje requeridos' }, { status: 400 });
        }

        const resultado = await enviarMensajeTexto(telefono, mensaje);
        return NextResponse.json(resultado, { status: resultado.success ? 200 : 500 });
      }

      case 'promocion': {
        // Enviar promoción a lista de clientes
        if (!promocion_id && !cliente_ids?.length) {
          return NextResponse.json({ error: 'promocion_id o cliente_ids requeridos' }, { status: 400 });
        }

        let telefonos: string[] = [];

        if (cliente_ids?.length) {
          // Obtener teléfonos de clientes específicos
          const { data: clientes } = await sb
            .from('clientes')
            .select('telefono, nombre')
            .in('id', cliente_ids);

          telefonos = (clientes || [])
            .filter(c => c.telefono)
            .map(c => c.telefono);
        } else if (promocion_id) {
          // Obtener todos los clientes con teléfono
          const { data: clientes } = await sb
            .from('clientes')
            .select('telefono')
            .not('telefono', 'is', null);

          telefonos = (clientes || []).map(c => c.telefono);
        }

        if (!telefonos.length) {
          return NextResponse.json({ error: 'No hay clientes con teléfono registrado' }, { status: 400 });
        }

        // Registrar el envío en BD
        const { data: envio } = await sb
          .from('envios_whatsapp')
          .insert([{
            promocion_id: promocion_id || null,
            tipo: 'promocion',
            mensaje,
            total_destinatarios: telefonos.length,
            estado: 'enviando',
          }])
          .select()
          .single();

        // Enviar mensajes
        const resultado = await enviarMensajeMasivo(telefonos, mensaje);

        // Actualizar registro
        if (envio) {
          await sb
            .from('envios_whatsapp')
            .update({
              enviados: resultado.enviados,
              fallidos: resultado.fallidos,
              enviado_en: new Date().toISOString(),
              estado: resultado.fallidos === 0 ? 'completado' : resultado.enviados > 0 ? 'parcial' : 'fallido',
            })
            .eq('id', envio.id);
        }

        return NextResponse.json({
          success: true,
          ...resultado,
          envio_id: envio?.id,
        });
      }

      case 'boleta': {
        // Enviar boleta/voucher por WhatsApp a un cliente
        const { cliente_nombre, mesa, items, total, metodo_pago } = body;
        if (!telefono || !items?.length) {
          return NextResponse.json({ error: 'telefono e items requeridos' }, { status: 400 });
        }

        const mensajeBoleta = formatearBoletaWhatsApp({
          negocio: 'PUERTO HABANA',
          cliente: cliente_nombre || 'Cliente',
          mesa: mesa || '-',
          items,
          total: total || items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0),
          metodoPago: metodo_pago || 'Efectivo',
        });

        const resultado = await enviarMensajeTexto(telefono, mensajeBoleta);
        return NextResponse.json(resultado, { status: resultado.success ? 200 : 500 });
      }

      default:
        return NextResponse.json({ error: 'Tipo no válido: individual, promocion, boleta' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[WhatsApp API] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
