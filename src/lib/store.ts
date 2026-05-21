// Shared store using localStorage for syncing Mozo, Cocina, and Admin

export interface ComandaItem {
  name: string;
  qty: number;
  price: number;
}

export interface Comanda {
  id: number;
  mesa: string;
  mozo: string;
  hora: string;
  fecha: string;
  estado: 'Pendiente' | 'Preparando' | 'Listo' | 'Entregado';
  items: ComandaItem[];
  total: number;
}

const COMANDAS_KEY = 'ph_comandas';
const PROFILE_KEY_PREFIX = 'ph_profile_';

// ---- COMANDAS ----

export function getComandas(): Comanda[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMANDAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveComandas(comandas: Comanda[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMANDAS_KEY, JSON.stringify(comandas));
  // Dispatch event so other tabs/components can react
  window.dispatchEvent(new Event('ph_store_update'));
}

export function addComanda(comanda: Comanda) {
  const all = getComandas();
  all.unshift(comanda);
  saveComandas(all);
}

export function updateComandaEstado(id: number, estado: Comanda['estado']) {
  const all = getComandas();
  const updated = all.map(c => c.id === id ? { ...c, estado } : c);
  saveComandas(updated);
}

// ---- PROFILE PHOTO ----

export function getProfilePhoto(role: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PROFILE_KEY_PREFIX + role) || '';
}

export function saveProfilePhoto(role: string, dataUrl: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY_PREFIX + role, dataUrl);
  window.dispatchEvent(new Event('ph_store_update'));
}
