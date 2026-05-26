import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/reniec/consulta?dni=12345678
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!dni || dni.length !== 8 || !/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: 'DNI inválido — debe tener 8 dígitos' }, { status: 400 });
  }

  const apiKey = process.env.RENIEC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de RENIEC no configurada' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${dni}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      next: { revalidate: 86400 }, // cache por 24h
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'DNI no encontrado en RENIEC' }, { status: 404 });
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: 'API key de RENIEC inválida o sin saldo' }, { status: 502 });
      }
      return NextResponse.json({ error: `Error al consultar RENIEC: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    
    // Mapear campos de decolecta (inglés) al formato esperado por el frontend
    const mapped = {
      nombres: data.first_name || data.nombres || '',
      apellidoPaterno: data.first_last_name || data.apellidoPaterno || '',
      apellidoMaterno: data.second_last_name || data.apellidoMaterno || '',
      dni: data.document_number || data.dni || dni,
      full_name: data.full_name || '',
    };
    return NextResponse.json(mapped);
  } catch (err) {
    console.error('Error consultando RENIEC:', err);
    return NextResponse.json({ error: 'Error de conexión con el servicio RENIEC' }, { status: 502 });
  }
}
