'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User, LogOut, ListOrdered, CalendarClock, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePhoto, useLocalStorageValue } from '@/hooks/useProfilePhoto';

type NavbarStyle = 'original' | 'minimalista' | 'centrado' | 'grande' | 'flotante';

const menuItems = [
  { href: '/mozo',          icon: LayoutGrid,    label: 'Mesas'    },
  { href: '/mozo/reservas', icon: CalendarClock, label: 'Reservas' },
  { href: '/mozo/historial',icon: ListOrdered,   label: 'Historial'},
  { href: '/mozo/perfil',        icon: User,          label: 'Perfil'   },
  { href: '/mozo/configuracion', icon: Settings,      label: 'Ajustes'  },
];

function ProfileAvatar({ photo, fallback }: { photo: string; fallback: React.ReactNode }) {
  if (photo) return <img src={photo} alt="Mozo" className="w-full h-full object-cover" />; // eslint-disable-line
  return <>{fallback}</>;
}

/* ─── helpers de estilo ──────────────────────────────────────────────────── */

function navbarBg(s: NavbarStyle) {
  if (s === 'flotante')    return 'bg-white border border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] mb-4 mx-4 rounded-full';
  if (s === 'minimalista') return 'bg-white border-t border-gray-100';
  if (s === 'centrado')    return 'bg-gray-50 border-t border-gray-200';
  if (s === 'grande')      return 'bg-white border-t-2 border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,.06)]';
  return 'bg-white/90 backdrop-blur-md border-t border-gray-200';
}

function navbarItem(s: NavbarStyle, active: boolean) {
  if (s === 'flotante')    return active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50';
  if (s === 'minimalista') return active ? 'text-black' : 'text-gray-400 hover:text-gray-600';
  if (s === 'centrado')    return active ? 'text-black font-semibold' : 'text-gray-400 hover:text-gray-600';
  if (s === 'grande')      return active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
  // original
  return active ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100';
}

function navbarIconSize(s: NavbarStyle) {
  if (s === 'grande')   return 28;
  if (s === 'centrado') return 26;
  return 24;
}

/* ─── componente ─────────────────────────────────────────────────────────── */

export default function MozoSidebar() {
  const pathname   = usePathname();
  const { profile, signOut } = useAuth();
  const localPhoto = useProfilePhoto('mozo');
  const photo      = profile?.foto_url ?? localPhoto;
  const navbar     = useLocalStorageValue('navbarStyle', 'original') as NavbarStyle;

  const layout     = navbar === 'centrado' ? 'justify-center gap-6' : navbar === 'flotante' ? 'justify-between px-2' : 'justify-around';
  // original y flotante: solo icono (sin label); el resto muestra label
  const showLabel  = navbar !== 'original' && navbar !== 'flotante';

  return (
    <>
      {/* ══ MOBILE TOP BAR ══════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 bg-gray-100 border-gray-200 flex items-center justify-center">
              <ProfileAvatar photo={photo} fallback={<User size={18} className="text-gray-400" />} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">Portal Mozo</p>
              <p className="text-xs text-gray-400 mt-0.5">{profile?.nombre ?? 'Puerto Habana'}</p>
            </div>
          </div>
          {/* Cerrar sesión en móvil */}
          <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </nav>

      {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════ */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-50 ${navbarBg(navbar)}`}>
        <div className={`flex ${layout} items-center py-2 px-1`}>
          {menuItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1.5 transition-all min-w-[52px] ${navbar === 'flotante' ? 'rounded-full w-14 h-14' : 'rounded-xl'} ${navbarItem(navbar, active)}`}>
                <Icon size={navbarIconSize(navbar)} strokeWidth={active ? 2.5 : 1.8} />
                {showLabel && (
                  <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ══ DESKTOP SIDEBAR ═════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 bg-white border-r border-gray-200">

        {/* Perfil */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 bg-gray-100 border-gray-200 flex items-center justify-center shrink-0">
              <ProfileAvatar photo={photo} fallback={<User size={20} className="text-gray-400" />} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Portal Mozo</p>
              <p className="text-xs text-gray-400 truncate">{profile?.nombre ?? 'Puerto Habana'}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 mt-4 px-3 space-y-0.5">
          {menuItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <button onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
