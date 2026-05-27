import { NextResponse } from 'next/server';
import net from 'net';
import { buildEscPosTicket, buildEscPosComanda, type BoletaPayload } from '@/lib/escpos';

function sendToPrinter(host: string, port: number, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Timeout conectando a la ticketera'));
    }, 8000);

    socket.connect(port, host, () => {
      socket.write(data, 'binary', (err) => {
        clearTimeout(timeout);
        if (err) {
          socket.destroy();
          reject(err);
        } else {
          socket.end();
          resolve();
        }
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function POST(request: Request) {
  try {
    // Auth mocked for now (Supabase removed)
    // In production, add your custom auth logic here

    const body = (await request.json()) as BoletaPayload & { esComanda?: boolean };
    if (!body?.mesa || !body?.items?.length) {
      return NextResponse.json({ error: 'Datos de boleta incompletos' }, { status: 400 });
    }

    const host = process.env.PRINTER_HOST;
    const port = Number(process.env.PRINTER_PORT || 9100);

    if (!host) {
      return NextResponse.json(
        { error: 'PRINTER_HOST no configurado en .env.local' },
        { status: 503 }
      );
    }

    let ticket: string;
    if (body.esComanda) {
      // Formato compacto para cocina
      ticket = buildEscPosComanda({
        mesa: body.mesa,
        mozoNombre: body.mozoNombre,
        fecha: body.fecha,
        hora: body.hora,
        items: body.items.map(i => ({
          nombre: i.item,
          cantidad: i.cantidad,
          notas: i.notas,
        })),
        negocioNombre: body.negocioNombre ?? process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'PUERTO HABANA',
      });
    } else {
      ticket = buildEscPosTicket({
        ...body,
        ruc: body.ruc ?? process.env.NEXT_PUBLIC_NEGOCIO_RUC,
        negocioNombre: body.negocioNombre ?? process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'PUERTO HABANA',
      });
    }

    await sendToPrinter(host, port, ticket);

    return NextResponse.json({ ok: true, message: 'Boleta enviada a la ticketera' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error de impresión';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
