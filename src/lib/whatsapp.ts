// src/lib/whatsapp.ts
// Integración con UltraMsg para envío de WhatsApp (alternativa simple a WhatsApp Business API)
// Docs: https://docs.ultramsg.com/
// Setup: crear cuenta en https://ultramsg.com → crear instancia → escanear QR → obtener token

export interface UltraMsgConfig {
  instanceId: string;
  token: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getConfig(): UltraMsgConfig | null {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
  const token = process.env.ULTRAMSG_TOKEN || '';

  if (!instanceId || !token) {
    return null;
  }

  return { instanceId, token };
}

const ULTRAMSG_BASE = 'https://api.ultramsg.com';

/**
 * Enviar mensaje de texto por WhatsApp vía UltraMsg
 */
export async function enviarMensajeTexto(
  telefono: string,
  mensaje: string
): Promise<WhatsAppMessageResult> {
  const config = getConfig();

  if (!config) {
    console.warn('[WhatsApp] ULTRAMSG_INSTANCE_ID/TOKEN no configurados — simulando envío');
    return { success: true, messageId: `sim-${Date.now()}` };
  }

  const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
  if (telefonoLimpio.length < 9) {
    return { success: false, error: 'Número de teléfono inválido' };
  }

  // Si no tiene código de país, asumir Perú (+51)
  const telefonoCompleto = telefonoLimpio.startsWith('51')
    ? telefonoLimpio
    : `51${telefonoLimpio}`;

  try {
    const url = `${ULTRAMSG_BASE}/${config.instanceId}/messages/chat`;

    const body = new URLSearchParams();
    body.append('token', config.token);
    body.append('to', telefonoCompleto);
    body.append('body', mensaje);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error || `Error HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: String(data.messageId || data.id || `sent-${Date.now()}`),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión con UltraMsg',
    };
  }
}

/**
 * Enviar documento PDF por WhatsApp vía UltraMsg
 */
export async function enviarPDF(
  telefono: string,
  pdfUrl: string,
  caption: string
): Promise<WhatsAppMessageResult> {
  const config = getConfig();

  if (!config) {
    console.warn('[WhatsApp] No configurado — simulando envío de PDF');
    return { success: true, messageId: `sim-pdf-${Date.now()}` };
  }

  const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
  const telefonoCompleto = telefonoLimpio.startsWith('51')
    ? telefonoLimpio
    : `51${telefonoLimpio}`;

  try {
    const url = `${ULTRAMSG_BASE}/${config.instanceId}/messages/document`;

    const body = new URLSearchParams();
    body.append('token', config.token);
    body.append('to', telefonoCompleto);
    body.append('filename', 'boleta_puerto_habana.pdf');
    body.append('document', pdfUrl);
    body.append('caption', caption);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { success: false, error: data.error || `Error HTTP ${res.status}` };
    }

    return { success: true, messageId: String(data.messageId || data.id) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' };
  }
}

/**
 * Enviar mensaje a múltiples clientes (promociones)
 */
export async function enviarMensajeMasivo(
  telefonos: string[],
  mensaje: string
): Promise<{ enviados: number; fallidos: number; resultados: WhatsAppMessageResult[] }> {
  let enviados = 0;
  let fallidos = 0;
  const resultados: WhatsAppMessageResult[] = [];

  // Enviar en lotes de 10 para no saturar la API
  const lotes: string[][] = [];
  for (let i = 0; i < telefonos.length; i += 10) {
    lotes.push(telefonos.slice(i, i + 10));
  }

  for (const lote of lotes) {
    const resultadosLote = await Promise.all(
      lote.map(telefono => enviarMensajeTexto(telefono, mensaje))
    );

    for (const r of resultadosLote) {
      if (r.success) enviados++;
      else fallidos++;
      resultados.push(r);
    }

    if (lotes.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { enviados, fallidos, resultados };
}

/**
 * Formatear boleta como mensaje de WhatsApp
 */
export function formatearBoletaWhatsApp(params: {
  negocio: string;
  cliente: string;
  mesa: string;
  items: Array<{ nombre: string; cantidad: number; precio: number }>;
  total: number;
  metodoPago: string;
}): string {
  const { negocio, cliente, mesa, items, total, metodoPago } = params;

  let mensaje = `🧾 *${negocio}*\n`;
  mensaje += `╔══════════════════════════╗\n`;
  mensaje += `*VOUCHER DE PAGO*\n`;
  mensaje += `╚══════════════════════════╝\n\n`;
  mensaje += `👤 *Cliente:* ${cliente}\n`;
  mensaje += `🏠 *Mesa:* ${mesa}\n`;
  mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}\n\n`;
  mensaje += `*Productos:*\n`;

  items.forEach(i => {
    mensaje += `  ${i.cantidad}x ${i.nombre} — S/ ${(i.precio * i.cantidad).toFixed(2)}\n`;
  });

  mensaje += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💵 *Total: S/ ${total.toFixed(2)}*\n`;
  mensaje += `💳 *Método:* ${metodoPago}\n\n`;
  mensaje += `¡Gracias por su preferencia! 🎉\n`;
  mensaje += `*Puerto Habana Cevichería*`;

  return mensaje;
}
