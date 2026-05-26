// src/lib/whatsapp.ts
// Integración con WhatsApp Business API para envío de mensajes

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  if (!token || !phoneNumberId) {
    return null;
  }

  return { token, phoneNumberId };
}

const WHATSAPP_API_VERSION = 'v22.0';
const WHATSAPP_BASE_URL = 'https://graph.facebook.com';

/**
 * Enviar mensaje de texto a un número de WhatsApp
 */
export async function enviarMensajeTexto(
  telefono: string,
  mensaje: string
): Promise<WhatsAppMessageResult> {
  const config = getConfig();

  if (!config) {
    console.warn('[WhatsApp] Token/PhoneNumberID no configurados — simulando envío');
    return { success: true, messageId: `sim-${Date.now()}` };
  }

  // Limpiar formato del teléfono: solo dígitos
  const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
  if (telefonoLimpio.length < 9) {
    return { success: false, error: 'Número de teléfono inválido' };
  }

  // Si no tiene código de país, asumir Perú (+51)
  const telefonoCompleto = telefonoLimpio.startsWith('51') ? telefonoLimpio : `51${telefonoLimpio}`;

  try {
    const url = `${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefonoCompleto,
        type: 'text',
        text: { body: mensaje },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || `Error HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || `sent-${Date.now()}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión WhatsApp',
    };
  }
}

/**
 * Enviar PDF de boleta/voucher por WhatsApp
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
  const telefonoCompleto = telefonoLimpio.startsWith('51') ? telefonoLimpio : `51${telefonoLimpio}`;

  try {
    const url = `${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefonoCompleto,
        type: 'document',
        document: {
          link: pdfUrl,
          caption,
          filename: `boleta_puerto_habana.pdf`,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error?.message || `Error HTTP ${res.status}` };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
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

    // Pequeña pausa entre lotes para no exceder rate limits
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
