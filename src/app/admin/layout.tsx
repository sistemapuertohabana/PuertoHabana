'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

type ColorMode = 'claro' | 'oscuro';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorMode, setColorMode] = useState<ColorMode>('claro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColorMode = localStorage.getItem('colorMode') as ColorMode;
    if (savedColorMode) setColorMode(savedColorMode);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex min-h-screen ${colorMode === 'oscuro' ? 'bg-black' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className={`flex-1 lg:ml-64 pb-20 lg:pb-0 p-4 lg:p-8 xl:p-12 ${colorMode === 'oscuro' ? 'bg-black' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
