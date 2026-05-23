'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutos en milisegundos

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

    // Inicializar el timer en localStorage
    localStorage.setItem('lastActivity', Date.now().toString());

    const checkInactivity = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (Date.now() - lastActivity > INACTIVITY_TIME) {
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
    
    setExpired(false);
    router.push('/');
  };

  if (!expired) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sesión Expirada</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Por tu seguridad, hemos cerrado tu sesión debido a {INACTIVITY_TIME / 60000} minutos de inactividad en el sistema.
        </p>
        
        <button
          onClick={handleCerrarSesion}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-red-600/30"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
