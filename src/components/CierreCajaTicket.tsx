'use client';

import { Printer, X } from 'lucide-react';

interface CierreCajaTicketProps {
  mozoNombre: string;
  mozoId: string;
  turno: string;
  fecha: string;
  total: number;
  onClose: () => void;
  negocioNombre?: string;
  comandas: any[];
}

export default function CierreCajaTicket({
  mozoNombre,
  mozoId,
  turno,
  fecha,
  total,
  onClose,
  negocioNombre = process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'CEVICHERIA PUERTO HABANA',
  comandas,
}: CierreCajaTicketProps) {
  
  // Calculate totals by payment method
  const totalEfectivo = comandas.filter(c => c.metodo_pago === 'Efectivo').reduce((sum, c) => sum + Number(c.total || 0), 0);
  const totalYape = comandas.filter(c => c.metodo_pago === 'Yape' || c.metodo_pago === 'Yape/Mixto').reduce((sum, c) => sum + Number(c.total || 0), 0);
  const totalTarjeta = comandas.filter(c => c.metodo_pago === 'Tarjeta').reduce((sum, c) => sum + Number(c.total || 0), 0);
  
  // Aggregate items
  const platosMap: Record<string, number> = {};
  const bebidasMap: Record<string, number> = {};
  const tapersMap: Record<string, number> = {};

  comandas.forEach(comanda => {
    if (comanda.items && Array.isArray(comanda.items)) {
      comanda.items.forEach((item: any) => {
        if (!item.precio && !item.nombre.includes('🎁')) return; 
        
        const cat = (item.categoria || '').toLowerCase();
        const isBebida = cat === 'bebidas' || cat.includes('gaseosa') || cat.includes('chicha') || cat.includes('cerveza') || cat.includes('sporade') || cat.includes('agua');
        const isTaper = cat === 'tapers' || cat.includes('taper') || cat.includes('bolsa');

        const mapToUse = isBebida ? bebidasMap : (isTaper ? tapersMap : platosMap);
        mapToUse[item.nombre] = (mapToUse[item.nombre] || 0) + (item.cantidad || 1);
      });
    }
  });

  const platosVendidos = Object.entries(platosMap).sort((a, b) => b[1] - a[1]);
  const bebidasVendidas = Object.entries(bebidasMap).sort((a, b) => b[1] - a[1]);
  const tapersVendidos = Object.entries(tapersMap).sort((a, b) => b[1] - a[1]);

  const totalPlatos = platosVendidos.reduce((sum, [_, q]) => sum + q, 0);
  const totalBebidas = bebidasVendidas.reduce((sum, [_, q]) => sum + q, 0);
  const totalTapers = tapersVendidos.reduce((sum, [_, q]) => sum + q, 0);

  const aggregatedItems = [...platosVendidos, ...bebidasVendidas, ...tapersVendidos];
  
  const handlePrintBrowser = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Cierre de Caja - ${mozoNombre}</title>
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
          <div class="text-center font-bold" style="font-size: 20px; margin-bottom: 4px;">REPORTE DE CAJA</div>
          <div class="text-center" style="font-size: 12px; margin-bottom: 6px;">${negocioNombre}</div>
          <div class="line"></div>
          <div style="font-size: 14px;"><span class="font-bold">Mozo:</span> ${mozoNombre}</div>
          <div style="font-size: 14px;"><span class="font-bold">Fecha:</span> ${fecha}</div>
          <div class="line"></div>
          <div class="text-center font-bold" style="font-size: 16px; margin: 10px 0;">TOTAL VENDIDO</div>
          <div class="text-center font-bold" style="font-size: 24px; margin-bottom: 10px;">S/ ${total.toFixed(2)}</div>
          <div class="line"></div>
          <div style="font-size: 14px; margin-top: 5px;" class="font-bold">DESGLOSE DE PAGOS:</div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;"><span>Efectivo:</span> <span>S/ ${totalEfectivo.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;"><span>Yape:</span> <span>S/ ${totalYape.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;"><span>Tarjeta:</span> <span>S/ ${totalTarjeta.toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="line"></div>
          
          <div style="font-size: 14px; margin-top: 5px; margin-bottom: 5px;" class="font-bold">CANTIDAD DE PLATOS VENDIDOS: ${totalPlatos}</div>
          ${platosVendidos.length > 0 ? platosVendidos.map(([name, qty]) => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span style="flex: 1; padding-right: 5px;">${name}</span>
              <span style="white-space: nowrap;">(${qty})</span>
            </div>
          `).join('') : '<div style="font-size: 12px;">0</div>'}

          ${bebidasVendidas.length > 0 ? `
            <div class="line"></div>
            <div style="font-size: 14px; margin-top: 5px; margin-bottom: 5px;" class="font-bold">BEBIDAS VENDIDAS: ${totalBebidas}</div>
            ${bebidasVendidas.map(([name, qty]) => `
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span style="flex: 1; padding-right: 5px;">${name}</span>
                <span style="white-space: nowrap;">(${qty})</span>
              </div>
            `).join('')}
          ` : ''}

          ${tapersVendidos.length > 0 ? `
            <div class="line"></div>
            <div style="font-size: 14px; margin-top: 5px; margin-bottom: 5px;" class="font-bold">TAPERS/OTROS: ${totalTapers}</div>
            ${tapersVendidos.map(([name, qty]) => `
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span style="flex: 1; padding-right: 5px;">${name}</span>
                <span style="white-space: nowrap;">(${qty})</span>
              </div>
            `).join('')}
          ` : ''}
          <div class="line"></div>
          <div class="text-center" style="margin-top: 8px; font-size: 12px; color: #666;">Cierre de Turno</div>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cierre de Caja</h2>
            <p className="text-xs text-gray-500 mt-0.5">{mozoNombre} · {fecha}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-6 flex flex-col items-center">
          <p className="text-gray-500 font-semibold mb-2">Total Recaudado</p>
          <p className="text-4xl font-black text-blue-600 mb-6">S/ {total.toFixed(2)}</p>
          
          <button
            onClick={async () => {
              if (!confirm('¿Estás seguro de cerrar la caja de este turno? Esto pondrá en cero el reporte para el próximo turno.')) return;
              // Llamar a la API para cerrar
              const detalle = aggregatedItems.length > 0 ? aggregatedItems.map(([name, qty]) => `${name} x${qty}`).join(', ') : 'Sin productos';
              
              try {
                const res = await fetch('/api/pedidos/cierre', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mozo_id: mozoId, mozo_nombre: mozoNombre, fecha, turno, total, detalle })
                });
                if (res.ok) {
                  handlePrintBrowser();
                  onClose();
                  window.location.reload(); // Para refrescar los reportes a 0
                } else {
                  alert('Hubo un error al cerrar la caja oficialmente.');
                }
              } catch (e) {
                alert('Error de conexión al cerrar la caja.');
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-black transition-colors text-sm font-semibold mb-2"
          >
            <Printer size={16} />
            Cerrar Caja Oficial e Imprimir
          </button>
          
          <button
            onClick={handlePrintBrowser}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
          >
            Solo Imprimir (Sin cerrar)
          </button>
        </div>
      </div>
    </div>
  );
}
