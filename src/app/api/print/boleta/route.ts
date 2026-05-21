import { NextResponse } from 'next/server';
import net from 'net';
import { createClient } from '@/lib/supabase/server';
import { buildEscPosTicket, type BoletaPayload } from '@/lib/escpos';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single() as { data: { rol: string } | null };

    const rol = profile?.rol;
    if (!rol || !['admin', 'mozo', 'cocina'].includes(rol)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const body = (await request.json()) as BoletaPayload;
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

    const ticket = buildEscPosTicket({
      ...body,
      ruc: body.ruc ?? process.env.NEXT_PUBLIC_NEGOCIO_RUC,
      negocioNombre: body.negocioNombre ?? process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'PUERTO HABANA',
    });

    await sendToPrinter(host, port, ticket);

    return NextResponse.json({ ok: true, message: 'Boleta enviada a la ticketera' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error de impresión';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
