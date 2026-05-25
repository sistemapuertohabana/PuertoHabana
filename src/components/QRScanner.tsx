'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Loader2, CheckCircle, X, AlertCircle, ScanLine } from 'lucide-react';

interface EscaneoResult {
  success: boolean;
  mensaje: string;
  empleado?: string;
  hora?: string;
}

export default function QRScanner({ onClose }: { onClose?: () => void }) {
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState<EscaneoResult | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);

  const iniciarCamara = async () => {
    setError('');
    setResultado(null);
    setEscaneando(true);

    try {
      // Cargar Html5Qrcode dinámicamente
      const { Html5Qrcode } = await import('html5-qrcode');

      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string) => {
          // Detener escaneo al encontrar un QR
          await scanner.stop();
          setEscaneando(false);
          await procesarQR(decodedText);
        },
        () => {
          // Errores de frame ignorados
        }
      );
    } catch (err: any) {
      setError(err?.message || 'No se pudo acceder a la cámara');
      setEscaneando(false);
    }
  };

  const detenerCamara = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setEscaneando(false);
  };

  const procesarQR = async (data: string) => {
    setCargando(true);
    try {
      // Intentar parsear JSON del QR
      let empleadoId = '';
      let nombre = '';

      try {
        const parsed = JSON.parse(data);
        empleadoId = parsed.id || data;
        nombre = parsed.nombre || '';
      } catch {
        // Si no es JSON, asumir que es el ID directamente
        empleadoId = data;
      }

      if (!empleadoId) {
        setResultado({ success: false, mensaje: 'QR inválido: no contiene datos de empleado' });
        setCargando(false);
        return;
      }

      // Registrar asistencia via API
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: empleadoId }),
      });

      if (res.ok) {
        const data = await res.json();
        const hora = data.data?.hora_llegada?.slice(0, 5) || '';
        setResultado({
          success: true,
          mensaje: `✅ Asistencia registrada`,
          empleado: nombre || 'Empleado',
          hora,
        });
      } else if (res.status === 409) {
        setResultado({
          success: false,
          mensaje: '⚠️ Este empleado ya registró asistencia hoy',
          empleado: nombre,
        });
      } else {
        const err = await res.json();
        setResultado({
          success: false,
          mensaje: err?.error || 'Error al registrar asistencia',
          empleado: nombre,
        });
      }
    } catch (err) {
      setResultado({ success: false, mensaje: 'Error al procesar el QR' });
    }
    setCargando(false);
  };

  // Cleanup al desmontar
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
        <h3 className="text-sm font-semibold text-gray-900">Escanear QR de Empleado</h3>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Contenedor del escáner */}
      <div className="relative">
        <div id="qr-reader-container" className={`w-full aspect-square max-w-sm mx-auto bg-gray-900 rounded-xl overflow-hidden ${!escaneando ? 'hidden' : ''}`} />

        {!escaneando && !cargando && !resultado && (
          <div className="w-full aspect-square max-w-sm mx-auto bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
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

        {escaneando && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 border-2 border-cyan-400 rounded-xl opacity-70" />
          </div>
        )}
      </div>

      {/* Estado del escaneo */}
      {cargando && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <span className="text-sm text-gray-600 font-medium">Registrando asistencia...</span>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className={`p-4 rounded-xl border ${
          resultado.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {resultado.success ? (
              <CheckCircle size={20} className="text-green-600 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${resultado.success ? 'text-green-800' : 'text-red-800'}`}>
                {resultado.mensaje}
              </p>
              {resultado.empleado && (
                <p className="text-xs text-gray-600 mt-1">{resultado.empleado}</p>
              )}
              {resultado.hora && (
                <p className="text-xs text-gray-500 mt-0.5">Hora: {resultado.hora} hrs</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setResultado(null); iniciarCamara(); }}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Escanear otro
            </button>
            {resultado.success && onClose && (
              <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <CameraOff size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Error de cámara</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <p className="text-xs text-gray-500 mt-1">
                Asegúrate de haber concedido permisos de cámara y estar en un dispositivo con cámara.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setError(''); setResultado(null); }}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reintentar
            </button>
          </div>
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
