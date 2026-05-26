import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getMercadoPagoToken } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { comanda_id, total, mesa, items, origin } = await request.json();

    if (!total || total <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    // Obtener access token desde env o Supabase config
    const mpToken = await getMercadoPagoToken();

    if (!mpToken) {
      return NextResponse.json({ error: 'Mercado Pago no configurado. Configura el ACCESS TOKEN en el panel de administración.' }, { status: 500 });
    }

    // Construir título descriptivo
    const title = mesa ? `Mesa ${mesa}` : 'Puerto Habana';

    // Construir notification_url dinámicamente
    const baseUrl = origin || process.env.NEXT_PUBLIC_URL || 'https://tu-dominio.com';
    const notificationUrl = `${baseUrl}/api/mercadopago/webhook`;

    const preferenceBody: any = {
      items: [
        {
          title,
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'PEN',
        },
      ],
      notification_url: notificationUrl,
      external_reference: String(comanda_id || Date.now()),
      auto_return: 'approved',
      back_urls: {
        success: `${baseUrl}/mozo/historial?mp_success=1`,
        failure: `${baseUrl}/mozo/historial?mp_failure=1`,
        pending: `${baseUrl}/mozo/historial?mp_pending=1`,
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
        ],
        installments: 1,
      },
    };

    // Si hay items detallados, usarlos
    if (items && items.length > 0) {
      preferenceBody.items = items.map((item: any) => ({
        title: item.nombre || item.item || 'Producto',
        quantity: Number(item.cantidad) || 1,
        unit_price: Number(item.precio) || 0,
        currency_id: 'PEN',
      }));
      // Sumarizar como un solo item si son muchos
      if (preferenceBody.items.length > 10) {
        preferenceBody.items = [{
          title: `Pedido ${title}`,
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'PEN',
        }];
      }
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mercado Pago API error:', response.status, errorText);
      return NextResponse.json({
        error: `Error al crear preferencia: ${response.status}`,
        detalle: errorText,
      }, { status: 502 });
    }

    const data = await response.json();

    // Guardar la preferencia en Supabase para tracking
    try {
      const sb = getServiceSupabase();
      await sb.from('mercadopago_preferencias').insert({
        preference_id: data.id,
        comanda_id: comanda_id || null,
        init_point: data.init_point,
        total: Number(total),
        estado: 'pendiente',
      });
    } catch {
      // No crítico - la tabla puede no existir aún
    }

    return NextResponse.json({
      success: true,
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (err: any) {
    console.error('Error en create-preference:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
