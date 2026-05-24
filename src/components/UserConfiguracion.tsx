'use client';

import { useState, useEffect } from 'react';
import { Settings, BellRing, Palette, Check } from 'lucide-react';
import { useLocalStorageValue } from '@/hooks/useProfilePhoto';

type SidebarDesign = 'minimalista' | 'bonito' | 'normal' | 'azul';
type NavbarStyle  = 'original' | 'minimalista' | 'centrado' | 'grande' | 'flotante' | 'flotante_blue_new';

const navbarPreviews = {
  original: {
    bg: 'bg-white',
    accent: 'text-blue-600',
    label: 'Original',
    desc: 'Íconos con fondo redondeado',
  },
  minimalista: {
    bg: 'bg-white',
    accent: 'text-black',
    label: 'Minimalista',
    desc: 'Solo íconos, sin fondo',
  },
  centrado: {
    bg: 'bg-gray-50',
    accent: 'text-black',
    label: 'Centrado',
    desc: 'Íconos centrados con etiqueta',
  },
  grande: {
    bg: 'bg-white',
    accent: 'text-blue-600',
    label: 'Grande',
    desc: 'Íconos grandes con etiqueta',
  },
  flotante: {
    bg: 'bg-white rounded-full mx-4 mb-4 shadow-lg border-0',
    accent: 'bg-blue-600 text-white rounded-full',
    label: 'Flotante (Nuevo)',
    desc: 'Bordes muy redondos, estilo flotante',
  },
  flotante_blue_new: {
    bg: 'bg-blue-600 rounded-full mx-4 mb-4 shadow-lg border-0',
    accent: 'bg-white text-blue-600 rounded-full',
    label: 'FLOTANTE BLUE NEW',
    desc: 'Fondo azul, botones blancos',
  },
};

export default function UserConfiguracion({ role }: { role: string }) {
  const [sidebarDesign, setSidebarDesign] = useState<SidebarDesign>('normal');
  const [navbarStyle, setNavbarStyle] = useState<NavbarStyle>('original');
  const [notifActivas, setNotifActivas] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebarDesign((localStorage.getItem(`sidebarDesign_${role}`) as SidebarDesign) || 'normal');
    setNavbarStyle((localStorage.getItem(`navbarStyle_${role}`) as NavbarStyle) || 'original');
    setNotifActivas(sessionStorage.getItem('notificaciones_activas') === 'true');
  }, []);

  const changeSidebar = (val: SidebarDesign) => {
    setSidebarDesign(val);
    localStorage.setItem(`sidebarDesign_${role}`, val);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  const changeNavbar = (val: NavbarStyle) => {
    setNavbarStyle(val);
    localStorage.setItem(`navbarStyle_${role}`, val);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={24} className="text-blue-600" /> Configuraciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ajusta las notificaciones y apariencia de la aplicación.</p>
      </div>

      <div className="space-y-6">
        {/* Notificaciones */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BellRing size={18} className="text-gray-500" /> Notificaciones Push
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Recibir alertas en tiempo real</p>
              <p className="text-xs text-gray-500 mt-1">Te avisaremos con sonido cuando ocurran eventos importantes de tu área.</p>
            </div>
            <button
              onClick={async () => {
                if (notifActivas) {
                  sessionStorage.removeItem('notificaciones_activas');
                  setNotifActivas(false);
                } else {
                  if ('Notification' in window) await Notification.requestPermission().catch(() => {});
                  try { const a = new Audio('/notification.mp3'); a.volume = 0; await a.play(); } catch {}
                  sessionStorage.setItem('notificaciones_activas', 'true');
                  setNotifActivas(true);
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                notifActivas
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {notifActivas ? 'Desactivar Alertas' : 'Activar Alertas'}
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Palette size={18} className="text-gray-500" /> Diseño del Sidebar
          </h2>
          <p className="text-xs text-gray-400 mb-4">Afecta la barra lateral en tablets y computadoras.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'normal', label: 'Estándar', desc: 'Menú limpio y clásico' },
              { id: 'bonito', label: 'Elegante', desc: 'Bordes suaves, íconos grandes' },
              { id: 'minimalista', label: 'Minimalista', desc: 'Solo íconos, moderno' },
              { id: 'azul', label: 'Azul (Nuevo)', desc: 'Fondo azul, botones blancos' },
            ].map(d => {
              const active = sidebarDesign === d.id;
              return (
                <button key={d.id} onClick={() => changeSidebar(d.id as SidebarDesign)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Navbar */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Palette size={18} className="text-gray-500" /> Estilo Navigation Bar
          </h2>
          <p className="text-xs text-gray-400 mb-4">Afecta la barra inferior en celular.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.entries(navbarPreviews) as [NavbarStyle, typeof navbarPreviews.original][]).map(([key, p]) => {
              const active = navbarStyle === key;
              return (
                <button key={key} onClick={() => changeNavbar(key)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <div className={`w-full h-10 rounded-lg mb-2.5 ${p.bg} border border-gray-200 flex items-center px-2`}>
                    {key === 'centrado' ? (
                      <div className="flex justify-center gap-3 w-full">
                        {[0,1,2].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} />)}
                      </div>
                    ) : key === 'grande' ? (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => <div key={i} className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-200'}`} />)}
                      </div>
                    ) : key === 'flotante_blue_new' ? (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-white' : 'bg-blue-400'}`} />)}
                      </div>
                    ) : (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? (key === 'minimalista' ? 'bg-black' : 'bg-blue-600') : 'bg-gray-200'}`} />)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{p.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{p.desc}</p>
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
