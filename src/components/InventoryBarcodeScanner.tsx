'use client';

import { useState, useRef, useEffect } from 'react';
import { Barcode, Camera, CameraOff, Loader2, X, ScanLine, Package } from 'lucide-react';

interface BarcodeResult {
  barcode: string;
  productInfo?: {
    nombre: string;
    precio?: number;
    imagen_url?: string;
  };
}

interface Props {
  onScan: (result: BarcodeResult) => void;
  onClose?: () => void;
}

export default function InventoryBarcodeScanner({ onScan, onClose }: Props) {
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const scannerRef = useRef<any>(null);

  const iniciarCamara = async () => {
    setError('');
    setEscaneando(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('barcode-reader-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 200 },

        },
        async (decodedText: string) => {
          await scanner.stop();
          setEscaneando(false);
          setCargando(true);

          // Buscar el código de barras en el inventario
          try {
            const res = await fetch(`/api/inventario?codigo_barras=${encodeURIComponent(decodedText)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.length > 0) {
                const item = data[0];
                onScan({
                  barcode: decodedText,
                  productInfo: {
                    nombre: item.nombre,
                    precio: item.precio,
                    imagen_url: item.imagen_url,
                  },
                });
              } else {
                // Producto no encontrado, pasar el código
                onScan({ barcode: decodedText });
              }
            } else {
              onScan({ barcode: decodedText });
            }
          } catch {
            onScan({ barcode: decodedText });
          }
          setCargando(false);
        },
        () => {} // frame errors ignored
      );
    } catch (err: any) {
      setError(err?.message || 'No se pudo acceder a la cámara');
      setEscaneando(false);
    }
  };

  const detenerCamara = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setEscaneando(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Escanear Código de Barras</h3>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="relative">
        <div id="barcode-reader-container" className={`w-full aspect-[4/3] max-w-sm mx-auto bg-gray-900 rounded-xl overflow-hidden ${!escaneando ? 'hidden' : ''}`} />

        {!escaneando && !cargando && (
          <div className="w-full aspect-[4/3] max-w-sm mx-auto bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
            <ScanLine size={40} className="text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">Escáner inactivo</p>
            <button
              onClick={iniciarCamara}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
            >
              <Camera size={16} />
              Iniciar Escáner
            </button>
          </div>
        )}
      </div>

      {cargando && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <span className="text-sm text-gray-600 font-medium">Buscando producto...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700">Error: {error}</p>
        </div>
      )}

      {escaneando && (
        <button
          onClick={detenerCamara}
          className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <CameraOff size={16} />
          Detener Escáner
        </button>
      )}
    </div>
  );
}
