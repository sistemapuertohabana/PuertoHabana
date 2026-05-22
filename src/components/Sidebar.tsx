'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, DollarSign, Settings, User, LogOut, Clock, Check, UtensilsCrossed } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorageValue } from '@/hooks/useProfilePhoto';

type SidebarDesign = 'minimalista' | 'bonito' | 'normal';
type NavbarStyle = 'original' | 'minimalista' | 'centrado' | 'grande';

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/inventario', icon: Package, label: 'Inventario' },
  { href: '/admin/personal', icon: Users, label: 'Personal' },
  { href: '/admin/gastos', icon: DollarSign, label: 'Gastos' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

function ProfileAvatar({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="Perfil" className="w-full h-full object-cover" />
    );
  }
  return fallback;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const sidebarDesign = useLocalStorageValue('sidebarDesign', 'normal') as SidebarDesign;
  const navbarStyle = useLocalStorageValue('navbarStyle', 'original') as NavbarStyle;
  const fotoPerfilLocal = useLocalStorageValue('fotoPerfil', '');
  const fotoPerfil = profile?.foto_url ?? fotoPerfilLocal;

  // Helper to update localStorage and notify listeners
  const updateSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  const getSidebarClasses = () => {
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

  const getActiveItemClasses = (isActive: boolean) => {
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
    switch (navbarStyle) {
      case 'minimalista':
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

  return (
    <>
      {/* Mobile top bar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 bg-gray-100 border-gray-200">
              <ProfileAvatar src={fotoPerfil} fallback={<User size={20} className="text-gray-400" />} />
            </div>
            <div>
              <h1 className="text-sm font-medium tracking-tight text-gray-900">Puerto Habana</h1>
              <p className="text-xs tracking-wide mt-0.5 text-gray-400">{profile?.nombre ?? 'Cevicheria'}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${getNavbarClasses()}`}>
        <div className={`flex ${navbarStyle === 'centrado' ? 'justify-center gap-8' : 'justify-around'} items-center py-3`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${getNavbarItemClasses(isActive)}`}>
                <item.icon size={getNavbarIconSize()} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs mt-1.5 ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:block w-64 min-h-screen fixed left-0 top-0 ${getSidebarClasses()}`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 bg-gray-100 border-gray-200">
              <ProfileAvatar src={fotoPerfil} fallback={<User size={20} className="text-gray-400" />} />
            </div>
            <div>
              <h1 className="text-base font-medium tracking-tight text-gray-900">Puerto Habana</h1>
              <p className="text-xs tracking-wide mt-0.5 text-gray-400">{profile?.nombre ?? 'Cevicheria'}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${getActiveItemClasses(isActive)}`}>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Payments summary */}
        <div className="mb-2 text-sm text-gray-600 p-4">
          {(() => {
            const payments = usePayments();
            const total = payments.reduce((sum, p) => sum + (p.monto || 0), 0);
            return `Total Pagos: $${total.toFixed(2)}`;
          })()}
        </div>

        {/* Design selectors */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Diseño Sidebar</label>
            <select
              value={sidebarDesign}
              onChange={(e) => updateSetting('sidebarDesign', e.target.value)}
              className="w-full rounded border-gray-300 text-sm"
            >
              <option value="minimalista">Minimalista</option>
              <option value="bonito">Bonito</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estilo Navbar</label>
            <select
              value={navbarStyle}
              onChange={(e) => updateSetting('navbarStyle', e.target.value)}
              className="w-full rounded border-gray-300 text-sm"
            >
              <option value="original">Original</option>
              <option value="minimalista">Minimalista</option>
              <option value="centrado">Centrado</option>
              <option value="grande">Grande</option>
            </select>
          </div>
        </div>

        {/* Sign out button */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <button type="button" onClick={signOut} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium">
            <LogOut size={16} /> Cerrar Sesión
          </button>
          <p className="text-xs text-center text-gray-400">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
