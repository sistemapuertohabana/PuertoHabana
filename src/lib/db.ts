// lib/db.ts
// localStorage-based persistence for inventario, pedidos, personal, gastos, etc.
// Replaces Firebase/MySQL stubs so the UI works immediately without a backend.

const INVENTARIO_KEY = 'ph_inventario';

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria?: string;
  tipo?: string;
  precio: number;
  cantidad: number;
  [key: string]: any;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readStore(): Record<string, InventarioItem[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(INVENTARIO_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, InventarioItem[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INVENTARIO_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('ph_store_update'));
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe to a collection (comida | bebidas | tapers).
 * Calls `callback` immediately with current data, then on every update.
 * Returns an unsubscribe function.
 */
export function subscribeInventario(
  collection: string,
  callback: (data: InventarioItem[]) => void
): () => void {
  const notify = () => {
    const store = readStore();
    callback(store[collection] ?? []);
  };

  // Seed with default data if collection is empty
  const store = readStore();
  if (!store[collection]) {
    const defaults: Record<string, InventarioItem[]> = {
      comida: [
        { id: genId(), nombre: 'Ceviche de Pescado', categoria: 'Ceviches', precio: 42, cantidad: 20 },
        { id: genId(), nombre: 'Ceviche Mixto', categoria: 'Ceviches', precio: 45, cantidad: 15 },
        { id: genId(), nombre: 'Arroz con Mariscos', categoria: 'Platos Fuertes', precio: 38, cantidad: 18 },
        { id: genId(), nombre: 'Lomo Saltado', categoria: 'Platos Fuertes', precio: 32, cantidad: 12 },
        { id: genId(), nombre: 'Jalea Mixta', categoria: 'Platos Fuertes', precio: 40, cantidad: 10 },
        { id: genId(), nombre: 'Leche de Tigre', categoria: 'Entradas', precio: 20, cantidad: 25 },
      ],
      bebidas: [
        { id: genId(), nombre: 'Cerveza Pilsner', categoria: 'Cervezas', precio: 12, cantidad: 48 },
        { id: genId(), nombre: 'Inca Kola', categoria: 'Refrescos', precio: 5, cantidad: 36 },
        { id: genId(), nombre: 'Chicha Morada', categoria: 'Jugos', precio: 8, cantidad: 20 },
        { id: genId(), nombre: 'Jugo de Naranja', categoria: 'Jugos', precio: 8, cantidad: 15 },
      ],
      tapers: [
        { id: genId(), nombre: 'Taper Grande', tipo: 'Envase', precio: 2.5, cantidad: 100 },
        { id: genId(), nombre: 'Taper Mediano', tipo: 'Envase', precio: 1.5, cantidad: 150 },
        { id: genId(), nombre: 'Bolsa Kraft', tipo: 'Empaque', precio: 0.8, cantidad: 200 },
      ],
    };
    if (defaults[collection]) {
      store[collection] = defaults[collection];
      writeStore(store);
    }
  }

  notify();

  const handler = () => notify();
  window.addEventListener('ph_store_update', handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('ph_store_update', handler);
    window.removeEventListener('storage', handler);
  };
}

export async function addInventarioItem(
  collection: string,
  item: Omit<InventarioItem, 'id'>
): Promise<InventarioItem> {
  const store = readStore();
  const newItem = { ...item, id: genId() } as InventarioItem;
  store[collection] = [newItem, ...(store[collection] ?? [])];
  writeStore(store);
  return newItem;
}

export async function updateInventarioItem(
  collection: string,
  id: string,
  updates: Partial<InventarioItem>
): Promise<void> {
  const store = readStore();
  store[collection] = (store[collection] ?? []).map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  writeStore(store);
}

export async function deleteInventarioItem(
  collection: string,
  id: string
): Promise<void> {
  const store = readStore();
  store[collection] = (store[collection] ?? []).filter((item) => item.id !== id);
  writeStore(store);
}
