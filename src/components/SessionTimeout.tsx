'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

const ADMIN_INACTIVITY_TIME = 60 * 60 * 1000; // 1 hora para admin en milisegundos
const OTHER_INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutos para otros roles

export default function SessionTimeout() {
  const [expired, setExpired] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const resetTimer = useCallback(() => {
    if (expired) return;
    localStorage.setItem('lastActivity', Date.now().toString());
  }, [expired]);

  useEffect(() => {
    // No aplicar inactividad en la pantalla de inicio o pantallas de login público si las hubiera
    if (pathname === '/') return;

    // Determinar el rol del usuario actual
    const adminSession = localStorage.getItem('ph_admin_session');
    const isAdmin = !!adminSession;
    const timeoutTime = isAdmin ? ADMIN_INACTIVITY_TIME : OTHER_INACTIVITY_TIME;

    // Inicializar el timer en localStorage
    localStorage.setItem('lastActivity', Date.now().toString());

    const checkInactivity = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (Date.now() - lastActivity > timeoutTime) {
        setExpired(true);
      }
    }, 10000); // Revisar cada 10 segundos

    // Eventos que reinician el timer
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      clearInterval(checkInactivity);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [pathname, resetTimer]);

  const handleCerrarSesion = () => {
    // Limpiar todas las sesiones
    localStorage.removeItem('ph_admin_session');
    localStorage.removeItem('ph_mozo_session');
    localStorage.removeItem('ph_cocina_session');
    localStorage.removeItem('ph_lavaplato_session');
    localStorage.removeItem('ph_desarrollador_session');
    localStorage.removeItem('lastActivity');
    
    // NOTA: No eliminar sessionStorage de notificaciones para mantenerlas activas
    // sessionStorage.removeItem('notificaciones_activas');
    
    setExpired(false);
    router.push('/');
  };

  if (!expired) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-black rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl border border-gray-800">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
          <ShieldAlert size={40} className="text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Sesión Expirada</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Por tu seguridad, hemos cerrado tu sesión debido a inactividad en el sistema.
        </p>
        
        <button
          onClick={handleCerrarSesion}
          className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-colors shadow-lg"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
