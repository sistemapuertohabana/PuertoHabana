'use client';

import { useSyncExternalStore } from 'react';
import { getProfilePhoto } from '@/lib/store';

const STORE_EVENT = 'ph_store_update';

function subscribeStore(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  return () => window.removeEventListener(STORE_EVENT, callback);
}

/** Foto de perfil desde localStorage, compatible con SSR (sin setState en effect). */
export function useProfilePhoto(role: string) {
  return useSyncExternalStore(
    subscribeStore,
    () => getProfilePhoto(role),
    () => ''
  );
}

function subscribeStorage(callback: () => void) {
  const onStorage = () => callback();
  window.addEventListener('storage', onStorage);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

/** Valor de localStorage reactivo (p. ej. preferencias de UI). */
export function useLocalStorageValue(key: string, defaultValue: string) {
  return useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== 'undefined' ? localStorage.getItem(key) : null) ?? defaultValue,
    () => defaultValue
  );
}
