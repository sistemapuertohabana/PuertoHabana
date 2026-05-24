'use client';
import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const [notificacion, setNotificacion] = useState<any>(null);
  const [activado, setActivado] = useState(false);
  const [checking, setChecking] = useState(true);

  // Intentar cargar estado de activación desde sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const permiso = sessionStorage.getItem('notificaciones_activas');
      if (permiso === 'true') {
        setActivado(true);
      }
      
      // Registrar Service Worker para notificaciones nativas
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
      setChecking(false);
    }
  }, []);

  const habilitarAlertas = async () => {
    // Pedir permiso nativo al navegador
    if ('Notification' in window) {
      await Notification.requestPermission().catch(() => {});
    }
    // Reproducir un sonido vacío para desbloquear el AudioContext en el navegador
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0; // silenciado
      await audio.play();
    } catch (e) {}

    sessionStorage.setItem('notificaciones_activas', 'true');
    setActivado(true);
  };
  const desactivar = () => {
    // Elimina flag y desactiva notificaciones
    sessionStorage.removeItem('notificaciones_activas');
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

  // Pantalla de bloqueo obligatorio si no ha activado las notificaciones
  if (!activado) {
    return (
      <div className="fixed inset-0 bg-black/70 z-[99999] flex items-center justify-center p-4 backdrop-blur-md">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <BellRing size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Activar Notificaciones</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm px-4">
            Para que recibas las alertas de nuevos pedidos y pagos en tiempo real con sonido, necesitas activar este permiso. Es obligatorio para usar el sistema.
          </p>
          <button
            onClick={habilitarAlertas}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-lg flex items-center justify-center gap-2"
          >
            <BellRing size={20} />
            Activar Ahora
          </button>
        </div>
      </div>
    );
  }

  if (!notificacion) return null;

  return (
    <div className="fixed top-6 right-6 bg-white border-l-4 border-blue-500 shadow-2xl rounded-2xl p-5 z-[9999] max-w-sm animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-start gap-4">
        <div className="mt-1 w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <BellRing size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-base">{notificacion.titulo}</h4>
          <p className="text-sm text-gray-600 mt-1 leading-snug">{notificacion.mensaje}</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => setNotificacion(null)}
          className="text-xs bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl font-bold uppercase hover:bg-gray-200 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
