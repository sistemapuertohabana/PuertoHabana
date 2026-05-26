// src/lib/db.ts
// Inventario persistence via MySQL API routes.
// Falls back to localStorage only if the API is unreachable.

import { addToSyncQueue } from '@/components/ServiceWorkerRegister';

export interface TamanoOption {
  nombre: string;
  precio: number;
  costo?: number;
}

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria?: string;
  tipo?: string;
  precio: number;
  cantidad: number;
  seccion?: string;
  unidad?: string;
  minimo?: number;
  codigo_barras?: string;
  imagen_url?: string;
  costo?: number;
  tamanos?: TamanoOption[];
  [key: string]: any;
}

export interface InventarioMovimiento {
  id: string;
  inventario_id: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia?: string;
  referencia_id?: string;
  notas?: string;
  created_at: string;
  inventario?: { nombre: string; seccion: string };
}

const LS_KEY = 'ph_inventario';

// ── localStorage helpers (fallback) ──────────────────────────────────────────

function lsRead(collection: string): InventarioItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return store[collection] ?? [];
  } catch { return []; }
}

function lsWrite(collection: string, items: InventarioItem[], dispatch = false) {
  if (typeof window === 'undefined') return;
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    store[collection] = items;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
    if (dispatch) window.dispatchEvent(new Event('ph_store_update'));
  } catch {}
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe to a collection (comida | bebidas | tapers).
 * Fetches from MySQL API, falls back to localStorage.
 * Returns an unsubscribe function.
 */
export function subscribeInventario(
  collection: string,
  callback: (data: InventarioItem[]) => void
): () => void {
  let active = true;

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/inventario/${collection}`);
      if (!res.ok) throw new Error('API error');
      const data: InventarioItem[] = await res.json();
      // Sync to localStorage for offline fallback (no dispatch para evitar loop)
      lsWrite(collection, data, false);
      if (active) callback(data);
    } catch {
      // Fallback to localStorage
      const data = lsRead(collection);
      if (active) callback(data);
    }
  };

  // Initial fetch
  fetchData();

  // Re-fetch on store update events (e.g. after add/update/delete)
  const handler = () => { if (active) fetchData(); };
  if (typeof window !== 'undefined') {
    window.addEventListener('ph_store_update', handler);
  }

  return () => {
    active = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('ph_store_update', handler);
    }
  };
}

export async function addInventarioItem(
  collection: string,
  item: Omit<InventarioItem, 'id'>
): Promise<InventarioItem> {
  try {
    const res = await fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, seccion: collection }),
    });
    if (!res.ok) throw new Error('API error');
    const newItem: InventarioItem = await res.json();
    window.dispatchEvent(new Event('ph_store_update'));
    return newItem;
  } catch {
    // Encolar para sincronización cuando vuelva internet
    addToSyncQueue('POST', '/api/inventario', { ...item, seccion: collection });
    // Fallback localStorage
    const newItem = { ...item, id: genId(), seccion: collection } as InventarioItem;
    const current = lsRead(collection);
    lsWrite(collection, [newItem, ...current], true);
    return newItem;
  }
}

export async function updateInventarioItem(
  collection: string,
  id: string,
  updates: Partial<InventarioItem>
): Promise<void> {
  try {
    const res = await fetch(`/api/inventario/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('API error');
    window.dispatchEvent(new Event('ph_store_update'));
  } catch {
    // Encolar para sincronización cuando vuelva internet
    addToSyncQueue('PUT', `/api/inventario/${collection}/${id}`, updates);
    // Fallback localStorage
    const current = lsRead(collection);
    lsWrite(collection, current.map(i => i.id === id ? { ...i, ...updates } : i), true);
  }
}

export async function deleteInventarioItem(
  collection: string,
  id: string
): Promise<void> {
  try {
    const res = await fetch(`/api/inventario/${collection}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API error');
    window.dispatchEvent(new Event('ph_store_update'));
  } catch {
    // Encolar para sincronización cuando vuelva internet
    addToSyncQueue('DELETE', `/api/inventario/${collection}/${id}`);
    // Fallback localStorage
    const current = lsRead(collection);
    lsWrite(collection, current.filter(i => i.id !== id), true);
  }
}
