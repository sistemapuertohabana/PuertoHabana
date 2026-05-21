'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function CocinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-[#ededed] selection:text-[#0a0a0a] overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center mix-blend-difference text-white">
        <div className="text-[10px] tracking-[0.3em] uppercase">Cocina / 01</div>
        <div className="flex gap-8 text-[10px] tracking-[0.3em] uppercase">
          <Link href="/cocina" className={`hover:opacity-50 transition-opacity ${pathname === '/cocina' ? 'opacity-100' : 'opacity-40'}`}>
            Comandas
          </Link>
          <Link href="/cocina/perfil" className={`hover:opacity-50 transition-opacity ${pathname === '/cocina/perfil' ? 'opacity-100' : 'opacity-40'}`}>
            Perfil
          </Link>
          <button onClick={signOut} className="opacity-40 hover:opacity-100 transition-opacity uppercase tracking-[0.3em]">
            Salir
          </button>
        </div>
      </nav>
      <main className="flex-1 w-full pt-32 pb-24 px-6 md:px-12 lg:px-24">
        {children}
      </main>
    </div>
  );
}
