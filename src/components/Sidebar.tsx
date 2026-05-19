'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign,
  Settings,
  User
} from 'lucide-react';

type ColorMode = 'claro' | 'oscuro';
type SidebarDesign = 'minimalista' | 'bonito' | 'normal';
type NavbarStyle = 'original' | 'minimalista' | 'centrado' | 'grande';

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/inventario', icon: Package, label: 'Inventario' },
  { href: '/admin/personal', icon: Users, label: 'Personal' },
  { href: '/admin/gastos', icon: DollarSign, label: 'Gastos' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [colorMode, setColorMode] = useState<ColorMode>('claro');
  const [sidebarDesign, setSidebarDesign] = useState<SidebarDesign>('normal');
  const [navbarStyle, setNavbarStyle] = useState<NavbarStyle>('original');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColorMode = localStorage.getItem('colorMode') as ColorMode;
    const savedSidebarDesign = localStorage.getItem('sidebarDesign') as SidebarDesign;
    const savedNavbarStyle = localStorage.getItem('navbarStyle') as NavbarStyle;
    const savedFotoPerfil = localStorage.getItem('fotoPerfil');
    
    if (savedColorMode) setColorMode(savedColorMode);
    if (savedSidebarDesign) setSidebarDesign(savedSidebarDesign);
    if (savedNavbarStyle) setNavbarStyle(savedNavbarStyle);
    if (savedFotoPerfil) setFotoPerfil(savedFotoPerfil);
  }, []);

  const getSidebarClasses = () => {
    if (colorMode === 'oscuro') {
      return 'border-r border-gray-800';
    }
    switch (sidebarDesign) {
      case 'minimalista':
        return 'bg-white border-r border-gray-100';
      case 'bonito':
        return 'bg-gradient-to-b from-blue-50 to-white border-r border-blue-100';
      case 'normal':
      default:
        return 'bg-white border-r border-gray-200';
    }
  };

  const getMobileNavClasses = () => {
    switch (sidebarDesign) {
      case 'minimalista':
        return 'bg-white border-t border-gray-100';
      case 'bonito':
        return 'bg-gradient-to-t from-blue-50 to-white border-t border-blue-100';
      case 'normal':
      default:
        return 'bg-white border-t border-gray-200';
    }
  };

  const getActiveItemClasses = (isActive: boolean) => {
    if (colorMode === 'oscuro') {
      return isActive ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800';
    }
    switch (sidebarDesign) {
      case 'minimalista':
        return isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50';
      case 'bonito':
        return isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50';
      case 'normal':
      default:
        return isActive ? 'bg-blue-600 text-white' : 'text-black hover:bg-gray-100';
    }
  };

  const getNavbarClasses = () => {
    if (colorMode === 'oscuro') {
      return 'border-t border-gray-800';
    }
    switch (navbarStyle) {
      case 'minimalista':
        return 'bg-white border-t border-gray-100';
      case 'centrado':
        return 'bg-gray-50 border-t border-gray-200';
      case 'grande':
        return 'bg-white border-t-2 border-gray-300';
      case 'original':
      default:
        return 'bg-white border-t border-gray-200';
    }
  };

  const getNavbarItemClasses = (isActive: boolean) => {
    if (colorMode === 'oscuro') {
      return isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300';
    }
    switch (navbarStyle) {
      case 'minimalista':
        return isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600';
      case 'centrado':
        return isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600';
      case 'grande':
        return isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
      case 'original':
      default:
        return isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
    }
  };

  const getNavbarIconSize = () => {
    switch (navbarStyle) {
      case 'grande':
        return 28;
      case 'centrado':
        return 26;
      default:
        return 24;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Profile Navbar */}
      <nav className={`lg:hidden fixed top-0 left-0 right-0 z-50 ${colorMode === 'oscuro' ? 'bg-black border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className={colorMode === 'oscuro' ? 'text-gray-600' : 'text-gray-400'} />
              )}
            </div>
            <div>
              <h1 className={`text-sm font-medium tracking-tight ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Puerto Habana</h1>
              <p className={`text-xs tracking-wide mt-0.5 ${colorMode === 'oscuro' ? 'text-gray-500' : 'text-gray-400'}`}>Cevicheria</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${getNavbarClasses()} ${colorMode === 'oscuro' ? 'bg-black border-t border-gray-800' : ''}`}>
        <div className={`flex ${navbarStyle === 'centrado' ? 'justify-center gap-8' : 'justify-around'} items-center py-3`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${getNavbarItemClasses(isActive)}`}
              >
                <item.icon size={getNavbarIconSize()} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs mt-1.5 transition-colors ${isActive ? 'font-medium' : 'font-normal'} ${colorMode === 'oscuro' ? 'text-gray-400' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-64 min-h-screen fixed left-0 top-0 ${getSidebarClasses()} ${colorMode === 'oscuro' ? 'bg-black' : ''}`}>
        <div className={`p-6 border-b ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className={colorMode === 'oscuro' ? 'text-gray-600' : 'text-gray-400'} />
              )}
            </div>
            <div>
              <h1 className={`text-base font-medium tracking-tight ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Puerto Habana</h1>
              <p className={`text-xs tracking-wide mt-0.5 ${colorMode === 'oscuro' ? 'text-gray-500' : 'text-gray-400'}`}>Cevicheria</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${getActiveItemClasses(isActive)}`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-sm font-medium ${colorMode === 'oscuro' ? 'text-white' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-xs text-center ${colorMode === 'oscuro' ? 'text-gray-500' : 'text-gray-400'}`}>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}