'use client';
import { useEffect, useState } from 'react';

export default function NotificacionesToast({ usuarioId, rol }: { usuarioId?: string, rol: string }) {
  const [notificacion, setNotificacion] = useState<any>(null);

  useEffect(() => {
    // Revisar notificaciones nuevas cada 10 segundos
    const checkNotifs = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (rol) queryParams.append('rol', rol);
        if (usuarioId) queryParams.append('usuario_id', usuarioId);
        
        const res = await fetch(`/api/notificaciones?${queryParams.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Asumiendo que la API retorna un array con leida: 0
        const nueva = data[0]; 
        if (nueva && (!notificacion || notificacion.id !== nueva.id)) {
          setNotificacion(nueva);
          
          // Reproducir sonido!
          try {
            const audio = new Audio('/notification.mp3'); // Require an audio file to exist
            audio.play().catch(() => {});
          } catch (e) {}
          
          // Marcar como leída en la BD (asincronamente)
          fetch(`/api/notificaciones/${nueva.id}/leida`, { method: 'POST' }).catch(() => {});
        }
      } catch (e) {}
    };
    
    // Check initial and then every 10s
    checkNotifs();
    const interval = setInterval(checkNotifs, 10000);
    return () => clearInterval(interval);
  }, [usuarioId, rol, notificacion]);

  if (!notificacion) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-blue-500 shadow-xl rounded-lg p-4 z-[9999] animate-[slideIn_0.3s_ease-out_forwards]">
      <h4 className="font-bold text-gray-900">{notificacion.titulo}</h4>
      <p className="text-sm text-gray-600 mt-1">{notificacion.mensaje}</p>
      <button 
        onClick={() => setNotificacion(null)} 
        className="mt-3 text-xs text-blue-600 font-bold uppercase hover:text-blue-800 transition-colors"
      >
        Cerrar
      </button>
    </div>
  );
}
