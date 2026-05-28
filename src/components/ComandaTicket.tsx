'use client';

import { useRef, useState } from 'react';
import { Printer, X, Bluetooth, Usb } from 'lucide-react';
import { buildEscPosComanda } from '@/lib/escpos';

interface ItemComanda {
  nombre: string;
  cantidad: number;
  notas?: string;
  categoria?: string;
}

interface ComandaTicketProps {
  mesa: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  items: ItemComanda[];
  onClose: () => void;
  negocioNombre?: string;
  totalAcumuladoTurno?: number; // total de platos del turno hasta este pedido
}

export default function ComandaTicket({
  mesa,
  mozoNombre,
  fecha,
  hora,
  items,
  onClose,
  negocioNombre = process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'CEVICHERIA PUERTO HABANA',
  totalAcumuladoTurno,
}: ComandaTicketProps) {
  const boletaRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');

  const formatFecha = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handlePrintBrowser = () => {
    const foodItems = items.filter(item => item.categoria !== 'bebidas');
    const totalItems = foodItems.reduce((s, i) => s + i.cantidad, 0);
    let itemsHtml = '';
    foodItems.forEach(item => {
      itemsHtml += `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 30px; font-weight: bold;">
            <span>(${item.cantidad})</span>
            <span>${item.nombre}</span>
          </div>
          ${item.notas ? `<div style="padding-left: 36px; font-size: 15px; color: #666; margin-top: 2px;">📝 ${item.notas}</div>` : ''}
        </div>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Comanda - ${mesa}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 14px; width: 100%; max-width: 58mm; padding: 3mm; color: #000; margin: 0 auto; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            @media print { 
              body { width: 58mm; padding: 0; margin: 0; } 
              @page { margin: 0; size: 58mm auto; } 
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="margin-bottom: 6px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 12px; background: #f8f8f8; border: 1px solid #eee; padding: 4px;">
              <img src="${window.location.origin}/logo/LogoPuertoHabana.png" alt="Logo" style="width: 60px; height: 60px; object-fit: contain;" />
            </div>
          </div>
          <div class="text-center" style="font-size: 13px; font-weight: bold; color: #d97706; margin-bottom: 2px;">🍽️ PLATOS VENDIDOS: ${totalItems}${totalAcumuladoTurno !== undefined ? ` &nbsp;|&nbsp; TURNO: ${totalAcumuladoTurno}` : ''}</div>
          <div class="text-center font-bold" style="font-size: 22px; margin-bottom: 2px;">🍳 COMANDA</div>
          <div class="text-center" style="font-size: 12px; margin-bottom: 6px;">${negocioNombre}</div>
          <div class="line"></div>
          <div style="font-size: 16px;"><span class="font-bold">Mesa:</span> ${mesa}</div>
          <div style="font-size: 13px;"><span class="font-bold">Mozo:</span> ${mozoNombre}</div>
          <div style="font-size: 13px;"><span class="font-bold">Hora:</span> ${formatFecha(fecha)} ${hora}</div>
          <div class="line"></div>
          ${itemsHtml}
          <div class="line"></div>
          <div class="text-center" style="margin-top: 8px; font-size: 12px; color: #666;">¡Buen provecho!</div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
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
          items: foodItems.map(i => ({
            item: i.nombre,
            cantidad: i.cantidad,
            precio: 0,
            notas: i.notas,
          })),
          esComanda: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de impresión');
      alert('Comanda enviada a la ticketera en red');
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

      const ticketText = buildEscPosComanda({ mesa, mozoNombre, fecha, hora, items: foodItems, negocioNombre });
      const buffer = new Uint8Array(ticketText.length);
      for (let i = 0; i < ticketText.length; i++) buffer[i] = ticketText.charCodeAt(i) & 0xFF;

      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(buffer);
      await writer.close();
      await port.close();

      alert('¡Comanda enviada correctamente!');
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

      const ticketText = buildEscPosComanda({ mesa, mozoNombre, fecha, hora, items: foodItems, negocioNombre });
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
      alert('¡Comanda Bluetooth enviada!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error Bluetooth.';
      if (!msg.includes('cancelled')) setPrintError(msg);
    } finally { setPrinting(false); }
  };

  const foodItems = items.filter(item => item.categoria !== 'bebidas');
  const totalItems = foodItems.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-start">
          <div>
            <div className="mb-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg inline-block">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                🍽️ Este pedido: <span className="text-base">{totalItems}</span>
                {totalAcumuladoTurno !== undefined && (
                  <span className="ml-2 text-amber-600">· Turno: <span className="text-base">{totalAcumuladoTurno}</span></span>
                )}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">🍳 Comanda</h2>
            <p className="text-xs text-gray-500 mt-0.5">{mesa} · {totalItems} productos</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-3 max-h-[55vh] overflow-y-auto">
          <div ref={boletaRef} className="font-mono text-[14px] text-black leading-relaxed">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-xl bg-gray-50 border border-gray-100 p-1">
                <img src="/logo/LogoPuertoHabana.png" alt="Logo" className="w-[52px] h-[52px] object-contain" />
              </div>
            </div>
            <div className="text-center font-bold text-xl mb-1">🍳 COMANDA</div>
            <div className="text-center text-xs text-gray-500 mb-2">{negocioNombre}</div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="text-base"><span className="font-bold">Mesa:</span> {mesa}</div>
            <div className="text-xs"><span className="font-bold">Mozo:</span> {mozoNombre}</div>
            <div className="text-xs"><span className="font-bold">Hora:</span> {formatFecha(fecha)} {hora}</div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            {items.filter(item => item.categoria !== 'bebidas').map((item, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-3xl">({item.cantidad})</span>
                  <span className="text-2xl font-black">{item.nombre}</span>
                  {item.categoria === 'bebidas' && <span className="text-sm">🥤</span>}
                </div>
                {item.notas && (
                  <div className="pl-9 text-sm text-gray-500 italic">* {item.notas}</div>
                )}
              </div>
            ))}
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="text-center text-xs text-gray-400 mt-1">¡Buen provecho!</div>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
          <button
            onClick={handlePrintBrowser}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold"
          >
            <Printer size={14} />
            Imprimir Comanda (Navegador / RawBT)
          </button>
          
          <div className="flex gap-1.5">
            <button
              onClick={handlePrintWebBluetooth}
              disabled={printing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-2 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-[10px] font-semibold disabled:opacity-50"
            >
              <Bluetooth size={12} />
              Bluetooth
            </button>
            <button
              onClick={handlePrintSerial}
              disabled={printing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-2 py-2 rounded-xl hover:bg-emerald-700 transition-colors text-[10px] font-semibold disabled:opacity-50"
            >
              <Usb size={12} />
              USB / COM
            </button>
          </div>

          <button
            onClick={handlePrintNetwork}
            disabled={printing}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors text-xs font-semibold disabled:opacity-50"
          >
            <Printer size={14} />
            {printing ? 'Enviando...' : 'Enviar a Ticketera (Red)'}
          </button>
          {printError && <p className="text-[10px] text-red-500 text-center">{printError}</p>}
          <p className="text-[9px] text-gray-400 text-center">
            Ticket compacto para cocina
          </p>
        </div>
      </div>
    </div>
  );
}
