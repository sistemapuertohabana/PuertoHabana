'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChefHat, LogOut, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { getProfilePhoto } from '@/lib/store';

export default function LavaplatoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<{ nombre?: string; rol?: string } | null>(null);
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ph_lavaplato_session');
      if (stored) {
        setSession(JSON.parse(stored));
      } else {
        router.push('/login-lavaplato');
      }
    } catch {}
    
    const handleStorage = () => { setPhoto(getProfilePhoto('lavaplato')); };
    handleStorage();
    window.addEventListener('ph_store_update', handleStorage);
    return () => window.removeEventListener('ph_store_update', handleStorage);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('ph_lavaplato_session');
    router.push('/login-lavaplato');
  };

  const navItems = [
    { name: 'Inicio', href: '/lavaplato', icon: LayoutDashboard },
  ];

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <ChefHat size={20} />
          </div>
          <span className="font-bold text-gray-900">Lavaplatos</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900 p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 lg:flex hidden">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <ChefHat size={24} />
          </div>
          <span className="text-xl font-bold text-gray-900">Lavaplatos</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
              {photo ? <img src={photo} alt="Perfil" className="w-full h-full object-cover" /> : <User size={20} className="text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{session?.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{session?.rol || 'Lavaplatos'}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
