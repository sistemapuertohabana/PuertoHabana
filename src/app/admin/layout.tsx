'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

type ColorMode = 'claro' | 'oscuro';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorMode = 'claro' as any;
  const setColorMode = (mode: ColorMode) => {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('dark');
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex min-h-screen overflow-x-hidden ${colorMode === 'oscuro' ? 'bg-black' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className={`flex-1 w-full lg:ml-64 px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-12 xl:py-12 overflow-x-hidden ${colorMode === 'oscuro' ? 'bg-black' : ''}`}>
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
