'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Save, User, Layout, Palette, Check } from 'lucide-react';

interface Configuracion {
  nombreEmpresa: string;
  direccion: string;
  telefono: string;
  email: string;
  horarioMañana: string;
  horarioTarde: string;
  fotoPerfil: string;
}

type SidebarDesign = 'minimalista' | 'bonito' | 'normal';
type NavbarStyle   = 'original' | 'minimalista' | 'centrado' | 'grande';

/* Aplica el valor a localStorage y dispara el evento para que los sidebars
   reaccionen en tiempo real sin necesidad de recargar. */
function applyLive(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event('ph_store_update'));
}

/* ─── previews visuales ──────────────────────────────────────────────────── */

const sidebarPreviews: Record<SidebarDesign, { bg: string; accent: string; label: string; desc: string }> = {
  normal: {
    bg: 'bg-white',
    accent: 'bg-blue-600',
    label: 'Normal',
    desc: 'Fondo blanco, ítem activo azul',
  },
  minimalista: {
    bg: 'bg-white',
    accent: 'bg-black',
    label: 'Minimalista',
    desc: 'Fondo blanco, ítem activo negro',
  },
  bonito: {
    bg: 'bg-gradient-to-b from-blue-50 to-white',
    accent: 'bg-blue-600',
    label: 'Bonito',
    desc: 'Degradado azul suave',
  },
};

