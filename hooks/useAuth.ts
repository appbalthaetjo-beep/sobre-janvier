import { useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import {
  signInWithEmail as supabaseSignInWithEmail,
  signUpWithEmail as supabaseSignUpWithEmail,
  signOut as supabaseSignOut,
  requestPasswordReset as supabaseRequestPasswordReset,
} from '@/lib/auth/supabaseAuth';
import { linkRevenueCatUser } from '@/lib/auth/revenuecatAuth';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { firebaseConfig } from '@/config/firebase.config';
import { identifyPostHogUser } from '../lib/posthog';
import { getExpoPublicEnv } from '@/lib/publicEnv';

const PASSWORD_RESET_REDIRECT_URL =
  getExpoPublicEnv('EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL') ||
  `https://${firebaseConfig.authDomain}`;

type NormalizedUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  metadata?: { creationTime?: string | null; lastSignInTime?: string | null };
  supabaseUser?: SupabaseUser;
};

function normalizeSupabaseUser(user: SupabaseUser | null): NormalizedUser | null {
  if (!user) {
    return null;
  }

  const rawMetadata = (user as any)?.user_metadata ?? {};
  const displayName =
    rawMetadata?.full_name ?? rawMetadata?.name ?? rawMetadata?.displayName ?? rawMetadata?.display_name ?? null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: typeof displayName === 'string' ? displayName : null,
    metadata: {
      creationTime: (user as any)?.created_at ?? null,
      lastSignInTime: (user as any)?.last_sign_in_at ?? null,
    },
    supabaseUser: user,
  };
}

function useSupabaseAuth() {
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const manualLogoutRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (!isSupabaseConfigured) {
      setUser(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] Supabase session bootstrap failed', error);
          return;
        }

        if (isMounted) {
          setUser(normalizeSupabaseUser(data?.session?.user ?? null));
        }
      } catch (error) {
        console.warn('[Auth] Supabase session bootstrap failed', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    let subscription: { unsubscribe?: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) {
          return;
        }

        const nextUser = normalizeSupabaseUser(session?.user ?? null);
        setUser(nextUser);

        if (!nextUser && manualLogoutRef.current) {
          setLoading(false);
          return;
        }

        setLoading(false);
      });
      subscription = data?.subscription;
    } catch (error) {
      console.warn('[Auth] Supabase auth state subscription failed', error);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    void identifyPostHogUser(user?.uid ?? null);
  }, [user?.uid]);

  const signIn = async (email: string, password: string) => {
    const { user: signedInUser, error } = await supabaseSignInWithEmail(email, password);
    if (error) {
      return { user: null, error };
    }

    manualLogoutRef.current = false;
    await setShouldShowOnboardingFlag(false);

    const normalized = normalizeSupabaseUser(signedInUser);
    setUser(normalized);
    setLoading(false);

    return { user: normalized as any, error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error: signUpError } = await supabaseSignUpWithEmail(email, password);
    if (signUpError) {
      return { user: null, error: signUpError };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      const { error: signInError } = await supabaseSignInWithEmail(email, password);
      if (signInError) {
        return { user: null, error: signInError };
      }
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return { user: null, error: userError.message };
    }

    await linkRevenueCatUser(userData.user?.id ?? null, 'email_sign_up');
    manualLogoutRef.current = false;
    await setShouldShowOnboardingFlag(true);

    const normalized = normalizeSupabaseUser(userData.user ?? null);
    setUser(normalized);
    setLoading(false);

    return { user: normalized as any, error: null };
  };

  const requestPasswordReset = async (email: string) => {
    return supabaseRequestPasswordReset(email, PASSWORD_RESET_REDIRECT_URL);
  };

  const logout = async () => {
    try {
      manualLogoutRef.current = true;
      const { error } = await supabaseSignOut();
      if (error) {
        return { error };
      }
      setUser(null);
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      return { error: error?.message ?? String(error ?? 'Unknown error') };
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

export function useAuth() {
  if (USE_SUPABASE_AUTH) {
    return useSupabaseAuth();
  }

  // Évite d'importer Firebase Auth quand Supabase est actif.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFirebaseAuth } = require('./useAuth.firebase');
  return useFirebaseAuth();
}
