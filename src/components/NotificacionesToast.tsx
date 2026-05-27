'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useNotificacionesRealtime, type Notificacion } from '@/hooks/usePedidosRealtime';

const iconMap: Record<string, { bg: string, icon: string }> = {
  asistencia: { bg: 'from-emerald-500 to-teal-500', icon: '✅' },
  comanda:    { bg: 'from-blue-500 to-indigo-500', icon: '🍽️' },
  default:    { bg: 'from-blue-500 to-indigo-500', icon: '🔔' },
};

function detectarIcono(notif: Notificacion) {
  const txt = (notif.titulo + ' ' + notif.mensaje).toLowerCase();
  if (txt.includes('asisten')) return iconMap.asistencia;
  if (txt.includes('comanda') || txt.includes('pedido') || txt.includes('cocina')) return iconMap.comanda;
  return iconMap.default;
}

const rutasPorRol: Record<string, string> = {
  admin: '/admin/dashboard',
  mozo: '/mozo',
  cocina: '/cocina',
  lavaplato: '/lavaplato',
  desarrollador: '/desarrollador',
};

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const router = useRouter();
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [activado] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('notificaciones_activas') === 'true'
      : false
  );

  const cerrar = useCallback(() => {
    setSaliendo(true);
    setTimeout(() => {
      setNotificacion(null);
      setSaliendo(false);
    }, 250);
  }, []);

  // Suscripción Realtime — llegan notificaciones al instante
  // (el sonido de notificaciones push nativas se maneja en sw.ts con sound: '/notification.mp3')
  const onNuevaNotificacion = useCallback((notif: Notificacion) => {
    setNotificacion(notif);
    
    // Reproducir sonido!
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    // Auto-dismiss después de 6 segundos
    setTimeout(() => {
      cerrar();
    }, 6000);
  }, [cerrar]);

  useNotificacionesRealtime(rol, usuarioId, onNuevaNotificacion);

  const irAPagina = () => {
    const destino = rutasPorRol[rol] || '/';
    cerrar();
    router.push(destino);
  };

  // Marcar como leída en la BD cuando se ve
  useEffect(() => {
    if (notificacion && !notificacion.leida) {
      fetch(`/api/notificaciones/${notificacion.id}/leida`, { method: 'POST' }).catch(() => {});
    }
  }, [notificacion]);

  if (!activado || !notificacion) return null;

  const icono = detectarIcono(notificacion);

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] max-w-sm w-[calc(100%-2.5rem)] sm:w-auto sm:min-w-[340px] ${
        saliendo ? 'animate-out slide-out-to-right-8 opacity-0' : 'animate-in slide-in-from-right-8 fade-in'
      } duration-300`}
    >
      <div
        className="relative bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer transition-all hover:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.18)]"
        onClick={irAPagina}
      >
        {/* Gradient accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${icono.bg}`} />

        <div className="p-4">
          <div className="flex items-start gap-3.5">
            {/* Icon */}
            <div className="relative mt-0.5 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
              <span className="text-lg">{icono.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 leading-snug hover:text-blue-600 transition-colors">
                    {notificacion.titulo}
                  </h4>
                  <p className="text-[10px] text-blue-500 mt-0.5 font-medium">
                    Toca para ir a {rol === 'cocina' ? 'cocina' : rol === 'mozo' ? 'tus pedidos' : 'tu panel'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); cerrar(); }}
                  aria-label="Cerrar notificación"
                  className="shrink-0 -mt-0.5 -mr-1 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed pr-2">
                {notificacion.mensaje}
              </p>

              <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-50">
                <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider">
                  Puerto Habana
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-400 font-medium">Ver panel →</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); cerrar(); }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 px-3.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all active:scale-95"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