const navbarPreviews: Record<NavbarStyle, { bg: string; accent: string; label: string; desc: string }> = {
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
};

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion>({
    nombreEmpresa: 'Puerto Habana Cevicheria',
    direccion: 'Av. Principal 123',
    telefono: '+51 123 456 789',
    email: 'contacto@puertohabana.com',
    horarioMañana: '09:00 - 14:00',
    horarioTarde: '15:00 - 23:00',
    fotoPerfil: '',
  });

  const [sidebarDesign, setSidebarDesign] = useState<SidebarDesign>('normal');
  const [navbarStyle,   setNavbarStyle]   = useState<NavbarStyle>('original');
  const [saved,  setSaved]  = useState(false);
  const [mounted,setMounted]= useState(false);

  useEffect(() => {
    setMounted(true);
    const sd  = localStorage.getItem('sidebarDesign') as SidebarDesign | null;
    const ns  = localStorage.getItem('navbarStyle')   as NavbarStyle   | null;
    const fp  = localStorage.getItem('fotoPerfil');
    const cfg = localStorage.getItem('ph_config');
    if (sd)  setSidebarDesign(sd);
    if (ns)  setNavbarStyle(ns);
    if (fp)  setConfig(p => ({ ...p, fotoPerfil: fp }));
    if (cfg) { try { setConfig(p => ({ ...p, ...JSON.parse(cfg) })); } catch {} }
  }, []);

  /* Cambia sidebar en tiempo real */
  const changeSidebar = (d: SidebarDesign) => {
    setSidebarDesign(d);
    applyLive('sidebarDesign', d);
  };

  /* Cambia navbar en tiempo real */
  const changeNavbar = (s: NavbarStyle) => {
    setNavbarStyle(s);
    applyLive('navbarStyle', s);
  };

  const handleSave = () => {
    applyLive('sidebarDesign', sidebarDesign);
    applyLive('navbarStyle',   navbarStyle);
    localStorage.setItem('fotoPerfil', config.fotoPerfil);
    localStorage.setItem('ph_config', JSON.stringify({
      nombreEmpresa: config.nombreEmpresa,
      direccion:     config.direccion,
      telefono:      config.telefono,
      email:         config.email,
      horarioMañana: config.horarioMañana,
      horarioTarde:  config.horarioTarde,
    }));
    window.dispatchEvent(new Event('ph_store_update'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setConfig(p => ({ ...p, fotoPerfil: url }));
      localStorage.setItem('fotoPerfil', url);
      window.dispatchEvent(new Event('ph_store_update'));
    };
    reader.readAsDataURL(file);
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-300 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-400 mt-1">Los cambios de diseño se aplican en tiempo real</p>
      </div>

      <div className="space-y-6">

        {/* ── Info del negocio ─────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Información del Negocio</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nombre del Negocio</label>
            <input type="text" value={config.nombreEmpresa}
              onChange={e => setConfig(p => ({ ...p, nombreEmpresa: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <MapPin size={13} className="inline mr-1" />Dirección
            </label>
            <input type="text" value={config.direccion}
              onChange={e => setConfig(p => ({ ...p, direccion: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                <Phone size={13} className="inline mr-1" />Teléfono
              </label>
              <input type="text" value={config.telefono}
                onChange={e => setConfig(p => ({ ...p, telefono: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                <Mail size={13} className="inline mr-1" />Email
              </label>
              <input type="email" value={config.email}
                onChange={e => setConfig(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Turno Mañana</label>
              <input type="text" value={config.horarioMañana} placeholder="09:00 - 14:00"
                onChange={e => setConfig(p => ({ ...p, horarioMañana: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Turno Tarde / Noche</label>
              <input type="text" value={config.horarioTarde} placeholder="15:00 - 23:00"
                onChange={e => setConfig(p => ({ ...p, horarioTarde: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* ── Foto de perfil ───────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {config.fotoPerfil
                ? <img src={config.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" /> // eslint-disable-line
                : <User size={32} className="text-gray-400" />}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" id="foto-perfil" />
              <label htmlFor="foto-perfil"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700 transition-colors font-medium">
                Subir Foto
              </label>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG — máx. 5 MB</p>
            </div>
          </div>
        </section>

        {/* ── Diseño del Sidebar ───────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Layout size={16} className="text-gray-500" /> Diseño del Sidebar
          </h2>
          <p className="text-xs text-gray-400 mb-4">Afecta el panel lateral en pantallas grandes (laptop/desktop)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(sidebarPreviews) as [SidebarDesign, typeof sidebarPreviews.normal][]).map(([key, p]) => {
              const active = sidebarDesign === key;
              return (
                <button key={key} onClick={() => changeSidebar(key)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  {/* Mini preview */}
                  <div className={`w-full h-16 rounded-lg mb-3 overflow-hidden flex ${p.bg}`}>
                    <div className={`w-8 h-full ${p.bg} border-r border-gray-200 flex flex-col items-center pt-2 gap-1.5`}>
                      <div className={`w-4 h-1.5 rounded-full ${p.accent}`} />
                      <div className="w-4 h-1.5 rounded-full bg-gray-200" />
                      <div className="w-4 h-1.5 rounded-full bg-gray-200" />
                    </div>
                    <div className="flex-1 p-2">
                      <div className="w-full h-2 bg-gray-100 rounded mb-1.5" />
                      <div className="w-3/4 h-2 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Estilo Navigation Bar ────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Palette size={16} className="text-gray-500" /> Estilo Navigation Bar
          </h2>
          <p className="text-xs text-gray-400 mb-4">Afecta la barra inferior en móvil — Admin, Mozo y Cocina</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(navbarPreviews) as [NavbarStyle, typeof navbarPreviews.original][]).map(([key, p]) => {
              const active = navbarStyle === key;
              return (
                <button key={key} onClick={() => changeNavbar(key)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  {/* Mini preview de navbar */}
                  <div className={`w-full h-10 rounded-lg mb-2.5 ${p.bg} border border-gray-200 flex items-center px-2`}>
                    {key === 'centrado' ? (
                      <div className="flex justify-center gap-3 w-full">
                        {[0,1,2].map(i => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                        ))}
                      </div>
                    ) : key === 'grande' ? (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? (key === 'minimalista' ? 'bg-black' : 'bg-blue-600') : 'bg-gray-200'}`} />
                        ))}
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

        {/* ── Guardar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {saved && (
            <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <Check size={15} strokeWidth={2.5} /> Guardado correctamente
            </span>
          )}
          <button onClick={handleSave}
            className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm">
            <Save size={15} /> Guardar todo
          </button>
        </div>

      </div>
    </div>
  );
}
