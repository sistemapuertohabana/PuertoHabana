'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Bell, Volume2 } from 'lucide-react';
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

// ── Reproducir sonido usando Web Audio API (no bloqueado por autoplay policies) ──
const audioCtxRef: { current: AudioContext | null } = { current: null };

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

async function playBeep(frequency: number = 880, duration: number = 250, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    // Resume if suspended (autoplay policy) — esperar a que se reanude
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
}

async function playNotificationSound() {
  // Two-tone chime: first tone higher, second tone lower
  await playBeep(1047, 150, 'sine'); // C6
  setTimeout(() => playBeep(784, 250, 'sine'), 170); // G5

  // Also try MP3 as enhancement (may be blocked, that's ok)
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {}
}

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const router = useRouter();
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [activado] = useState(() => {
    if (typeof window === 'undefined') return false;
    const val = localStorage.getItem('notificaciones_activas');
    if (val === 'false') return false;
    if (val === null) localStorage.setItem('notificaciones_activas', 'true');
    return true;
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cerrar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (beepTimeoutRef.current) clearTimeout(beepTimeoutRef.current);
    setSaliendo(true);
    setTimeout(() => {
      setNotificacion(null);
      setSaliendo(false);
    }, 300);
  }, []);

  // ── Manejar nueva notificación ─────────────────────────────────────────
  const onNuevaNotificacion = useCallback((notif: Notificacion) => {
    if (notifiedIds.current.has(notif.id)) return;
    notifiedIds.current.add(notif.id);
    setNotificacion(notif);

    // 🔊 Sonido más confiable
    playNotificationSound();

    // 📳 Vibración en dispositivos móviles
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Auto-dismiss después de 8 segundos
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => cerrar(), 8000);
  }, [cerrar]);

  // ── Suscripción Realtime ───────────────────────────────────────────────
  useNotificacionesRealtime(rol, usuarioId, onNuevaNotificacion);

  // ── Polling fallback cada 10s ──────────────────────────────────────────
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

  // Marcar como leída
  useEffect(() => {
    if (notificacion && !notificacion.leida) {
      fetch(`/api/notificaciones/${notificacion.id}/leida`, { method: 'POST' }).catch(() => {});
    }
  }, [notificacion]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && notificacion) cerrar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [notificacion, cerrar]);

  if (!activado || !notificacion) return null;

  const icono = detectarIcono(notificacion);

  return (
    <>
      {/* Backdrop overlay para interrumpir visualmente */}
      <div
        className={`fixed inset-0 z-[9998] ${
          saliendo ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        style={{
          background: 'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
        onClick={cerrar}
      />

      {/* Notificación Toast — más grande, con bounce, centrada visible */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[400px] max-w-md ${
          saliendo
            ? 'animate-out fade-out scale-95 opacity-0'
            : 'animate-in fade-in zoom-in-95 duration-300'
        }`}
      >
        <div
          className="relative bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer transition-all hover:shadow-[0_20px_70px_-12px_rgba(0,0,0,0.3)]"
          onClick={irAPagina}
        >
          {/* Gradient accent bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${icono.bg}`} />

          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Icon with pulse animation */}
              <div className={`relative mt-0.5 w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden animate-pulse`}>
                <span className="text-2xl">{icono.icon}</span>
                {/* Ring pulse */}
                <div className={`absolute inset-0 rounded-xl ring-2 ring-transparent ${!saliendo ? 'animate-ping opacity-30' : ''}`}
                  style={{ animationDuration: '1.5s' }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900 leading-snug">
                        {notificacion.titulo}
                      </h4>
                      <Volume2 size={14} className="text-blue-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-blue-500 mt-0.5 font-medium">
                      {rol === 'cocina' ? 'Toca para ir a cocina' :
                       rol === 'mozo' ? 'Toca para ver tus pedidos' :
                       'Toca para ir a tu panel'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); cerrar(); }}
                    aria-label="Cerrar notificación"
                    className="shrink-0 -mt-0.5 -mr-1 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed pr-2 font-medium">
                  {notificacion.mensaje}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-50">
                  <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Bell size={11} />
                    Puerto Habana
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-blue-400 font-semibold">Ver panel →</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); cerrar(); }}
                      className="text-[12px] font-bold text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all active:scale-95"
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
    </>
  );
}
