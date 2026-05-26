'use client';

import { useEffect, useState } from 'react';
import DevSidebar from '@/components/DevSidebar';

export default function DevLayoutClient({ children }: { children: React.ReactNode }) {
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      try {
        const sess = JSON.parse(localStorage.getItem('ph_dev_session') || 'null');
        setHasSession(!!sess);
      } catch {
        setHasSession(false);
      }
      setLoading(false);
    };

    checkSession();
    window.addEventListener('ph_store_update', checkSession);
    return () => window.removeEventListener('ph_store_update', checkSession);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-purple-50 to-white">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasSession) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      <DevSidebar />
      <main className="flex-1 w-full lg:ml-64 px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-12 xl:py-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
