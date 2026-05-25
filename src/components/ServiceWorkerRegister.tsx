'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { WifiOff, RefreshCw, CloudOff, X } from 'lucide-react';

// ─── Cola de sincronización offline ───────────────────────────────────────
// Guarda las operaciones de escritura (POST, PUT, DELETE) que fallaron por
// falta de conexión para re-intentarlas cuando vuelva el internet.

interface SyncQueueItem {
  id: string;
  method: string;
  url: string;
  body?: any;
  timestamp: number;
  intentos: number;
}

const SYNC_QUEUE_KEY = 'ph_sync_queue';
const MAX_RETRIES = 10;
const FAILED_KEY = 'ph_sync_failed';

function getQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch { return []; }
}

function saveQueue(queue: SyncQueueItem[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('ph_sync_queue_update'));
}

/** Agrega una operación a la cola de sincronización */
export function addToSyncQueue(method: string, url: string, body?: any) {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    url,
    body,
    timestamp: Date.now(),
    intentos: 0,
  });
  saveQueue(queue);
  console.info(`📡 Offline: operación encolada ${method} ${url}`);
}

/** Obtiene el tamaño de la cola */
export function getSyncQueueLength(): number {
  return getQueue().length;
}

// ─── Componente ────────────────────────────────────────────────────────────

export default function ServiceWorkerRegister() {
  const [online, setOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dismissedRef = useRef(false);
  const prevCountRef = useRef(0);

  // Procesar la cola de sincronización
  const processQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    const remaining: SyncQueueItem[] = [];
    const failed: SyncQueueItem[] = [];
    let synced = 0;

    for (const item of queue) {
      try {
        if (item.intentos >= MAX_RETRIES) {
          failed.push(item);
          continue;
        }
        // Timeout de 10s para evitar que un request colgado bloquee toda la cola
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        let res: Response;
        try {
          res = await fetch(item.url, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.body ? JSON.stringify(item.body) : undefined,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
        if (res.ok || res.status === 409) {
          synced++;
        } else {
          remaining.push({ ...item, intentos: item.intentos + 1 });
        }
      } catch {
        remaining.push({ ...item, intentos: item.intentos + 1 });
      }
    }

    // Guardar elementos que fallaron permanentemente
    if (failed.length > 0) {
      try {
        const existingFailed = JSON.parse(localStorage.getItem(FAILED_KEY) || '[]');
        localStorage.setItem(FAILED_KEY, JSON.stringify([...existingFailed, ...failed]));
      } catch {}
      console.warn(`${failed.length} operaciones fallaron permanentemente después de ${MAX_RETRIES} intentos.`);
    }

    saveQueue(remaining);
    setSyncCount(getQueue().length);
    setSyncing(false);

    if (synced > 0) {
      window.dispatchEvent(new Event('ph_store_update'));
    }
  }, []);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      // El SW ya es registrado automáticamente por Serwist en build,
      // pero si no, lo registramos manualmente
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }

    // Detectar cambios de conectividad
    const handleOnline = () => {
      setOnline(true);
      setShowBanner(false);
      // Al recuperar conexión, procesar la cola
      processQueue();
    };

    const handleOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);

    // Si no hay conexión al inicio, mostrar banner
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    // Escuchar cambios en la cola
    const handleQueueChange = () => {
      const newCount = getQueue().length;
      // Si hay nuevos items desde la última vez que se descartó, mostrar de nuevo
      if (newCount > prevCountRef.current && dismissedRef.current) {
        setDismissed(false);
        dismissedRef.current = false;
      }
      prevCountRef.current = newCount;
      setSyncCount(newCount);
    };
    window.addEventListener('ph_sync_queue_update', handleQueueChange);
    const initialCount = getQueue().length;
    prevCountRef.current = initialCount;
    setSyncCount(initialCount);

    // Procesar cola al montar si hay conexión
    if (navigator.onLine) {
      processQueue();
    }

    // Intentar procesar cola cada 30 segundos
    const interval = setInterval(() => {
      if (navigator.onLine && getQueue().length > 0) {
        processQueue();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ph_sync_queue_update', handleQueueChange);
      clearInterval(interval);
    };    }, [processQueue]);

  if (!showBanner && syncCount === 0) return null;

  return (
    <>
      {/* Banner de sin conexión */}
      {showBanner && !online && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 duration-300">
          <WifiOff size={16} />
          <span>Sin conexión — los datos se guardan localmente y se sincronizarán cuando vuelva el internet.</span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Indicador de cola de sincronización */}
      {syncCount > 0 && online && !dismissed && (
        <div className="fixed bottom-4 right-4 z-[200] flex items-end gap-2">
          <button
            onClick={processQueue}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {syncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <CloudOff size={16} />
            )}
            {syncing ? 'Sincronizando...' : `${syncCount} cambios pendientes`}
          </button>
          <button
            onClick={() => { setDismissed(true); dismissedRef.current = true; }}
            className="bg-gray-800/70 text-white p-2 rounded-full shadow-xl hover:bg-gray-800 transition-colors"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
