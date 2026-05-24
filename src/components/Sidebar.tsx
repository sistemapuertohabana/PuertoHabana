'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users, DollarSign,
  Settings, User, LogOut,
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorageValue } from '@/hooks/useProfilePhoto';

type SidebarDesign = 'minimalista' | 'bonito' | 'normal' | 'azul';
type NavbarStyle  = 'original' | 'minimalista' | 'centrado' | 'grande' | 'flotante' | 'flotante_blue_new';

const menuItems = [
  { href: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/admin/inventario',     icon: Package,         label: 'Inventario'     },
  { href: '/admin/personal',       icon: Users,           label: 'Personal'       },
  { href: '/admin/gastos',         icon: DollarSign,      label: 'Gastos'         },
  { href: '/admin/configuracion',  icon: Settings,        label: 'Configuración'  },
];

function ProfileAvatar({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  if (src) return <img src={src} alt="Perfil" className="w-full h-full object-cover" />;  // eslint-disable-line
  return <>{fallback}</>;
}

/* ─── helpers de estilo ──────────────────────────────────────────────────── */

function sidebarBg(d: SidebarDesign) {
  if (d === 'minimalista') return 'bg-white border-r border-gray-100';
  if (d === 'bonito')      return 'bg-gradient-to-b from-blue-50 to-white border-r border-blue-100';
  if (d === 'azul')        return 'bg-blue-600 border-r border-blue-700';
  return 'bg-white border-r border-gray-200';
}

function sidebarItem(d: SidebarDesign, active: boolean) {
  if (d === 'minimalista') return active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50';
  if (d === 'bonito')      return active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50';
  if (d === 'azul')        return active ? 'bg-white text-blue-600' : 'text-white hover:bg-blue-700';
  return active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100';
}

function navbarBg(s: NavbarStyle) {
  if (s === 'flotante')          return 'bg-white border border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] mb-4 mx-4 rounded-full';
  if (s === 'flotante_blue_new') return 'bg-blue-600 shadow-[0_-4px_20px_rgba(37,99,235,0.4)] mb-4 mx-4 rounded-full';
  if (s === 'minimalista')       return 'bg-white border-t border-gray-100';
  if (s === 'centrado')          return 'bg-gray-50 border-t border-gray-200';
  if (s === 'grande')            return 'bg-white border-t-2 border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,.06)]';
  return 'bg-white/90 backdrop-blur-md border-t border-gray-200';
}

function navbarItem(s: NavbarStyle, active: boolean) {
  if (s === 'flotante')          return active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50';
  if (s === 'flotante_blue_new') return active ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-blue-700';
  if (s === 'minimalista')       return active ? 'text-black' : 'text-gray-400 hover:text-gray-600';
  if (s === 'centrado')          return active ? 'text-black font-semibold' : 'text-gray-400 hover:text-gray-600';
  if (s === 'grande')            return active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
  return active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
}

function navbarIconSize(s: NavbarStyle) {
  if (s === 'grande')   return 28;
  if (s === 'centrado') return 26;
  return 24;
}

/* ─── componente ─────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const pathname = usePathname();

  const { profile, signOut } = useAuth();
  const payments   = usePayments();
  const design     = useLocalStorageValue('sidebarDesign_admin', 'normal') as SidebarDesign;
  const navbar     = useLocalStorageValue('navbarStyle_admin',   'original') as NavbarStyle;
  const fotoLocal  = useLocalStorageValue('fotoPerfil', '');
  const foto       = profile?.foto_url ?? fotoLocal;
  const totalPagos = payments.reduce((s, p) => s + (p.monto || 0), 0);

  const save = (key: string, val: string) => {
    localStorage.setItem(key, val);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  const layout = navbar === 'centrado' ? 'justify-center gap-6' : (navbar === 'flotante' || navbar === 'flotante_blue_new') ? 'justify-between px-2' : 'justify-around';

  return (
    <>
      {/* ══ MOBILE TOP BAR ══════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed top-0 inset-x-0 z-50 border-b bg-white border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 bg-gray-100 border-gray-200 flex items-center justify-center">
              <ProfileAvatar src={foto} fallback={<User size={18} className="text-gray-400" />} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-gray-900">Puerto Habana</p>
              <p className="text-xs mt-0.5 text-gray-400">{profile?.nombre ?? 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors px-2 py-1.5 rounded-lg">
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════ */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-50 ${navbarBg(navbar)}`}>
        <div className={`flex ${layout} items-center py-2 px-1`}>
          {menuItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1.5 transition-all min-w-[52px] ${(navbar === 'flotante' || navbar === 'flotante_blue_new') ? 'rounded-full w-14 h-14' : 'rounded-xl'} ${navbarItem(navbar, active)}`}>
                <Icon size={navbarIconSize(navbar)} strokeWidth={active ? 2.5 : 1.8} />
                {navbar !== 'flotante' && navbar !== 'flotante_blue_new' && <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ══ DESKTOP SIDEBAR ═════════════════════════════════════════════════ */}
      <aside className={`hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 ${sidebarBg(design)}`}>

        {/* Perfil */}
        <div className={`p-5 border-b ${design === 'azul' ? 'border-blue-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 ${design === 'azul' ? 'bg-blue-700 border-blue-600' : 'bg-gray-100 border-gray-200'}`}>
              <ProfileAvatar src={foto} fallback={<User size={20} className={design === 'azul' ? 'text-white' : 'text-gray-400'} />} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${design === 'azul' ? 'text-white' : 'text-gray-900'}`}>Puerto Habana</p>
              <p className={`text-xs truncate ${design === 'azul' ? 'text-blue-200' : 'text-gray-400'}`}>{profile?.nombre ?? 'Cevicheria'}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 mt-4 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${sidebarItem(design, active)}`}>
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Resumen pagos */}
        {totalPagos > 0 && (
          <div className={`mx-3 mb-2 px-3 py-2.5 rounded-lg border ${design === 'azul' ? 'bg-blue-700 border-blue-600' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-[10px] uppercase tracking-wider font-medium ${design === 'azul' ? 'text-blue-200' : 'text-gray-400'}`}>Total Pagos</p>
            <p className={`text-sm font-bold mt-0.5 ${design === 'azul' ? 'text-white' : 'text-gray-800'}`}>S/ {totalPagos.toFixed(2)}</p>
          </div>
        )}

        {/* Selectores de diseño */}
        <div className={`px-3 py-3 border-t space-y-2.5 ${design === 'azul' ? 'border-blue-700' : 'border-gray-100'}`}>
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${design === 'azul' ? 'text-blue-200' : 'text-gray-400'}`}>Diseño Sidebar</label>
            <select value={design} onChange={e => save('sidebarDesign_admin', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="normal">Normal</option>
              <option value="minimalista">Minimalista</option>
              <option value="bonito">Bonito</option>
              <option value="azul">Azul (Nuevo)</option>
            </select>
          </div>
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${design === 'azul' ? 'text-blue-200' : 'text-gray-400'}`}>Estilo Navbar</label>
            <select value={navbar} onChange={e => save('navbarStyle_admin', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="original">Original</option>
              <option value="minimalista">Minimalista</option>
              <option value="centrado">Centrado</option>
              <option value="grande">Grande</option>
              <option value="flotante">Flotante (Nuevo)</option>
              <option value="flotante_blue_new">FLOTANTE BLUE NEW</option>
            </select>
          </div>
        </div>

        {/* Cerrar sesión */}
        <div className={`px-3 pb-4 border-t pt-3 ${design === 'azul' ? 'border-blue-700' : 'border-gray-100'}`}>
          <button onClick={signOut}
            className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg transition-colors text-sm font-medium ${design === 'azul' ? 'text-red-300 hover:bg-blue-700' : 'text-red-500 hover:bg-red-50'}`}>
            <LogOut size={15} /> Cerrar Sesión
          </button>
          <p className={`text-[10px] text-center mt-2 ${design === 'azul' ? 'text-blue-300' : 'text-gray-300'}`}>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
