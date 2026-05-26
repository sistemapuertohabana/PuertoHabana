// src/lib/nubefact.ts
// Integración con API Nubefact para boletas electrónicas SUNAT
// Documentación: https://www.nubefact.com/manual-integracion

export interface NubefactConfig {
  token: string;
  endpoint: string;
}

export interface ClienteData {
  tipo_doc: 'DNI' | 'RUC';
  numero_doc: string;
  razon_social: string;
  direccion?: string;
}

export interface ItemBoleta {
  unidad: string;
  cantidad: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  precio_venta: number;
  tipo_precio: 'GRAVADO' | 'EXONERADO' | 'INAFECTO';
  total: number;
}

export interface BoletaElectronicaPayload {
  tipo_doc: 'BOLETA' | 'FACTURA';
  serie: string;
  numero: number;
  cliente: ClienteData;
  items: ItemBoleta[];
  total_gravada: number;
  total_igv: number;
  total: number;
  forma_pago: 'CONTADO' | 'CREDITO';
  fecha_emision: string;
  observaciones?: string;
}

export interface NubefactResponse {
  success: boolean;
  mensaje?: string;
  pdf_url?: string;
  xml?: string;
  cdr?: string;
  codigo?: string;
  nro_doc?: string;
  error?: string;
}

function getConfig(): NubefactConfig {
  const token = process.env.NUBEFACT_TOKEN || '';
  const endpoint = process.env.NUBEFACT_ENDPOINT || 'https://api.nubefact.com/api/v1/502e9b1a-fd5c-42b2-8ac0-1db8bbcebdc5';
  return { token, endpoint };
}

/**
 * Enviar boleta electrónica a SUNAT vía Nubefact
 */
export async function enviarBoleta(payload: BoletaElectronicaPayload): Promise<NubefactResponse> {
  const config = getConfig();

  if (!config.token) {
    console.warn('[Nubefact] Token no configurado — simulando envío');
    return {
      success: true,
      mensaje: 'Boleta registrada en modo simulación (NUBEFACT_TOKEN no configurado)',
      nro_doc: `${payload.serie}-${Date.now().toString().slice(-8)}`,
    };
  }

  try {
    const nubefactBody = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: payload.tipo_doc === 'FACTURA' ? 1 : 2,
      serie: payload.serie,
      numero: payload.numero,
      sunat_transaction: 1,
      cliente_tipo_de_documento: payload.cliente.tipo_doc === 'RUC' ? "6" : "1",
      cliente_numero_de_documento: payload.cliente.numero_doc,
      cliente_denominacion: payload.cliente.razon_social,
      cliente_direccion: payload.cliente.direccion || "",
      cliente_email: "",
      cliente_email_1: "",
      cliente_email_2: "",
      fecha_de_emision: payload.fecha_emision,
      fecha_de_vencimiento: "",
      moneda: "1",
      tipo_de_cambio: "",
      porcentaje_de_igv: "18.00",
      descuento_global: "",
      total_descuento: "",
      total_anticipo: "",
      total_gravada: payload.total_gravada,
      total_inafecta: "",
      total_exonerada: "",
      total_igv: payload.total_igv,
      total_gratuita: "",
      total_otros_cargos: "",
      total: payload.total,
      percepcion_tipo: "",
      percepcion_base_imponible: "",
      total_percepcion: "",
      total_incluido_percepcion: "",
      detraccion: "false",
      observaciones: payload.observaciones || "",
      documento_que_se_modifica_tipo: "",
      documento_que_se_modifica_serie: "",
      documento_que_se_modifica_numero: "",
      tipo_de_nota_de_credito: "",
      tipo_de_nota_de_debito: "",
      enviar_automaticamente_a_la_sunat: "true",
      enviar_automaticamente_al_cliente: "false",
      codigo_unico: "",
      condiciones_de_pago: "",
      medio_de_pago: "",
      placa_vehiculo: "",
      pedido_compra: "",
      formato_de_pdf: "",
      items: payload.items.map(i => ({
        unidad_de_medida: i.unidad === 'UNIDAD' ? 'NIU' : 'ZZ',
        codigo: i.codigo,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        valor_unitario: Number((i.precio_unitario / 1.18).toFixed(5)),
        precio_unitario: i.precio_unitario,
        descuento: "",
        subtotal: Number((i.precio_venta / 1.18).toFixed(2)),
        tipo_de_igv: i.tipo_precio === 'GRAVADO' ? "1" : "8",
        igv: Number((i.precio_venta - (i.precio_venta / 1.18)).toFixed(2)),
        total: i.precio_venta,
        anticipo_regularizacion: "false",
        anticipo_documento_serie: "",
        anticipo_documento_numero: ""
      }))
    };

    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify(nubefactBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Error HTTP ${res.status}: ${errorText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      mensaje: data.mensaje || 'Boleta enviada correctamente',
      pdf_url: data.pdf_url,
      xml: data.xml,
      cdr: data.cdr,
      codigo: data.codigo,
      nro_doc: data.nro_doc,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de conexión con Nubefact';
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Consultar estado de un comprobante
 */
export async function consultarEstado(tipoDoc: string, serie: string, numero: string): Promise<NubefactResponse> {
  const config = getConfig();

  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify({ operacion: "consultar_comprobante", tipo_documento: tipoDoc, serie, numero }),
    });

    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de consulta' };
  }
}

/**
 * Generar serie y número correlativo para boleta/factura
 */
export function generarSerie(tipoDoc: 'BOLETA' | 'FACTURA', ultimoNumero: number = 0): { serie: string; numero: string } {
  const prefijo = tipoDoc === 'BOLETA' ? 'BBB1' : 'FFF1';
  const numero = String(ultimoNumero + 1).padStart(8, '0');
  return { serie: prefijo, numero };
}

/**
 * Calcular IGV (18% en Perú)
 */
export function calcularIGV(montoGravado: number): number {
  return Math.round(montoGravado * 0.18 * 100) / 100;
}

/**
 * Generar payload para boleta electrónica desde datos del pedido
 */
export function generarPayloadBoleta(params: {
  tipoDoc: 'BOLETA' | 'FACTURA';
  cliente: ClienteData;
  items: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    categoria?: string;
  }>;
  serie: string;
  numero: number;
  observaciones?: string;
}): BoletaElectronicaPayload {
  const { tipoDoc, cliente, items, serie, numero, observaciones } = params;

  const boletaItems: ItemBoleta[] = items.map((item, idx) => {
    const total = item.cantidad * item.precio;
    return {
      unidad: 'UNIDAD',
      cantidad: item.cantidad,
      codigo: `PROD-${idx + 1}`,
      descripcion: item.nombre,
      precio_unitario: item.precio,
      precio_venta: total,
      tipo_precio: 'GRAVADO',
      total,
    };
  });

  const totalGravada = boletaItems.reduce((s, i) => s + i.total, 0);
  const totalIGV = calcularIGV(totalGravada);

  return {
    tipo_doc: tipoDoc,
    serie,
    numero,
    cliente,
    items: boletaItems,
    total_gravada: Number((totalGravada / 1.18).toFixed(2)),
    total_igv: Number((totalGravada - (totalGravada / 1.18)).toFixed(2)),
    total: totalGravada,
    forma_pago: 'CONTADO',
    fecha_emision: new Date().toISOString().split('T')[0],
    observaciones,
  };
}
