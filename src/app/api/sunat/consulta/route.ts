import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/sunat/consulta?ruc=20123456789
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get('ruc');

  if (!ruc || ruc.length !== 11 || !/^\d{11}$/.test(ruc)) {
    return NextResponse.json({ error: 'RUC inválido — debe tener 11 dígitos' }, { status: 400 });
  }

  const apiKey = process.env.RENIEC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de consulta no configurada' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${ruc}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      next: { revalidate: 86400 }, // cache por 24h
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'RUC no encontrado en SUNAT' }, { status: 404 });
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: 'API key inválida o sin saldo' }, { status: 502 });
      }
      return NextResponse.json({ error: `Error al consultar SUNAT: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();

    // Mapear campos de decolecta al formato esperado
    const mapped = {
      ruc: data.numero || data.ruc || ruc,
      razonSocial: data.nombre || data.razonSocial || data.razon_social || '',
      nombre: data.nombre || data.razonSocial || data.razon_social || '',
      estado: data.estado || '',
      condicion: data.condicion || '',
      direccion: data.direccion || '',
      tipo: data.tipo || '',
    };
    return NextResponse.json(mapped);
  } catch (err) {
    console.error('Error consultando SUNAT:', err);
    return NextResponse.json({ error: 'Error de conexión con el servicio SUNAT' }, { status: 502 });
  }
}
