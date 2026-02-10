import { useEffect, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { auth, authReady } from '@/lib/firebase';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { firebaseConfig } from '@/config/firebase.config';
import { identifyPostHogUser } from '../lib/posthog';
import { getExpoPublicEnv } from '@/lib/publicEnv';

const PASSWORD_RESET_REDIRECT_URL =
  getExpoPublicEnv('EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL') ||
  `https://${firebaseConfig.authDomain}`;

export function useFirebaseAuth() {
  auth.languageCode = 'fr';

  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState(() => (auth.currentUser ? false : true));
  const manualLogoutRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(false);
        return;
      }

      if (manualLogoutRef.current) {
        setLoading(false);
        return;
      }

      setLoading(false);
    });

    const resolveInitialAuth = async () => {
      try {
        await authReady;
      } catch (error) {
        console.warn('[Auth] Failed to resolve initial auth state', error);
      }

      if (!isMounted) {
        return;
      }

      setLoading(false);
    };

    void resolveInitialAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    void identifyPostHogUser(user?.uid ?? null);
  }, [user?.uid]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      manualLogoutRef.current = false;
      await setShouldShowOnboardingFlag(false);
      setUser(result.user);
      setLoading(false);
      return { user: result.user, error: null };
    } catch (error: any) {
      let errorMessage = 'Erreur de connexion';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage =
            "Aucun compte trouvé avec cette adresse email. Assurez-vous d'être déjà inscrit avant de vous connecter ou créez un compte.";
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez plus tard';
          break;
        default:
          errorMessage = error.message;
      }

      return { user: null, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      manualLogoutRef.current = false;
      await setShouldShowOnboardingFlag(true);
      setUser(result.user);
      setLoading(false);
      return { user: result.user, error: null };
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la création du compte';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        default:
          errorMessage = error.message;
      }

      return { user: null, error: errorMessage };
    }
  };

  const requestPasswordReset = async (email: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return { error: 'Veuillez saisir votre adresse email avant de continuer.' };
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail, {
        url: PASSWORD_RESET_REDIRECT_URL,
        handleCodeInApp: false,
      });
      return { error: null };
    } catch (error: any) {
      console.log('Forgot password error:', error);

      let message = "Impossible d'envoyer l'email de réinitialisation.";
      switch (error?.code) {
        case 'auth/invalid-email':
          message = 'Adresse email invalide.';
          break;
        case 'auth/user-not-found':
          message = 'Aucun compte trouvé pour cette adresse email.';
          break;
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Réessayez plus tard.';
          break;
        case 'auth/network-request-failed':
          message = 'Connexion réseau indisponible. Vérifiez votre connexion.';
          break;
        default:
          message = error?.message ?? message;
      }

      return { error: message };
    }
  };

  const logout = async () => {
    try {
      manualLogoutRef.current = true;
      await signOut(auth);
      setUser(null);
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      manualLogoutRef.current = false;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    requestPasswordReset,
    logout,
  };
}
