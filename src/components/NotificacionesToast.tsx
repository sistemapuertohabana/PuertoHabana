'use client';
import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';

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

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const [notificacion, setNotificacion] = useState<any>(null);
  const [activado, setActivado] = useState(false);
  const [checking, setChecking] = useState(true);

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

  if (!notificacion) return null;

  return (
    <div className="fixed top-6 right-6 border-l-4 border-blue-500 shadow-2xl rounded-2xl p-5 z-[9999] max-w-sm animate-in slide-in-from-right-8 duration-300" style={{ background: 'var(--background)' }}>
      <div className="flex items-start gap-4">
        <div className="mt-1 w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <BellRing size={20} />
        </div>
        <div>
          <h4 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>{notificacion.titulo}</h4>
          <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--muted)' }}>{notificacion.mensaje}</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => setNotificacion(null)}
          className="text-xs px-5 py-2.5 rounded-xl font-bold uppercase transition-colors"
          style={{ background: 'color-mix(in srgb, var(--background) 80%, white)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
