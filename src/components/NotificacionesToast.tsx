'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const iconMap: Record<string, { bg: string, icon: string }> = {
  asistencia: { bg: 'from-emerald-500 to-teal-500', icon: '✅' },
  comanda:    { bg: 'from-blue-500 to-indigo-500', icon: '🍽️' },
  default:    { bg: 'from-blue-500 to-indigo-500', icon: '🔔' },
};

function detectarIcono(titulo: string, mensaje: string) {
  const txt = (titulo + ' ' + mensaje).toLowerCase();
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
  const [notificacion, setNotificacion] = useState<any>(null);
  const [activado, setActivado] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saliendo, setSaliendo] = useState(false);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(() => {
      setNotificacion(null);
      setSaliendo(false);
    }, 250);
  };

  // Intentar cargar estado de activación desde sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const permiso = localStorage.getItem('notificaciones_activas');
      // NOT activadas por defecto a menos que el usuario las haya desactivado explícitamente
      if (permiso !== 'false') {
        localStorage.setItem('notificaciones_activas', 'true');
        setActivado(true);
      }
      
      // Registrar Service Worker para notificaciones nativas
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
      setChecking(false);
    }
    
    // Escuchar mensajes del Service Worker para navegación (desde notificationclick)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE' && event.data.url) {
        router.push(event.data.url);
      }
    };
    if (typeof window !== 'undefined') {
      navigator.serviceWorker?.addEventListener('message', handleMessage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        navigator.serviceWorker?.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  // Auto-suscribir a PushManager cuando se activan las notificaciones
  useEffect(() => {
    if (activado && !checking) {
      const timer = setTimeout(() => suscribirPush(), 1500);
      return () => clearTimeout(timer);
    }
  }, [activado, checking]);

  // Suscribir al PushManager cuando se activan las notificaciones
  const suscribirPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      
      // Verificar que la VAPID public key exista
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        console.warn('[Push] VAPID public key no configurada');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      
      // Obtener suscripción existente o crear una nueva
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      // Guardar la suscripción en el servidor
      await fetch('/api/notificaciones/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId || null,
          rol,
          subscription: subscription.toJSON(),
        }),
      });
    } catch (err) {
      console.warn('[Push] Error al suscribir:', err);
    }
  };

  const habilitarAlertas = async () => {
    // Reproducir un sonido vacío para desbloquear el AudioContext en el navegador
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0; // silenciado
      await audio.play();
    } catch (e) {}

    // Suscribir al PushManager (pide permiso nativo internamente)
    suscribirPush();

    localStorage.setItem('notificaciones_activas', 'true');
    setActivado(true);
  };
  const desactivar = () => {
    // Elimina flag y desactiva notificaciones
    localStorage.removeItem('notificaciones_activas');
    setActivado(false);
    setNotificacion(null);
  };
  useEffect(() => {
    if (!activado) return;

    const dismissed = new Set<string>();

    const checkNotifs = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (rol) queryParams.append('rol_destino', rol);
        if (usuarioId) queryParams.append('usuario_id', usuarioId);
        queryParams.append('leida', 'false');
        
        const res = await fetch(`/api/notificaciones?${queryParams.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Filtramos solo las no leídas
        const nueva = data.find((n: any) => !n.leida && !dismissed.has(String(n.id))); 
        
        if (nueva && (!notificacion || notificacion.id !== nueva.id)) {
          setNotificacion(nueva);
          dismissed.add(String(nueva.id));
          
          // Lanzar Notificación Nativa (Soporte móvil Android/PWA)
          if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                  reg.showNotification(nueva.titulo, { body: nueva.mensaje, icon: '/icon.png' }).catch(() => {});
                } else {
                  new Notification(nueva.titulo, { body: nueva.mensaje, icon: '/icon.png' });
                }
              }).catch(() => {});
            } else {
              new Notification(nueva.titulo, { body: nueva.mensaje, icon: '/icon.png' });
            }
          }

          // Reproducir sonido!
          try {
            const audio = new Audio('/notification.mp3'); 
            audio.volume = 1;
            audio.play().catch(() => {});
          } catch (e) {}
          
          // Marcar como leída en la BD asíncronamente
          fetch(`/api/notificaciones/${nueva.id}/leida`, { method: 'POST' }).catch(() => {});
        }
      } catch (e) {}
    };
    
    checkNotifs();
    const interval = setInterval(checkNotifs, 10000);
    return () => clearInterval(interval);
  }, [usuarioId, rol, activado]); // Se removió notificacion de las dependencias para evitar bucles

  // Evitar parpadeo (flash) del modal
  if (checking) return null;

  // Si no está activado, no mostramos nada y dejamos que lo active en configuración
  if (!activado) return null;

  const irAPagina = () => {
    const destino = rutasPorRol[rol] || '/';
    cerrar();
    router.push(destino);
  };

  if (!notificacion) return null;

  const icono = detectarIcono(notificacion.titulo, notificacion.mensaje);

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] max-w-sm w-[calc(100%-2.5rem)] sm:w-auto sm:min-w-[340px] ${saliendo ? 'animate-out slide-out-to-right-8 opacity-0' : 'animate-in slide-in-from-right-8 fade-in'} duration-300`}
    >
      <div className="relative bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer transition-all hover:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.18)]" onClick={irAPagina}>
        {/* Gradient accent bar at top */}
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
