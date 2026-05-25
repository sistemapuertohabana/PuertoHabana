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
      
      // Si la sesión tiene ID pero le falta foto o turno, intentar obtener datos actualizados
      // Esto permite que la foto de perfil y el turno se sincronicen entre dispositivos
      if (sess?.id && (!sess.foto_url || !sess.turno)) {
        if (sess.rol === 'admin') {
          // Admin usa MySQL — endpoint admin-exists
          fetch('/api/auth/admin-exists')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.foto_url) {
                const updated = { ...sess, foto_url: data.foto_url };
                setProfile(updated);
                localStorage.setItem(key, JSON.stringify(updated));
              }
            })
            .catch(() => {});
        } else {
          // Mozo, cocina, etc. usan Supabase
          fetch(`/api/personal/${sess.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && (data.foto_url || data.turno)) {
                const updated = { ...sess };
                if (data.foto_url) updated.foto_url = data.foto_url;
                if (data.turno) updated.turno = data.turno;
                setProfile(updated);
                localStorage.setItem(key, JSON.stringify(updated));
              }
            })
            .catch(() => {});
        }
      }
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
