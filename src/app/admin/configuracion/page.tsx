'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Save, User, Moon, Layout, Palette } from 'lucide-react';
import { fetchConfig, saveConfig } from '@/lib/db/admin';

interface Configuracion {
  nombreEmpresa: string;
  direccion: string;
  telefono: string;
  email: string;
  horarioMañana: string;
  horarioTarde: string;
  fotoPerfil: string;
}

type ColorMode = 'claro' | 'oscuro';
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

  const colorMode = 'claro' as any;
  const setColorMode = (mode: ColorMode) => {};
  const [sidebarDesign, setSidebarDesign] = useState<SidebarDesign>('normal');
  const [navbarStyle, setNavbarStyle] = useState<NavbarStyle>('original');
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSidebarDesign = localStorage.getItem('sidebarDesign') as SidebarDesign;
    const savedNavbarStyle = localStorage.getItem('navbarStyle') as NavbarStyle;
    const savedFotoPerfil = localStorage.getItem('fotoPerfil');
    if (savedSidebarDesign) setSidebarDesign(savedSidebarDesign);
    if (savedNavbarStyle) setNavbarStyle(savedNavbarStyle);
    if (savedFotoPerfil) setConfig((prev) => ({ ...prev, fotoPerfil: savedFotoPerfil }));

    fetchConfig().then((d) => {
      setConfig((prev) => ({
        ...prev,
        nombreEmpresa: d.nombre ?? prev.nombreEmpresa,
        direccion: d.direccion ?? prev.direccion,
        telefono: d.telefono ?? prev.telefono,
        email: d.email ?? prev.email,
      }));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('colorMode', 'claro');
    localStorage.setItem('sidebarDesign', sidebarDesign);
    localStorage.setItem('fotoPerfil', config.fotoPerfil);
    document.documentElement.classList.remove('dark');
  }, [sidebarDesign, config.fotoPerfil]);

  const handleSave = async () => {
    localStorage.setItem('colorMode', colorMode);
    localStorage.setItem('sidebarDesign', sidebarDesign);
    localStorage.setItem('navbarStyle', navbarStyle);
    localStorage.setItem('fotoPerfil', config.fotoPerfil);
    await saveConfig({
      nombre: config.nombreEmpresa,
      tipo: 'Cevichería',
      ruc: process.env.NEXT_PUBLIC_NEGOCIO_RUC ?? '',
      direccion: config.direccion,
      telefono: config.telefono,
      email: config.email,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, fotoPerfil: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`animate-in fade-in duration-300 ${colorMode === 'oscuro' ? 'bg-black min-h-screen' : ''}`}>
      <div className="mb-8">
        <h1 className={`text-3xl md:text-4xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Configuración</h1>
      </div>

      <div className={`border rounded-lg p-6 md:p-8 ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-medium mb-6 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Información del Negocio</h2>

        <div className="space-y-5">
          <div>
            <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={config.nombreEmpresa}
              onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
            />
          </div>

          <div>
            <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
              <MapPin size={16} className="inline mr-2" />
              Dirección
            </label>
            <input
              type="text"
              value={config.direccion}
              onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
                <Phone size={16} className="inline mr-2" />
                Teléfono
              </label>
              <input
                type="text"
                value={config.telefono}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
              />
            </div>

            <div>
              <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
                <Mail size={16} className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
              />
            </div>
          </div>

          <div className={`border-t pt-8 ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-medium mb-6 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Foto de Perfil</h3>
            
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                {config.fotoPerfil ? (
                  <img src={config.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className={colorMode === 'oscuro' ? 'text-gray-600' : 'text-gray-400'} />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                  id="foto-perfil"
                />
                <label
                  htmlFor="foto-perfil"
                  className={`inline-block px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer ${colorMode === 'oscuro' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Subir Foto
                </label>
                <p className={`text-xs mt-2 ${colorMode === 'oscuro' ? 'text-gray-500' : 'text-gray-500'}`}>Formatos: JPG, PNG (Máx 5MB)</p>
              </div>
            </div>
          </div>

          {/* Modo de Color eliminado */}

          <div className={`border-t pt-8 ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
              <Layout size={20} />
              Diseño del Sidebar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSidebarDesign('minimalista')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'minimalista'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Minimalista</span>
                </div>
              </button>
              <button
                onClick={() => setSidebarDesign('bonito')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'bonito'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-blue-50 rounded mb-2 flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <div className="w-3 h-3 bg-blue-300 rounded"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Bonito (Google Drive)</span>
                </div>
              </button>
              <button
                onClick={() => setSidebarDesign('normal')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'normal'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Normal</span>
                </div>
              </button>
            </div>
          </div>

          <div className={`border-t pt-8 ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
              <Palette size={20} />
              Estilo de Navigation Bar (Móvil)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setNavbarStyle('original')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  navbarStyle === 'original'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2 flex items-center justify-around px-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Original</span>
                </div>
              </button>
              <button
                onClick={() => setNavbarStyle('minimalista')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  navbarStyle === 'minimalista'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-white border border-gray-100 rounded mb-2 flex items-center justify-around px-2">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Minimalista</span>
                </div>
              </button>
              <button
                onClick={() => setNavbarStyle('centrado')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  navbarStyle === 'centrado'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-gray-50 rounded mb-2 flex items-center justify-center gap-1">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Centrado</span>
                </div>
              </button>
              <button
                onClick={() => setNavbarStyle('grande')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  navbarStyle === 'grande'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-white border-2 border-gray-300 rounded mb-2 flex items-center justify-around px-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                    <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                    <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Grande</span>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Horarios de Turnos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSidebarDesign('minimalista')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'minimalista'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Minimalista</span>
                </div>
              </button>
              <button
                onClick={() => setSidebarDesign('bonito')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'bonito'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-blue-50 rounded mb-2 flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <div className="w-3 h-3 bg-blue-300 rounded"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Bonito (Google Drive)</span>
                </div>
              </button>
              <button
                onClick={() => setSidebarDesign('normal')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  sidebarDesign === 'normal'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Normal</span>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Horarios de Turnos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Turno Mañana
                </label>
                <input
                  type="text"
                  value={config.horarioMañana}
                  onChange={(e) => setConfig({ ...config, horarioMañana: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
                  placeholder="09:00 - 14:00"
                />
              </div>

              <div>
                <label className={`block text-sm mb-2 font-medium ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Turno Tarde (Incluye Noche)
                </label>
                <input
                  type="text"
                  value={config.horarioTarde}
                  onChange={(e) => setConfig({ ...config, horarioTarde: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white focus:border-white' : 'border-gray-200 focus:border-black'}`}
                  placeholder="15:00 - 23:00"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={handleSave}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm w-full md:w-auto ${colorMode === 'oscuro' ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Save size={16} strokeWidth={2} />
              Guardar
            </button>
          </div>

          {saved && (
            <div className={`border px-4 py-2 rounded-lg text-sm ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              Configuración guardada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
