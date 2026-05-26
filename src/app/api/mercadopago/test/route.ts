import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Probar el token haciendo una consulta a la API de Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments/search?limit=1', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = 'Token inválido';
      try {
        const errJson = JSON.parse(errorText);
        errorMsg = errJson.message || errJson.error || errorMsg;
      } catch {}

      // Intentar distinguir entre sandbox y producción
      if (access_token.startsWith('TEST-')) {
        errorMsg += ' (estás usando un token de prueba/sandbox — necesitas uno de producción APP_USR)';
      }

      return NextResponse.json({ error: errorMsg }, { status: 502 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `✅ Token válido. Cuenta: ${data.paging?.total || 0} pagos encontrados.`,
    });
  } catch (err: any) {
    console.error('Error testing MP:', err);
    return NextResponse.json({ error: err.message || 'Error de conexión' }, { status: 500 });
  }
}
