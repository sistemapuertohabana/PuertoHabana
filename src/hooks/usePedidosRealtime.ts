'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchPedidosByFecha } from '@/lib/db/pedidos';
import type { PedidoFlat } from '@/lib/database.types';

export function usePedidosRealtime(fecha: string) {
  const [pedidos, setPedidos] = useState<PedidoFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prevFecha, setPrevFecha] = useState(fecha);
  if (fecha !== prevFecha) {
    setPrevFecha(fecha);
    setLoading(true);
    setError(null);
  }

  const applyFetchResult = useCallback((data: PedidoFlat[]) => {
    setPedidos(data);
    setError(null);
    setLoading(false);
  }, []);

  const applyFetchError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  const runFetch = useCallback(async () => {
    try {
      const data = await fetchPedidosByFecha(fecha);
      applyFetchResult(data);
    } catch (e) {
      applyFetchError(e instanceof Error ? e.message : 'Error al cargar pedidos');
    }
  }, [fecha, applyFetchResult, applyFetchError]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchPedidosByFecha(fecha);
        if (!cancelled) applyFetchResult(data);
      } catch (e) {
        if (!cancelled) {
          applyFetchError(e instanceof Error ? e.message : 'Error al cargar pedidos');
        }
      }
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`pedidos-${fecha}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items' },
        () => {
          void load();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        () => {
          void load();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void load();
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [fecha, applyFetchResult, applyFetchError]);

  const reload = useCallback(async () => {
    setLoading(true);
    await runFetch();
  }, [runFetch]);

  return { pedidos, loading, error, reload };
}

export function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
