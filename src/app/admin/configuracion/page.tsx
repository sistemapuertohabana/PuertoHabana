'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Save, User, Layout, Palette } from 'lucide-react';

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
type NavbarStyle = 'original' | 'minimalista' | 'centrado' | 'grande';

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
  const [navbarStyle, setNavbarStyle] = useState<NavbarStyle>('original');
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSidebarDesign = localStorage.getItem('sidebarDesign') as SidebarDesign;
    const savedNavbarStyle = localStorage.getItem('navbarStyle') as NavbarStyle;
    const savedFotoPerfil = localStorage.getItem('fotoPerfil');
    const savedConfig = localStorage.getItem('ph_config');
    if (savedSidebarDesign) setSidebarDesign(savedSidebarDesign);
    if (savedNavbarStyle) setNavbarStyle(savedNavbarStyle);
    if (savedFotoPerfil) setConfig((prev) => ({ ...prev, fotoPerfil: savedFotoPerfil }));
    if (savedConfig) {
      try { setConfig((prev) => ({ ...prev, ...JSON.parse(savedConfig) })); } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('sidebarDesign', sidebarDesign);
    localStorage.setItem('navbarStyle', navbarStyle);
    localStorage.setItem('fotoPerfil', config.fotoPerfil);
    localStorage.setItem('ph_config', JSON.stringify({
      nombreEmpresa: config.nombreEmpresa,
      direccion: config.direccion,
      telefono: config.telefono,
      email: config.email,
      horarioMañana: config.horarioMañana,
      horarioTarde: config.horarioTarde,
    }));
    window.dispatchEvent(new Event('ph_store_update'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setConfig({ ...config, fotoPerfil: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Configuración</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 space-y-8">
        {/* Info del negocio */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Información del Negocio</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Nombre del Negocio</label>
              <input type="text" value={config.nombreEmpresa} onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2"><MapPin size={14} className="inline mr-1" />Dirección</label>
              <input type="text" value={config.direccion} onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2"><Phone size={14} className="inline mr-1" />Teléfono</label>
                <input type="text" value={config.telefono} onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2"><Mail size={14} className="inline mr-1" />Email</label>
                <input type="email" value={config.email} onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Foto de perfil */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Foto de Perfil</h3>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {config.fotoPerfil ? <img src={config.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400" />}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" id="foto-perfil" />
              <label htmlFor="foto-perfil" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700 transition-colors">
                Subir Foto
              </label>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG (Máx 5MB)</p>
            </div>
          </div>
        </div>

        {/* Diseño sidebar */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Layout size={18} />Diseño del Sidebar</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['minimalista', 'bonito', 'normal'] as SidebarDesign[]).map((d) => (
              <button key={d} onClick={() => setSidebarDesign(d)}
                className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${sidebarDesign === d ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Estilo navbar */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Palette size={18} />Estilo Navigation Bar (Móvil)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['original', 'minimalista', 'centrado', 'grande'] as NavbarStyle[]).map((s) => (
              <button key={s} onClick={() => setNavbarStyle(s)}
                className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${navbarStyle === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Horarios */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Horarios de Turnos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Turno Mañana</label>
              <input type="text" value={config.horarioMañana} onChange={(e) => setConfig({ ...config, horarioMañana: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="09:00 - 14:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Turno Tarde (Incluye Noche)</label>
              <input type="text" value={config.horarioTarde} onChange={(e) => setConfig({ ...config, horarioTarde: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="15:00 - 23:00" />
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="border-t border-gray-100 pt-6 flex justify-end">
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold">
            <Save size={16} />Guardar
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm text-center">
            ✅ Configuración guardada correctamente
          </div>
        )}
      </div>
    </div>
  );
}
