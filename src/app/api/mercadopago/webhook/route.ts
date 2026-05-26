import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getMercadoPagoToken } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// Mercado Pago envía notificaciones POST a esta URL
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Mercado Pago Webhook recibido:', JSON.stringify(body));

    const { type, data, topic, resource } = body;

    // Determinar el tipo de notificación
    const paymentId = data?.id || resource;

    // Solo procesar notificaciones de payment
    const notificationType = type || topic;
    if (notificationType !== 'payment' && !paymentId) {
      return NextResponse.json({ received: true });
    }

    const mpToken = await getMercadoPagoToken();
    if (!mpToken) {
      console.error('Mercado Pago no configurado');
      return NextResponse.json({ error: 'No configurado' }, { status: 500 });
    }

    // Obtener detalles del pago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });

    if (!paymentRes.ok) {
      console.error('Error fetching payment details:', paymentRes.status);
      return NextResponse.json({ error: 'Error fetching payment' }, { status: 502 });
    }

    const payment = await paymentRes.json();
    console.log('Payment details:', JSON.stringify({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
      payment_method_id: payment.payment_method_id,
    }));

    // Si el pago fue aprobado, actualizar la comanda
    if (payment.status === 'approved') {
      const comandaId = parseInt(payment.external_reference);

      if (comandaId && !isNaN(comandaId)) {
        try {
          const sb = getServiceSupabase();

          // Actualizar estado de la comanda a Entregado
          const { error: updateError } = await sb
            .from('comandas')
            .update({
              estado: 'Entregado',
              metodo_pago: 'Tarjeta',
              notas: `Pagado con Tarjeta (Mercado Pago) · ${payment.payment_method_id} · Ref: ${payment.id}`,
            })
            .eq('id', comandaId);

          if (updateError) {
            console.error('Error updating comanda:', updateError);
          } else {
            console.log(`✅ Comanda ${comandaId} marcada como pagada con Tarjeta (MP)`);
          }

          // Notificar al admin
          await sb.from('notificaciones').insert({
            rol_destino: 'admin',
            titulo: '💳 Pago con Tarjeta Recibido',
            mensaje: `Pago de S/ ${payment.transaction_amount} aprobado vía ${payment.payment_method_id}`,
          }).maybeSingle();

          // Actualizar preferencia en nuestra BD
          await sb.from('mercadopago_preferencias')
            .update({ estado: 'aprobado', payment_id: payment.id })
            .eq('external_reference', String(comandaId))
            .maybeSingle();

        } catch (e) {
          console.error('Error updating comanda from webhook:', e);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error en webhook MP:', err);
    // Siempre responder 200 para que MP no reintente
    return NextResponse.json({ received: true });
  }
}

// Mercado Pago también puede enviar GET para verificar el webhook
export async function GET(request: Request) {
  return NextResponse.json({ ok: true, message: 'Webhook Mercado Pago activo' });
}
