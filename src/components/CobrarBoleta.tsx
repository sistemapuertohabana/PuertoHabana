'use client';

import { useState, useEffect } from 'react';
import Boleta from '@/components/Boleta';
import { QrCode, X } from 'lucide-react';

interface ItemBoleta {
  item: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

interface CobrarBoletaProps {
  pedidos: ItemBoleta[];
  mesaLabel: string;
  mozoNombre: string;
  fecha: string;
  hora: string;
  onSuccess?: () => void;
  className?: string;
}

const YAPE_NUMBER = process.env.NEXT_PUBLIC_YAPE_NUMBER || '942 902 367';
const YAPE_NOMBRE = process.env.NEXT_PUBLIC_YAPE_NOMBRE || 'PUERTO HABANA';

export default function CobrarBoleta({
  pedidos,
  mesaLabel,
  mozoNombre,
  fecha,
  hora,
  onSuccess,
  className = '',
}: CobrarBoletaProps) {
  const [showBoleta, setShowBoleta] = useState(false);
  const [showYapeQR, setShowYapeQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generar QR al abrir el modal
  useEffect(() => {
    if (showYapeQR) {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(YAPE_NUMBER, {
          width: 280,
          margin: 2,
          color: { dark: '#7408B6', light: '#FFFFFF' },
        }).then(setQrDataUrl).catch(() => {});
      });
    }
  }, [showYapeQR]);

  if (!pedidos.length) return null;

  const total = pedidos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  return (
    <div className={className}>
      <div className="flex gap-2">
        <button
          onClick={() => setShowYapeQR(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#7408B6] text-white px-4 py-2.5 rounded-xl hover:bg-[#5C0691] transition-colors text-sm font-semibold"
        >
          <QrCode size={16} />
          QR Yape
        </button>
        <button
          onClick={() => setShowBoleta(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          🧾 Boleta
        </button>
      </div>

      {/* Modal QR Yape */}
      {showYapeQR && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowYapeQR(false);
          }}
        >
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pagar con Yape</h3>
              <button
                onClick={() => setShowYapeQR(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 border-2 border-[#7408B6]/20 shadow-lg mb-4 inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Yape"
                  className="w-56 h-56 mx-auto"
                />
              ) : (
                <div className="w-56 h-56 mx-auto flex items-center justify-center bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 border-2 border-[#7408B6] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-gray-900">{YAPE_NOMBRE}</p>
              <p className="text-lg font-bold text-[#7408B6]">{YAPE_NUMBER}</p>
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <p className="text-xs text-gray-500">Total a pagar</p>
                <p className="text-2xl font-black text-gray-900">S/ {total.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {mesaLabel} · {mozoNombre}
              </p>
            </div>

            <button
              onClick={() => {
                setShowYapeQR(false);
                setShowBoleta(true);
              }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-semibold"
            >
              Imprimir Boleta
            </button>
          </div>
        </div>
      )}

      {/* Modal Boleta */}
      {showBoleta && (
        <Boleta
          mesa={mesaLabel}
          mozoNombre={mozoNombre}
          fecha={fecha}
          hora={hora}
          items={pedidos}
          onClose={() => { setShowBoleta(false); onSuccess?.(); }}
        />
      )}
    </div>
  );
}
