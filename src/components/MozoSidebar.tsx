'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User, LogOut, ListOrdered, CalendarClock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

const menuItems = [
  { href: '/mozo', icon: LayoutGrid, label: 'Mesas y Comandas' },
  { href: '/mozo/reservas', icon: CalendarClock, label: 'Reservas' },
  { href: '/mozo/historial', icon: ListOrdered, label: 'Historial de Pedidos' },
  { href: '/mozo/perfil', icon: User, label: 'Mi Perfil' },
];

function ProfileAvatar({ photo, fallback }: { photo: string; fallback: React.ReactNode }) {
  if (photo) {
    return (
      // data URL desde localStorage; next/image no aplica bien aquí
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="Mozo" className="w-full h-full object-cover" />
    );
  }
  return fallback;
}

export default function MozoSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const localPhoto = useProfilePhoto('mozo');
  const photo = profile?.foto_url ?? localPhoto;

  return (
    <>
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 bg-gray-100 border-gray-200">
              <ProfileAvatar photo={photo} fallback={<User size={20} className="text-gray-400" />} />
            </div>
            <div>
              <h1 className="text-sm font-medium tracking-tight text-gray-900">Portal Mozo</h1>
              <p className="text-xs tracking-wide mt-0.5 text-gray-400">
                {profile?.nombre ?? 'Puerto Habana'}
              </p>
            </div>
          </div>
        </div>
      </nav>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="flex justify-around items-center py-3 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center p-3 rounded-xl transition-all ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden lg:block w-64 min-h-screen fixed left-0 top-0 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 bg-gray-100 border-gray-200">
              <ProfileAvatar photo={photo} fallback={<User size={20} className="text-gray-400" />} />
            </div>
            <div>
              <h1 className="text-base font-medium tracking-tight text-gray-900">Portal Mozo</h1>
              <p className="text-xs tracking-wide mt-0.5 text-gray-400">
                {profile?.nombre ?? 'Puerto Habana'}
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
