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

export function buildEscPosTicket(payload: BoletaPayload): string {
  const { mesa, mozoNombre, fecha, hora, items, ruc = '20XXXXXXXXX', negocioNombre = 'PUERTO HABANA', clienteNombre, clienteDocumento } = payload;

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
  ticket += '\x1B\x21\x30';
  ticket += `${negocioNombre}\n`;
  ticket += '\x1B\x21\x00';
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
