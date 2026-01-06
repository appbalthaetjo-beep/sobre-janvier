import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/config/firebase.config';

// Initialiser Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialiser Auth avec persistance adaptée à la plateforme
let auth: Auth;
let persistencePromise: Promise<void>;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  persistencePromise = setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('[Firebase] Failed to enable web auth persistence', error);
  });
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    persistencePromise = Promise.resolve();
  } catch (error) {
    // initializeAuth échoue si l'instance existe déjà (rechargements Fast Refresh). Reprenons-la simplement.
    auth = getAuth(app);
    persistencePromise = setPersistence(auth, getReactNativePersistence(AsyncStorage)).catch((persistenceError) => {
      console.warn('[Firebase] Failed to reapply native auth persistence', persistenceError);
    });
  }
}

const authReady = persistencePromise
  .catch((error) => {
    console.warn('[Firebase] Auth persistence setup failed', error);
  })
  .then(
    () =>
      new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          () => {
            unsubscribe();
            resolve();
          },
          (error) => {
            console.warn('[Firebase] Auth initialization listener failed', error);
            unsubscribe();
            resolve();
          },
        );
      }),
  );

// Initialiser Firestore
const db = getFirestore(app);

export { auth, authReady, db };
export default app;
