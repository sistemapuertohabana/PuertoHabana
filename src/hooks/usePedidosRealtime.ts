'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notificacion {
  id: number;
  usuario_id?: string;
  rol_destino?: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

/**
 * Hook que se suscribe a INSERT en la tabla `notificaciones` vía Supabase Realtime.
 * Filtra por rol_destino y/o usuario_id en cliente.
 * Llama `onNotificacion` cuando llega una nueva notificación relevante.
 */
export function useNotificacionesRealtime(
  rol?: string,
  usuarioId?: string,
  onNotificacion?: (notificacion: Notificacion) => void
) {
  const onNotifRef = useRef(onNotificacion);
  onNotifRef.current = onNotificacion;

  useEffect(() => {
    const channel = supabase
      .channel('notificaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
        },
        (payload) => {
          const notif = payload.new as Notificacion;

          // Filtrar por rol_destino
          if (rol && notif.rol_destino && notif.rol_destino !== rol) return;
          // Filtrar por usuario_id
          if (usuarioId && notif.usuario_id && notif.usuario_id !== usuarioId) return;

          onNotifRef.current?.(notif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rol, usuarioId]);
}

export function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
