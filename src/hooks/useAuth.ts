'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface Profile {
  id: string;
  nombre: string;
  rol: string;
  email?: string;
  foto_url?: string;
}

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let key = 'ph_auth_session';
    if (pathname?.includes('/admin')) key = 'ph_admin_session';
    else if (pathname?.includes('/mozo')) key = 'ph_mozo_session';
    else if (pathname?.includes('/cocina')) key = 'ph_cocina_session';

    try {
      const sess = JSON.parse(localStorage.getItem(key) || 'null');
      setProfile(sess);
    } catch {
      setProfile(null);
    }
    setLoading(false);
  }, [pathname]);

  const signOut = async () => {
    let key = 'ph_auth_session';
    if (pathname?.includes('/admin')) key = 'ph_admin_session';
    else if (pathname?.includes('/mozo')) key = 'ph_mozo_session';
    else if (pathname?.includes('/cocina')) key = 'ph_cocina_session';
    
    localStorage.removeItem(key);
    window.location.href = '/';
  };

  return { profile, loading, signOut };
}
