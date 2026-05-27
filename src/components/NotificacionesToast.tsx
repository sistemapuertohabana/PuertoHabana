'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [activado] = useState(() => {
    if (typeof window === 'undefined') return false;
    const val = localStorage.getItem('notificaciones_activas');
    // Por defecto activado, igual que antes — solo desactivado si el usuario fue a
    // configuración y lo apagó explícitamente (val === 'false')
    if (val === 'false') return false;
    // Persistir el valor por defecto para que futuras lecturas sean consistentes
    if (val === null) localStorage.setItem('notificaciones_activas', 'true');
    return true;
  });

  const cerrar = useCallback(() => {
    setSaliendo(true);
    setTimeout(() => {
      setNotificacion(null);
      setSaliendo(false);
    }, 250);
  }, []);

  // ── Reproducir sonido de notificación ──────────────────────────────────
  const playNotifSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  // ── Manejar nueva notificación (Realtime o polling) ────────────────────
  const onNuevaNotificacion = useCallback((notif: Notificacion) => {
    // Evitar duplicados cuando Realtime y polling detectan la misma notificación
    if (notifiedIds.current.has(notif.id)) return;
    notifiedIds.current.add(notif.id);
    setNotificacion(notif);
    playNotifSound();

    // Auto-dismiss después de 6 segundos
    setTimeout(() => {
      cerrar();
    }, 6000);
  }, [cerrar, playNotifSound]);

  // ── Suscripción Realtime (en vivo) ─────────────────────────────────────
  useNotificacionesRealtime(rol, usuarioId, onNuevaNotificacion);

  // ── Polling fallback cada 10s (por si Realtime no está disponible) ─────
  const notifiedIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!activado) return;

    const pollNotifs = async () => {
      try {
        const params = new URLSearchParams({ leida: 'false' });
        if (rol) params.append('rol_destino', rol);
        if (usuarioId) params.append('usuario_id', usuarioId);

        const res = await fetch(`/api/notificaciones?${params.toString()}`);
        if (!res.ok) return;
        const data: Notificacion[] = await res.json();

        // Tomar la más reciente no mostrada aún
        const nueva = data.find(n => !notifiedIds.current.has(n.id));
        if (nueva) {
          notifiedIds.current.add(nueva.id);
          onNuevaNotificacion(nueva);
        }
      } catch {}
    };

    pollNotifs();
    const interval = setInterval(pollNotifs, 10000);
    return () => clearInterval(interval);
  }, [rol, usuarioId, activado, onNuevaNotificacion]);

  const irAPagina = () => {
    const destino = rutasPorRol[rol] || '/';
    cerrar();
    router.push(destino);
  };

  // Marcar como leída en la BD cuando se ve (solo si llega por polling, Realtime ya la filtró)
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
