'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Save, User, Layout, Palette, Check, BellRing, Clock, Sun, Moon, Smartphone, QrCode, CreditCard } from 'lucide-react';

interface Configuracion {
  nombreEmpresa: string;
  direccion: string;
  telefono: string;
  email: string;
  horarioMañana: string;
  horarioTarde: string;
  fotoPerfil: string;
}

type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';
type SidebarDesign = 'minimalista' | 'bonito' | 'normal' | 'azul';
type NavbarStyle   = 'original' | 'minimalista' | 'centrado' | 'grande' | 'flotante' | 'flotante_blue_new';

interface TurnoHorario {
  inicio: string;
  fin: string;
}

interface TurnosConfig {
  mañana: Record<DiaSemana, TurnoHorario | null>;
  noche: Record<DiaSemana, TurnoHorario | null>;
}

const DIAS_ORDEN: DiaSemana[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DIAS_LABEL: Record<DiaSemana, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
};

const TURNOS_CONFIG_DEFAULT: TurnosConfig = {
  mañana: {
    dom: { inicio: '08:00', fin: '17:00' },
    lun: null,
    mar: { inicio: '09:00', fin: '16:00' },
    mie: { inicio: '09:00', fin: '16:00' },
    jue: { inicio: '09:00', fin: '16:00' },
    vie: { inicio: '09:00', fin: '16:00' },
    sab: { inicio: '08:00', fin: '17:00' },
  },
  noche: {
    dom: { inicio: '17:00', fin: '23:00' },
    lun: null, // descanso
    mar: { inicio: '16:00', fin: '23:00' },
    mie: { inicio: '16:00', fin: '23:00' },
    jue: { inicio: '16:00', fin: '23:00' },
    vie: { inicio: '16:00', fin: '23:00' },
    sab: { inicio: '17:00', fin: '23:00' },
  },
};

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
  azul: {
    bg: 'bg-blue-900',
    accent: 'bg-white',
    label: 'Azul (Nuevo)',
    desc: 'Fondo azul, botones blancos',
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
  const [pagoConfig, setPagoConfig] = useState({ yapeNumero: '942 902 367', yapeNombre: 'PUERTO HABANA', yapeQRImage: '' });
  const [notifActivas, setNotifActivas] = useState(false);
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [showMpToken, setShowMpToken] = useState(false);
  const [mpTesting, setMpTesting] = useState(false);
  const [mpTestResult, setMpTestResult] = useState('');
  const [saved,  setSaved]  = useState(false);
  const [mounted,setMounted]= useState(false);
  const [turnosConfig, setTurnosConfig] = useState<TurnosConfig>(TURNOS_CONFIG_DEFAULT);

  // Sincronizar turnos_config desde Supabase para recoger cambios hechos desde otros dispositivos
  const syncTurnosConfigFromServer = async () => {
    try {
      const res = await fetch('/api/configuracion?clave=turnos_config');
      if (res.ok) {
        const { valor } = await res.json();
        if (valor) {
          setTurnosConfig(valor);
          localStorage.setItem('ph_turnos_config', JSON.stringify(valor));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    const sd  = localStorage.getItem('sidebarDesign_admin') as SidebarDesign | null;
    const ns  = localStorage.getItem('navbarStyle_admin')   as NavbarStyle   | null;
    const fp  = localStorage.getItem('fotoPerfil');
    const cfg = localStorage.getItem('ph_config');
    const tc  = localStorage.getItem('ph_turnos_config');
    const pc  = localStorage.getItem('ph_pago_config');
    const mpToken = localStorage.getItem('ph_mp_access_token');
    
    // Leer configuración guardada y aplicar en lote
    let configUpdate: Partial<Configuracion> = {};
    if (fp) configUpdate.fotoPerfil = fp;
    if (cfg) { try { configUpdate = { ...configUpdate, ...JSON.parse(cfg) }; } catch {} }
    
    // Batch de todas las actualizaciones en una sola pasada
    if (sd) setSidebarDesign(sd);
    if (ns) setNavbarStyle(ns);
    setConfig(p => ({ ...p, ...configUpdate }));
    if (tc) { try { setTurnosConfig(JSON.parse(tc)); } catch {} }
    if (pc) { try { setPagoConfig(JSON.parse(pc)); } catch {} }
    if (mpToken) setMpAccessToken(mpToken);
    setNotifActivas(localStorage.getItem('notificaciones_activas') !== 'false');
    
    // Sincronizar desde Supabase para recoger cambios hechos desde otros dispositivos
    syncTurnosConfigFromServer();
    
    // Sincronizar MP token desde Supabase
    const syncMpToken = async () => {
      try {
        const res = await fetch('/api/configuracion?clave=mp_access_token');
        if (res.ok) {
          const { valor } = await res.json();
          if (valor && valor !== mpToken) {
            setMpAccessToken(valor);
            localStorage.setItem('ph_mp_access_token', valor);
          }
        }
      } catch {}
    };
    syncMpToken();
  }, []);

  /* Cambia sidebar en tiempo real */
  const changeSidebar = (d: SidebarDesign) => {
    setSidebarDesign(d);
    applyLive('sidebarDesign_admin', d);
  };

  /* Cambia navbar en tiempo real */
  const changeNavbar = (s: NavbarStyle) => {
    setNavbarStyle(s);
    applyLive('navbarStyle_admin', s);
  };

  const handleSave = () => {
    applyLive('sidebarDesign_admin', sidebarDesign);
    applyLive('navbarStyle_admin',   navbarStyle);
    localStorage.setItem('fotoPerfil', config.fotoPerfil);
    localStorage.setItem('ph_config', JSON.stringify({
      nombreEmpresa: config.nombreEmpresa,
      direccion:     config.direccion,
      telefono:      config.telefono,
      email:         config.email,
      horarioMañana: config.horarioMañana,
      horarioTarde:  config.horarioTarde,
    }));
    localStorage.setItem('ph_turnos_config', JSON.stringify(turnosConfig));
    localStorage.setItem('ph_pago_config', JSON.stringify(pagoConfig));
    // Sincronizar con Supabase para que empleados en otros dispositivos reciban los cambios
    fetch('/api/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: 'turnos_config', valor: turnosConfig }),
    }).catch(() => {});
    fetch('/api/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: 'pago_config', valor: pagoConfig }),
    }).catch(() => {});
    if (mpAccessToken) {
      localStorage.setItem('ph_mp_access_token', mpAccessToken);
      fetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: 'mp_access_token', valor: mpAccessToken }),
      }).catch(() => {});
    } else {
      localStorage.removeItem('ph_mp_access_token');
    }
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
      
      // Guardar también en BD para sincronizar entre dispositivos
      try {
        const session = JSON.parse(localStorage.getItem('ph_admin_session') || '{}');
        if (session.id && session.id !== 'admin') {
          fetch('/api/auth/update-user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: session.id, foto_url: url }),
          }).catch(() => {});
        }
      } catch {}
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
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <MapPin size={13} className="inline mr-1" />Dirección
            </label>
            <input type="text" value={config.direccion}
              onChange={e => setConfig(p => ({ ...p, direccion: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                <Phone size={13} className="inline mr-1" />Teléfono
              </label>
              <input type="text" value={config.telefono}
                onChange={e => setConfig(p => ({ ...p, telefono: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                <Mail size={13} className="inline mr-1" />Email
              </label>
              <input type="email" value={config.email}
                onChange={e => setConfig(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
        </section>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ── Horarios de Turnos ──────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Clock size={16} className="text-gray-500" /> Horarios de Turnos
          </h2>
          <p className="text-xs text-gray-400 mb-4">Define los horarios para cada turno. Los mozos con turno asignado solo podrán hacer pedidos dentro de su horario.</p>
          <p className="text-xs text-blue-500 mb-3 flex items-center gap-1 sm:hidden">
            <span>👈</span> Desliza para ver más días <span>👉</span>
          </p>
          
          {(['mañana', 'noche'] as const).map(turno => (
            <div key={turno} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                {turno === 'mañana' ? (
                  <Sun size={16} className="text-amber-500" />
                ) : (
                  <Moon size={16} className="text-indigo-500" />
                )}
                <h3 className="text-sm font-semibold text-gray-700 capitalize">{turno}</h3>
              </div>
              {/* Horizontal scroll en mobile, grid en desktop */}
              <div
                className="overflow-x-auto md:overflow-visible scrollbar-hide -mx-2 px-2 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-7 md:gap-2">
                  {DIAS_ORDEN.map(dia => {
                    const horario = turnosConfig[turno][dia];
                    return (
                      <div key={dia} className="flex-shrink-0 w-[170px] md:w-auto bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2.5">
                        <span className="block text-sm font-semibold text-gray-700 text-center">{DIAS_LABEL[dia]}</span>
                        <label className="flex items-center justify-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={horario !== null}
                            onChange={e => {
                              const newConfig = { ...turnosConfig };
                              if (e.target.checked) {
                                newConfig[turno] = {
                                  ...newConfig[turno],
                                  [dia]: { inicio: '09:00', fin: '17:00' },
                                };
                              } else {
                                newConfig[turno] = {
                                  ...newConfig[turno],
                                  [dia]: null,
                                };
                              }
                              setTurnosConfig(newConfig);
                            }}
                            className="rounded"
                          />
                          Laboral
                        </label>
                        {horario ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <input type="time" value={horario.inicio}
                              onChange={e => {
                                const newConfig = { ...turnosConfig };
                                newConfig[turno] = {
                                  ...newConfig[turno],
                                  [dia]: { ...horario, inicio: e.target.value },
                                };
                                setTurnosConfig(newConfig);
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-center" />
                            <span className="text-gray-400 text-xs">a</span>
                            <input type="time" value={horario.fin}
                              onChange={e => {
                                const newConfig = { ...turnosConfig };
                                newConfig[turno] = {
                                  ...newConfig[turno],
                                  [dia]: { ...horario, fin: e.target.value },
                                };
                                setTurnosConfig(newConfig);
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-center" />
                          </div>
                        ) : (
                          <div className="text-center text-xs text-gray-400 py-4">❌ Descanso</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
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

        {/* ── Métodos de Pago ──────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Smartphone size={16} className="text-gray-500" /> Métodos de Pago
          </h2>
          <p className="text-xs text-gray-400 mb-1">Configura el número, nombre y QR de Yape que ven los mozos al cobrar.</p>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#7408B6]"></span>
                Número Yape
              </span>
            </label>
            <input type="text" value={pagoConfig.yapeNumero}
              onChange={e => setPagoConfig(p => ({ ...p, yapeNumero: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7408B6]/30 focus:border-[#7408B6]"
              placeholder="942 902 367" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nombre (titular)</label>
            <input type="text" value={pagoConfig.yapeNombre}
              onChange={e => setPagoConfig(p => ({ ...p, yapeNombre: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7408B6]/30 focus:border-[#7408B6]"
              placeholder="PUERTO HABANA" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
              <QrCode size={14} className="text-[#7408B6]" />
              Imagen del QR (opcional)
            </label>
            <p className="text-xs text-gray-400 mb-2">Sube una foto de tu QR Yape real. Si no subes una, se generará automáticamente desde el número.</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {pagoConfig.yapeQRImage ? (
                  <img src={pagoConfig.yapeQRImage} alt="QR Yape" className="w-full h-full object-contain" />
                ) : (
                  <QrCode size={32} className="text-gray-300" />
                )}
              </div>
              <div>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setPagoConfig(p => ({ ...p, yapeQRImage: reader.result as string }));
                  };
                  reader.readAsDataURL(file);
                }} className="hidden" id="yape-qr-upload" />
                <label htmlFor="yape-qr-upload"
                  className="inline-block px-4 py-2 bg-[#7408B6] text-white rounded-lg text-sm cursor-pointer hover:bg-[#5C0691] transition-colors font-medium">
                  Subir QR
                </label>
                {pagoConfig.yapeQRImage && (
                  <button onClick={() => setPagoConfig(p => ({ ...p, yapeQRImage: '' }))}
                    className="block mt-2 text-xs text-red-500 hover:text-red-700 font-medium">
                    Eliminar QR
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-2">PNG, JPG — recomendado 300×300px</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mercado Pago (Pagos con Tarjeta) ─────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard size={16} className="text-gray-500" /> Mercado Pago — Pagos con Tarjeta
          </h2>
          <p className="text-xs text-gray-400">
            Configura el Access Token de Mercado Pago para que los mozos puedan cobrar con tarjeta.
            Obtén tu token en{' '}
            <a href="https://mercadopago.com.pe/developers" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline">
              mercadopago.com.pe/developers
            </a>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Access Token</label>
            <div className="flex gap-2">
              <input type={showMpToken ? 'text' : 'password'} value={mpAccessToken}
                onChange={e => setMpAccessToken(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00B9FF]/30 focus:border-[#00B9FF]"
                placeholder="APP_USR-123456789-..." />
              <button onClick={() => setShowMpToken(!showMpToken)}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs font-semibold">
                {showMpToken ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Token de producción (APP_USR) — <strong>nunca compartas este token</strong></p>
          </div>
          <div>
            <button
              onClick={async () => {
                setMpTesting(true);
                try {
                  const res = await fetch('/api/mercadopago/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: mpAccessToken }),
                  });
                  const data = await res.json();
                  setMpTestResult(data.success ? '✅ Conexión exitosa' : `❌ ${data.error || 'Error de conexión'}`);
                } catch { setMpTestResult('❌ Error de conexión'); }
                setMpTesting(false);
              }}
              disabled={mpTesting || !mpAccessToken}
              className="px-4 py-2 bg-[#00B9FF] text-white rounded-lg text-sm font-semibold hover:bg-[#009EE0] transition-colors disabled:opacity-50"
            >
              {mpTesting ? 'Probando...' : 'Probar conexión'}
            </button>
            {mpTestResult && (
              <span className="ml-3 text-xs font-medium">{mpTestResult}</span>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-medium">💡 ¿Cómo funciona?</p>
            <ul className="mt-2 text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>El mozo selecciona <strong>"Pagar con Tarjeta"</strong> al cobrar una comanda</li>
              <li>Se genera un <strong>código QR</strong> con el link de pago de Mercado Pago</li>
              <li>El cliente escanea el QR con su celular y paga desde su banco o app Yape/Plin</li>
              <li>Cuando el pago se aprueba, la comanda se marca como <strong>pagada automáticamente</strong></li>
              <li>La comisión de Mercado Pago es de aproximadamente <strong>3.99% + S/1.00</strong></li>
            </ul>
          </div>
        </section>

        {/* ── Diseño del Sidebar ───────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Layout size={16} className="text-gray-500" /> Diseño del Sidebar
          </h2>
          <p className="text-xs text-gray-400 mb-4">Afecta el panel lateral en pantallas grandes (laptop/desktop)</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {(Object.entries(sidebarPreviews) as [SidebarDesign, typeof sidebarPreviews.normal][]).map(([key, p]) => {
              const active = sidebarDesign === key;
              return (
                <button key={key} onClick={() => changeSidebar(key)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  {/* Mini preview */}
                  <div className={`w-full h-16 rounded-lg mb-3 overflow-hidden flex ${p.bg}`}>
                    <div className={`w-8 h-full ${key === 'azul' ? 'bg-blue-800' : p.bg} border-r ${key === 'azul' ? 'border-blue-700' : 'border-gray-200'} flex flex-col items-center pt-2 gap-1.5`}>
                      <div className={`w-4 h-1.5 rounded-full ${key === 'azul' ? 'bg-white' : p.accent}`} />
                      <div className={`w-4 h-1.5 rounded-full ${key === 'azul' ? 'bg-blue-300' : 'bg-gray-200'}`} />
                      <div className={`w-4 h-1.5 rounded-full ${key === 'azul' ? 'bg-blue-300' : 'bg-gray-200'}`} />
                    </div>
                    <div className={`flex-1 p-2 ${key === 'azul' ? 'bg-blue-900' : ''}`}>
                      <div className={`w-full h-2 ${key === 'azul' ? 'bg-blue-700' : 'bg-gray-100'} rounded mb-1.5`} />
                      <div className={`w-3/4 h-2 ${key === 'azul' ? 'bg-blue-700' : 'bg-gray-100'} rounded`} />
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
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
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
                    ) : key === 'flotante_blue_new' ? (
                      <div className="flex justify-around w-full">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-white' : 'bg-blue-400'}`} />
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

        {/* ── Notificaciones Push ────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BellRing size={16} className="text-gray-500" /> Notificaciones Push
          </h2>
          <p className="text-xs text-gray-400 mb-4">Activa las alertas en tiempo real para recibir notificaciones sonoras</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notifActivas ? 'bg-blue-100' : 'bg-gray-200'}`}>
                <BellRing size={18} className={notifActivas ? 'text-blue-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {notifActivas ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
                </p>
                <p className="text-xs text-gray-500">
                  {notifActivas ? 'Recibirás alertas de nuevos pedidos y pagos' : 'No recibirás alertas en tiempo real'}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (notifActivas) {
                  localStorage.setItem('notificaciones_activas', 'false');
                  setNotifActivas(false);
                } else {
                  localStorage.setItem('notificaciones_activas', 'true');
                  setNotifActivas(true);
                  if ('Notification' in window) await Notification.requestPermission().catch(() => {});
                  try { const a = new Audio('/notification.mp3'); a.volume = 0; await a.play(); } catch {}
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                notifActivas
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {notifActivas ? 'Desactivar' : 'Activar'}
            </button>
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
