import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, update, remove, onValue, DataSnapshot } from 'firebase/database';

// Firebase configuration – values must be provided in your .env.local (NEXT_PUBLIC_*)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Initialise Firebase App – will throw if required vars are missing.
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.databaseURL) {
  throw new Error('Missing required Firebase environment variables. Check .env.local');
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/**
 * Helper to write data at a given path (overwrites existing data).
 */
export const writeData = async (path: string, value: unknown) => {
  await set(ref(db, path), value);
};

/**
 * Helper to push a new child under a path (generates a unique key).
 */
export const pushData = async (path: string, value: unknown) => {
  await push(ref(db, path), value);
};

/**
 * Helper to update specific fields at a path.
 */
export const updateData = async (path: string, value: Partial<unknown>) => {
  await update(ref(db, path), value);
};

/**
 * Helper to remove data at a path.
 */
export const removeData = async (path: string) => {
  await remove(ref(db, path));
};

/**
 * Subscribe to realtime changes at a path. Returns an unsubscribe function.
 */
export const onValueChange = (
  path: string,
  callback: (snapshot: DataSnapshot) => void,
  errorCallback?: (error: Error) => void
) => {
  const unsubscribe = onValue(
    ref(db, path),
    callback,
    errorCallback
  );
  return unsubscribe;
};
