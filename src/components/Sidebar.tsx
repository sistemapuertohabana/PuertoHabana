'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users, DollarSign,
  Settings, User, LogOut, Landmark, Megaphone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorageValue } from '@/hooks/useProfilePhoto';
import { useState, useRef, useEffect } from 'react';

type SidebarDesign = 'minimalista' | 'bonito' | 'normal' | 'azul';
type NavbarStyle = 'original' | 'minimalista' | 'centrado' | 'grande' | 'flotante' | 'flotante_blue_new';

interface MenuGroup {
  label: string;
  items: { href: string; icon: React.ComponentType<any>; label: string }[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'General',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/admin/inventario', icon: Package, label: 'Inventario' },
      { href: '/admin/clientes', icon: Users, label: 'Clientes' },
      { href: '/admin/promociones', icon: Megaphone, label: 'Promociones' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/admin/sunat', icon: Landmark, label: 'SUNAT' },
      { href: '/admin/gastos', icon: DollarSign, label: 'Gastos' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { href: '/admin/personal', icon: User, label: 'Personal' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    ],
  },
];

const flatMenuItems = menuGroups.flatMap(g => g.items);

const ICON_SIZE_DESKTOP = 18;
const ICON_SIZE_MOBILE = 20;

function ProfileAvatar({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  if (src) return <img src={src} alt="Perfil" className="w-full h-full object-cover" />;  // eslint-disable-line
  return <>{fallback}</>;
}

/* ─── desktop style helpers ──────────────────────────────── */

function sidebarBg(d: SidebarDesign) {
  if (d === 'minimalista') return 'bg-white border-r border-gray-100';
  if (d === 'bonito') return 'bg-gradient-to-b from-blue-50 to-white border-r border-blue-100';
  if (d === 'azul') return 'bg-blue-600 border-r border-blue-700';
  return 'bg-white border-r border-gray-200';
}

function sidebarItem(d: SidebarDesign, active: boolean) {
  if (d === 'minimalista') return active ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';
  if (d === 'bonito') return active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-blue-50';
  if (d === 'azul') return active ? 'bg-white text-blue-600' : 'text-blue-200 hover:text-white hover:bg-blue-700';
  return active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';
}

function groupLabelStyle(d: SidebarDesign) {
  if (d === 'azul') return 'text-blue-300';
  if (d === 'minimalista') return 'text-gray-300';
  return 'text-gray-300';
}

/* ─── navbar helpers ─────────────────────────────────────── */

function navbarBg(s: NavbarStyle) {
  if (s === 'flotante') return 'bg-white border border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] mb-4 mx-4 rounded-full';
  if (s === 'flotante_blue_new') return 'bg-blue-600 shadow-[0_-4px_20px_rgba(37,99,235,0.4)] mb-4 mx-4 rounded-full';
  if (s === 'minimalista') return 'bg-white border-t border-gray-100';
  if (s === 'centrado') return 'bg-gray-50 border-t border-gray-200';
  if (s === 'grande') return 'bg-white border-t-2 border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,.06)]';
  return 'bg-white/90 backdrop-blur-md border-t border-gray-200';
}

function navbarItem(s: NavbarStyle, active: boolean) {
  if (s === 'flotante') return active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50';
  if (s === 'flotante_blue_new') return active ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-blue-700';
  if (s === 'minimalista') return active ? 'text-black' : 'text-gray-400 hover:text-gray-600';
  if (s === 'centrado') return active ? 'text-black font-semibold' : 'text-gray-400 hover:text-gray-600';
  if (s === 'grande') return active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
  return active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600';
}

/* ─── Tooltip wrapper ────────────────────────────────────── */

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none shadow-lg">
        {label}
      </div>
    </div>
  );
}

/* ─── Design popover ─────────────────────────────────────── */

function DesignPopover({
  design,
  navbar,
  onDesignChange,
  onNavbarChange,
}: {
  design: SidebarDesign;
  navbar: NavbarStyle;
  onDesignChange: (v: SidebarDesign) => void;
  onNavbarChange: (v: NavbarStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title="Personalizar"
      >
        <Settings size={15} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute left-full ml-2 bottom-0 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 space-y-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Sidebar</label>
            <select value={design} onChange={e => onDesignChange(e.target.value as SidebarDesign)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="normal">Normal</option>
              <option value="minimalista">Minimalista</option>
              <option value="bonito">Bonito</option>
              <option value="azul">Azul</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Navbar</label>
            <select value={navbar} onChange={e => onNavbarChange(e.target.value as NavbarStyle)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="original">Original</option>
              <option value="minimalista">Minimalista</option>
              <option value="centrado">Centrado</option>
              <option value="grande">Grande</option>
              <option value="flotante">Flotante</option>
              <option value="flotante_blue_new">Blue New</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const design = useLocalStorageValue('sidebarDesign_admin', 'normal') as SidebarDesign;
  const navbar = useLocalStorageValue('navbarStyle_admin', 'original') as NavbarStyle;
  const fotoLocal = useLocalStorageValue('fotoPerfil', '');
  const foto = profile?.foto_url ?? fotoLocal;

  const save = (key: string, val: string) => {
    localStorage.setItem(key, val);
    window.dispatchEvent(new Event('ph_store_update'));
  };

  const layout = navbar === 'centrado'
    ? 'justify-center gap-0.5'
    : (navbar === 'flotante' || navbar === 'flotante_blue_new')
      ? 'justify-between px-1'
      : 'justify-around';

  const isFlotante = navbar === 'flotante' || navbar === 'flotante_blue_new';

  return (
    <>
      {/* ══ MOBILE TOP BAR ══════════════════════════════════ */}
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
            <Link href="/admin/sunat"
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors px-2 py-1.5 rounded-lg">
              <Landmark size={14} /> SUNAT
            </Link>
            <button onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors px-2 py-1.5 rounded-lg">
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE BOTTOM NAV — icon-only, bigger icons ════ */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-50 ${navbarBg(navbar)}`}>
        <div className={`flex ${layout} items-center py-2 px-1`}>
          {flatMenuItems.filter(i => i.href !== '/admin/sunat').map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-center transition-all ${
                  isFlotante
                    ? 'rounded-full w-12 h-12'
                    : 'rounded-xl px-3 py-2'
                } ${navbarItem(navbar, active)}`}
                title={label}
              >
                <Icon size={ICON_SIZE_MOBILE} strokeWidth={active ? 2.5 : 1.8} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ══ DESKTOP SIDEBAR — icon-only w-16 ════════════════ */}
      <aside className={`hidden lg:flex flex-col w-16 min-h-screen fixed left-0 top-0 items-center ${sidebarBg(design)}`}>

        {/* Profile */}
        <div className={`w-full flex justify-center py-4 border-b ${design === 'azul' ? 'border-blue-700' : 'border-gray-100'}`}>
          <div className={`w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center ${design === 'azul' ? 'bg-blue-700 border-blue-600' : 'bg-gray-100 border-gray-200'}`}>
            <ProfileAvatar src={foto} fallback={<User size={16} className={design === 'azul' ? 'text-white' : 'text-gray-400'} />} />
          </div>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 w-full flex flex-col items-center py-3 px-1.5 space-y-4 overflow-y-auto">
          {menuGroups.map((group, gi) => (
            <div key={group.label} className="w-full flex flex-col items-center">
              {gi > 0 && (
                <div className={`w-6 h-px mb-3 ${design === 'azul' ? 'bg-blue-700' : 'bg-gray-100'}`} />
              )}
              <div className="flex flex-col items-center gap-1 w-full">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href;
                  return (
                    <Tooltip key={href} label={label}>
                      <Link href={href}
                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 ${sidebarItem(design, active)}`}>
                        <Icon size={ICON_SIZE_DESKTOP} strokeWidth={active ? 2.5 : 2} />
                      </Link>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — design & logout */}
        <div className={`w-full flex flex-col items-center py-3 gap-1.5 border-t ${design === 'azul' ? 'border-blue-700' : 'border-gray-100'}`}>
          <DesignPopover
            design={design}
            navbar={navbar}
            onDesignChange={v => save('sidebarDesign_admin', v)}
            onNavbarChange={v => save('navbarStyle_admin', v)}
          />
          <button onClick={signOut}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${design === 'azul' ? 'text-red-300 hover:bg-blue-700' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
            title="Cerrar Sesión">
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </aside>
    </>
  );
}
