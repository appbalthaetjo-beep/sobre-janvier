/**
 * Configuration Firebase sécurisée
 * Ce fichier peut être modifié pour la production
 */

import { getExpoPublicEnv } from '@/lib/publicEnv';

export const firebaseConfig = {
  apiKey: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_API_KEY') || 'AIzaSyB3sodqWw96lKAZuqq7RohEK5MtZgagdgY',
  authDomain: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || 'sobre-8c2c1.firebaseapp.com',
  projectId: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || 'sobre-8c2c1',
  storageBucket: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || 'sobre-8c2c1.firebasestorage.app',
  messagingSenderId: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '645150974381',
  appId: getExpoPublicEnv('EXPO_PUBLIC_FIREBASE_APP_ID') || '1:645150974381:web:916a7d1309d52892a24124',
};
