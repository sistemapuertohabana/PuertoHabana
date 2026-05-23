'use client';
import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const [notificacion, setNotificacion] = useState<any>(null);
  const [activado, setActivado] = useState(false);

  // Intentar cargar estado de activación desde sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const permiso = sessionStorage.getItem('notificaciones_activas');
      if (permiso === 'true') {
        setActivado(true);
      }
    }
  }, []);

  const habilitarAlertas = async () => {
    // Pedir permiso nativo al navegador
    if ('Notification' in window) {
      await Notification.requestPermission();
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

  useEffect(() => {
    if (!activado) return;

    const dismissed = new Set<string>();

    const checkNotifs = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (rol) queryParams.append('rol', rol);
        if (usuarioId) queryParams.append('usuario_id', usuarioId);
        
        const res = await fetch(`/api/notificaciones?${queryParams.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        const nueva = data.find((n: any) => !dismissed.has(String(n.id))); 
        
        if (nueva && (!notificacion || notificacion.id !== nueva.id)) {
          setNotificacion(nueva);
          dismissed.add(String(nueva.id));
          
          // Lanzar Notificación Nativa (Soporte móvil Android/PWA)
          if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                  reg.showNotification(nueva.titulo, { body: nueva.mensaje, icon: '/icon.png' });
                } else {
                  new Notification(nueva.titulo, { body: nueva.mensaje, icon: '/icon.png' });
                }
              });
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

  // Botón de desactivación visible cuando está activo
  const toggleBtn = (
    <button
      onClick={desactivar}
      className="fixed top-4 left-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md shadow-md text-sm"
    >
      Desactivar Notificaciones
    </button>
  );

  if (!notificacion) return (
    <>{toggleBtn}</>
  );
