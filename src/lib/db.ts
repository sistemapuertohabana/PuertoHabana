/**
 * Helpers para Firebase Realtime Database
 * Estructura de la DB:
 *   /personal/{id}
 *   /pedidos/{id}
 *   /inventario/comida/{id}
 *   /inventario/bebidas/{id}
 *   /inventario/tapers/{id}
 *   /gastos/{id}
 *   /reportes/wastes/{id}
 *   /reportes/payments/{id}
 */

import { db } from './firebase';
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';

// ─── Generar ID único ─────────────────────────────────────────────────────────
export const generateId = () => push(ref(db, 'temp')).key as string;

// ─── PERSONAL ─────────────────────────────────────────────────────────────────
export const personalRef = () => ref(db, 'personal');

export const getPersonal = async () => {
  const snap = await get(personalRef());
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addPersonal = async (data: object) => {
  const newRef = push(personalRef());
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const updatePersonal = async (id: string, data: object) => {
  await update(ref(db, `personal/${id}`), data);
};

export const deletePersonal = async (id: string) => {
  await remove(ref(db, `personal/${id}`));
};

export const subscribePersonal = (callback: (data: any[]) => void) => {
  const r = personalRef();
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
export const pedidosRef = () => ref(db, 'pedidos');

export const getPedidos = async () => {
  const snap = await get(pedidosRef());
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addPedido = async (data: object) => {
  const newRef = push(pedidosRef());
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const updatePedido = async (id: string, data: object) => {
  await update(ref(db, `pedidos/${id}`), data);
};

export const deletePedido = async (id: string) => {
  await remove(ref(db, `pedidos/${id}`));
};

export const subscribePedidos = (callback: (data: any[]) => void) => {
  const r = pedidosRef();
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};

// ─── INVENTARIO ───────────────────────────────────────────────────────────────
type Seccion = 'comida' | 'bebidas' | 'tapers';

export const inventarioRef = (seccion: Seccion) => ref(db, `inventario/${seccion}`);

export const getInventario = async (seccion: Seccion) => {
  const snap = await get(inventarioRef(seccion));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addInventarioItem = async (seccion: Seccion, data: object) => {
  const newRef = push(inventarioRef(seccion));
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const updateInventarioItem = async (seccion: Seccion, id: string, data: object) => {
  await update(ref(db, `inventario/${seccion}/${id}`), data);
};

export const deleteInventarioItem = async (seccion: Seccion, id: string) => {
  await remove(ref(db, `inventario/${seccion}/${id}`));
};

export const subscribeInventario = (seccion: Seccion, callback: (data: any[]) => void) => {
  const r = inventarioRef(seccion);
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};

// ─── GASTOS ───────────────────────────────────────────────────────────────────
export const gastosRef = () => ref(db, 'gastos');

export const getGastos = async () => {
  const snap = await get(gastosRef());
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addGasto = async (data: object) => {
  const newRef = push(gastosRef());
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const updateGasto = async (id: string, data: object) => {
  await update(ref(db, `gastos/${id}`), data);
};

export const deleteGasto = async (id: string) => {
  await remove(ref(db, `gastos/${id}`));
};

export const subscribeGastos = (callback: (data: any[]) => void) => {
  const r = gastosRef();
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};

// ─── REPORTES: WASTES ─────────────────────────────────────────────────────────
export const wastesRef = () => ref(db, 'reportes/wastes');

export const getWastes = async () => {
  const snap = await get(wastesRef());
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addWaste = async (data: object) => {
  const newRef = push(wastesRef());
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const deleteWaste = async (id: string) => {
  await remove(ref(db, `reportes/wastes/${id}`));
};

export const subscribeWastes = (callback: (data: any[]) => void) => {
  const r = wastesRef();
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};

// ─── REPORTES: PAYMENTS ───────────────────────────────────────────────────────
export const paymentsRef = () => ref(db, 'reportes/payments');

export const getPayments = async () => {
  const snap = await get(paymentsRef());
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
};

export const addPayment = async (data: object) => {
  const newRef = push(paymentsRef());
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const deletePayment = async (id: string) => {
  await remove(ref(db, `reportes/payments/${id}`));
};

export const subscribePayments = (callback: (data: any[]) => void) => {
  const r = paymentsRef();
  onValue(r, (snap: DataSnapshot) => {
    if (!snap.exists()) { callback([]); return; }
    const list = Object.entries(snap.val()).map(([id, data]: any) => ({ id, ...data }));
    callback(list);
  });
  return () => off(r);
};
