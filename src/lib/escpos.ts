export interface BoletaItem {
  item: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

export interface BoletaPayload {
  mesa: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  items: BoletaItem[];
  ruc?: string;
  negocioNombre?: string;
  clienteNombre?: string;
  clienteDocumento?: string;
}

export interface ComandaPayload {
  mesa: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  items: { nombre: string; cantidad: number; notas?: string; categoria?: string }[];
  negocioNombre?: string;
  totalAcumuladoTurno?: number; // contador global de platos del turno
}

export function buildEscPosComanda(payload: ComandaPayload): string {
  const { mesa, mozoNombre, fecha, hora, items, totalAcumuladoTurno } = payload;

  const formatFecha = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Solo platos (sin bebidas)
  const foodItems = items.filter(i => i.categoria !== 'bebidas');
  const totalEstePedido = foodItems.reduce((s, i) => s + i.cantidad, 0);

  const LINE = '='.repeat(29) + '\n';

  let ticket = '';
  ticket += '\x1B\x40';                     // Reset
  ticket += '\x1B\x61\x01';                 // Center align
  ticket += '\x1B\x21\x30';                 // Double height + bold
  ticket += 'P U E R T O\n';
  ticket += 'H A B A N A\n';
  ticket += '\x1B\x21\x00';                 // Normal
  ticket += '\x1B\x61\x01';                 // Center
  ticket += '='.repeat(29) + '\n';
  ticket += '\x1B\x21\x20';                 // Double width + bold
  ticket += 'C O M A N D A\n';
  ticket += '\x1B\x21\x00';                 // Normal

  // ── Contador de platos ──────────────────────────────────────────────────
  ticket += '\x1B\x21\x10';                 // Bold
  ticket += `PLATOS PEDIDO: ${totalEstePedido}`;
  if (totalAcumuladoTurno !== undefined) {
    ticket += `   PLATOS-TOTAL: ${totalAcumuladoTurno}`;
  }
  ticket += '\n';
  ticket += '\x1B\x21\x00';                 // Normal
  // ────────────────────────────────────────────────────────────────────────

  ticket += '='.repeat(29) + '\n';
  ticket += '\x1B\x61\x00';                 // Left align
  ticket += '\x1B\x21\x10';                 // Bold
  ticket += `Mesa: ${mesa}\n`;
  ticket += '\x1B\x21\x00';                 // Normal
  ticket += `Mozo: ${mozoNombre}\n`;
  ticket += `Hora: ${formatFecha(fecha)} ${hora}\n`;
  ticket += LINE;

  foodItems.forEach((i) => {
    ticket += `${i.cantidad}x ${i.nombre}\n`;
    if (i.notas) {
      ticket += `   * ${i.notas}\n`;
    }
  });

  ticket += LINE;
  ticket += '\x1B\x61\x01';                 // Center
  ticket += '¡Buen provecho!\n';
  ticket += '\n\n\n';
  ticket += '\x1D\x56\x41\x10';             // Cut paper

  return ticket;
}

export function buildEscPosTicket(payload: BoletaPayload): string {
  const { mesa, mozoNombre, fecha, hora, items, ruc = '20XXXXXXXXX', clienteNombre, clienteDocumento } = payload;

  const formatFecha = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal;

  const LINE = '------------------------------------------------\n';
  const ROW = (left: string, right: string, width = 48) => {
    const spaces = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaces) + right + '\n';
  };

  let ticket = '';
  ticket += '\x1B\x40';
  ticket += '\x1B\x61\x01';
  // ── Encabezado estilizado tipo logo ──
  ticket += '\x1B\x21\x30';                 // Double height + bold
  ticket += 'P U E R T O\n';
  ticket += 'H A B A N A\n';
  ticket += '\x1B\x21\x00';                 // Normal
  ticket += '\x1B\x61\x01';                 // Center
  ticket += '='.repeat(48) + '\n';
  ticket += 'Cevicheria\n';
  ticket += `RUC: ${ruc}\n`;
  ticket += LINE;
  ticket += '\x1B\x61\x00';
  ticket += `Mesa   : ${mesa}\n`;
  ticket += `Mozo   : ${mozoNombre}\n`;
  ticket += `Fecha  : ${formatFecha(fecha)} ${hora}\n`;
  if (clienteNombre) ticket += `Cliente: ${clienteNombre.length > 39 ? clienteNombre.substring(0, 39) : clienteNombre}\n`;
  if (clienteDocumento) ticket += `Doc    : ${clienteDocumento}\n`;
  ticket += LINE;
  ticket += ROW('PRODUCTO', 'TOTAL');
  ticket += LINE;

  items.forEach((i) => {
    if (i.precio === 0) {
      ticket += '\x1B\x21\x00';
      ticket += `🎁 Cortesía\n`;
      const nombreCortesia = i.item.length > 28 ? i.item.substring(0, 25) + '...' : i.item;
      ticket += `   ${i.cantidad}x ${nombreCortesia}\n`;
      ticket += ROW('   S/ 0.00', 'S/ 0.00');
    } else {
      const nombre = i.item.length > 28 ? i.item.substring(0, 25) + '...' : i.item;
      const subtotalItem = (i.precio * i.cantidad).toFixed(2);
      ticket += `${i.cantidad}x ${nombre}\n`;
      ticket += ROW(`   S/ ${i.precio.toFixed(2)} c/u`, `S/ ${subtotalItem}`);
    }
    if (i.notas) ticket += `   * ${i.notas}\n`;
  });

  ticket += LINE;
  ticket += ROW('Subtotal:', `S/ ${subtotal.toFixed(2)}`);
  ticket += LINE;
  ticket += '\x1B\x21\x10';
  ticket += ROW('TOTAL:', `S/ ${total.toFixed(2)}`);
  ticket += '\x1B\x21\x00';
  ticket += LINE;
  ticket += '\x1B\x61\x01';
  ticket += '¡Gracias por su visita!\n';
  ticket += 'Vuelva pronto :)\n';
  ticket += '\n\n\n';
  ticket += '\x1D\x56\x41\x10';

  return ticket;
}
