import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
};

// Firebase configuration - user needs to add their own config
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL || "").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

// Check if Firebase is configured (env values present)
export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let services: FirebaseServices | null = null;
let initError: string | null = null;

const friendlyInitMessage = (err: any) => {
  const code = err?.code ? String(err.code) : '';

  if (code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API key. Update VITE_FIREBASE_API_KEY from Firebase Console → Project settings → General → Web app config.';
  }

  if (code === 'app/invalid-api-key') {
    return 'Invalid Firebase API key in your config. Please re-check VITE_FIREBASE_API_KEY.';
  }

  return err?.message ? String(err.message) : 'Firebase failed to initialize.';
};

export const getFirebaseInitError = () => initError;

export const getFirebaseServices = (): FirebaseServices => {
  if (services) return services;

  if (!isFirebaseConfigured()) {
    initError = 'Firebase is not configured. Add VITE_FIREBASE_* values first.';
    throw new Error(initError);
  }

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    services = { app, auth, database };
    initError = null;
    return services;
  } catch (err: any) {
    services = null;
    initError = friendlyInitMessage(err);
    console.error('Firebase initialization failed:', err);
    throw new Error(initError);
  }
};

export const getFirebaseAuth = () => getFirebaseServices().auth;
export const getFirebaseDatabase = () => getFirebaseServices().database;

export const googleProvider = new GoogleAuthProvider();
