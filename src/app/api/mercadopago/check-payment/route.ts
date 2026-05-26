import { NextResponse } from 'next/server';
import { getMercadoPagoToken } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferenceId = searchParams.get('preference_id');
    const externalRef = searchParams.get('external_reference');

    const mpToken = await getMercadoPagoToken();

    if (!mpToken) {
      return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 500 });
    }

    if (!preferenceId && !externalRef) {
      return NextResponse.json({ error: 'Se requiere preference_id o external_reference' }, { status: 400 });
    }

    // Buscar pagos por external_reference o preference_id
    let searchUrl = 'https://api.mercadopago.com/v1/payments/search?';

    if (externalRef) {
      searchUrl += `external_reference=${encodeURIComponent(externalRef)}`;
    } else if (preferenceId) {
      searchUrl += `preference_id=${encodeURIComponent(preferenceId)}`;
    }

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${mpToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error checking MP payment:', response.status, errorText);
      return NextResponse.json({ error: 'Error al verificar pago' }, { status: 502 });
    }

    const data = await response.json();

    // Si hay resultados, devolver el más reciente
    if (data.results && data.results.length > 0) {
      const payment = data.results[0];
      return NextResponse.json({
        success: true,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_id: payment.id,
        paid: payment.status === 'approved',
        payer: {
          email: payment.payer?.email,
          name: `${payment.payer?.first_name || ''} ${payment.payer?.last_name || ''}`.trim(),
        },
        transaction_amount: payment.transaction_amount,
        payment_method_id: payment.payment_method_id,
        date_approved: payment.date_approved,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      paid: false,
      message: 'No se encontró pago aún',
    });
  } catch (err: any) {
    console.error('Error en check-payment:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
