'use client';

import { useColorMode } from '@/contexts/ColorModeContext';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorMode, setColorMode, mounted } = useColorMode();

  if (!mounted) {
    return (
      <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
        <div className="w-64 hidden lg:block"></div>
        <main className="flex-1 w-full lg:ml-64"></main>
      </div>
    );
  }

  
}
