import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase/config';

// Initialise Firebase App (singleton) – reuse same app if already initialized
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/** Sign in with email and password */
export const signIn = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

/** Sign out */
export const signOut = async () => {
  await firebaseSignOut(auth);
};

/** Subscribe to auth state changes */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
