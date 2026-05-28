'use client';

import { Printer, X } from 'lucide-react';

interface CierreCajaTicketProps {
  mozoNombre: string;
  fecha: string;
  total: number;
  onClose: () => void;
  negocioNombre?: string;
}

export default function CierreCajaTicket({
  mozoNombre,
  fecha,
  total,
  onClose,
  negocioNombre = process.env.NEXT_PUBLIC_NEGOCIO_NOMBRE ?? 'CEVICHERIA PUERTO HABANA',
}: CierreCajaTicketProps) {
  
  const handlePrintBrowser = () => {
    const ventana = window.open('', '_blank', 'width=280,height=500');
    if (!ventana) {
      alert('Por favor permite las ventanas emergentes (pop-ups) para imprimir.');
      return;
    }

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
          <div class="text-center" style="margin-top: 8px; font-size: 12px; color: #666;">Cierre de Turno</div>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
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
            onClick={handlePrintBrowser}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <Printer size={16} />
            Imprimir Cierre (Navegador)
          </button>
        </div>
      </div>
    </div>
  );
}
