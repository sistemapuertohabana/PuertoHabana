'use client';

import { useRef, useState } from 'react';
import { Printer, X, Bluetooth, Usb } from 'lucide-react';
import { buildEscPosTicket } from '@/lib/escpos';

interface ItemBoleta {
  item: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

interface BoletaProps {
  mesa: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  items: ItemBoleta[];
  onClose: () => void;
  ruc?: string;
  negocioNombre?: string;
}

export default function Boleta({
  mesa,
  mozoNombre,
  fecha,
  hora,
  items,
  onClose,
  ruc = process.env.NEXT_PUBLIC_NEGOCIO_RUC ?? '10429025546',
  negocioNombre = process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'CEVICHERIA PUERTO HABANA',
}: BoletaProps) {
  const boletaRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const total = subtotal;

  const formatFecha = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handlePrintBrowser = () => {
    const ventana = window.open('', '_blank', 'width=320,height=600');
    if (!ventana) {
      alert('Por favor permite las ventanas emergentes (pop-ups) para imprimir.');
      return;
    }

    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <div style="margin-bottom: 8px;">
          <div>${item.cantidad}x ${item.item}</div>
          <div style="display: flex; justify-content: space-between; padding-left: 12px;">
            <span>S/ ${item.precio.toFixed(2)} c/u</span>
            <span>S/ ${(item.precio * item.cantidad).toFixed(2)}</span>
          </div>
          ${item.notas ? `<div style="padding-left: 12px; color: #555;">* ${item.notas}</div>` : ''}
        </div>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Boleta - ${mesa}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 100%; max-width: 80mm; padding: 4mm; color: #000; margin: 0 auto; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            .text-center { text-align: center; }
            .flex-between { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
            @media print { 
              body { width: 80mm; padding: 0; margin: 0; } 
              @page { margin: 0; size: 80mm auto; } 
            }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 16px; margin-bottom: 4px;">${negocioNombre}</div>
          <div class="text-center">Cevicheria</div>
          <div class="text-center" style="margin-bottom: 8px;">RUC: ${ruc}</div>
          <div class="dashed-line"></div>
          <div>Mesa   : ${mesa}</div>
          <div>Mozo   : ${mozoNombre}</div>
          <div>Fecha  : ${formatFecha(fecha)} ${hora}</div>
          <div class="dashed-line"></div>
          <div class="flex-between font-bold">
            <span>PRODUCTO</span>
            <span>TOTAL</span>
          </div>
          <div class="dashed-line"></div>
          ${itemsHtml}
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Subtotal:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
          <div class="dashed-line"></div>
          <div class="flex-between font-bold" style="font-size: 14px;">
            <span>TOTAL:</span>
            <span>S/ ${total.toFixed(2)}</span>
          </div>
          <div class="dashed-line"></div>
          <div class="text-center" style="margin-top: 8px;">¡Gracias por su visita!</div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  };

  const handlePrintNetwork = async () => {
    setPrinting(true);
    setPrintError('');
    try {
      const res = await fetch('/api/print/boleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesa,
          mozoNombre,
          fecha,
          hora,
          items,
          ruc,
          negocioNombre,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de impresión');
      alert('Boleta enviada a la ticketera en red');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al imprimir';
      setPrintError(msg);
      alert(msg);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintSerial = async () => {
    try {
      setPrinting(true);
      setPrintError('');

      if (!('serial' in navigator)) {
        throw new Error('Tu navegador no soporta conexión USB/COM (Usa Chrome en PC o Android).');
      }

      const ticketText = buildEscPosTicket({ mesa, mozoNombre, fecha, hora, items, ruc, negocioNombre });
      const buffer = new Uint8Array(ticketText.length);
      for (let i = 0; i < ticketText.length; i++) buffer[i] = ticketText.charCodeAt(i) & 0xFF;

      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(buffer);
      await writer.close();
      await port.close();

      alert('¡Impresión enviada correctamente!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar.';
      if (!msg.includes('No port selected')) setPrintError(msg);
    } finally { setPrinting(false); }
  };

  const handlePrintWebBluetooth = async () => {
    try {
      setPrinting(true);
      setPrintError('');
      
      if (!('bluetooth' in navigator)) {
        throw new Error('Bluetooth directo no soportado en este navegador.');
      }

      const ticketText = buildEscPosTicket({ mesa, mozoNombre, fecha, hora, items, ruc, negocioNombre });
      const buffer = new Uint8Array(ticketText.length);
      for (let i = 0; i < ticketText.length; i++) buffer[i] = ticketText.charCodeAt(i) & 0xFF;

      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455']
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      let printCharacteristic;
      
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            printCharacteristic = char;
            break;
          }
        }
        if (printCharacteristic) break;
      }

      if (!printCharacteristic) throw new Error('No se encontró el servicio de impresión en este dispositivo.');

      // Chunk size for BLE
      const chunkSize = 100;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        if (printCharacteristic.properties.writeWithoutResponse) {
          await printCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await printCharacteristic.writeValue(chunk);
        }
      }

      device.gatt.disconnect();
      alert('¡Impresión Bluetooth enviada!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error Bluetooth.';
      if (!msg.includes('cancelled')) setPrintError(msg);
    } finally { setPrinting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Vista Previa de Boleta</h2>
            <p className="text-xs text-gray-500 mt-0.5">{mesa} · {mozoNombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div ref={boletaRef} className="font-mono text-[11px] text-black leading-relaxed">
            <div className="text-center font-bold text-base mb-1">{negocioNombre}</div>
            <div className="text-center text-xs">Cevicheria</div>
            <div className="text-center text-xs mb-2">RUC: {ruc}</div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div>Mesa   : {mesa}</div>
            <div>Mozo   : {mozoNombre}</div>
            <div>Fecha  : {formatFecha(fecha)} {hora}</div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between font-bold">
              <span>PRODUCTO</span>
              <span>TOTAL</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            {items.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div>{item.cantidad}x {item.item}</div>
                <div className="flex justify-between pl-3">
                  <span>S/ {item.precio.toFixed(2)} c/u</span>
                  <span>S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
                {item.notas && <div className="pl-3 text-gray-500">* {item.notas}</div>}
              </div>
            ))}
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between"><span>Subtotal:</span><span>S/ {subtotal.toFixed(2)}</span></div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="text-center mt-2">¡Gracias por su visita!</div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <button
            onClick={handlePrintBrowser}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <Printer size={16} />
            Imprimir (Navegador / RawBT)
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrintWebBluetooth}
              disabled={printing}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              <Bluetooth size={14} />
              Bluetooth Directo
            </button>
            <button
              onClick={handlePrintSerial}
              disabled={printing}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              <Usb size={14} />
              USB / COM (PC)
            </button>
          </div>

          <button
            onClick={handlePrintNetwork}
            disabled={printing}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            <Printer size={16} />
            {printing ? 'Enviando...' : 'Enviar a Ticketera (Red)'}
          </button>
          {printError && <p className="text-[10px] text-red-500 text-center">{printError}</p>}
          <p className="text-[10px] text-gray-400 text-center">
            Red: IP en PRINTER_HOST · Respaldo: impresión por navegador
          </p>
        </div>
      </div>
    </div>
  );
}
