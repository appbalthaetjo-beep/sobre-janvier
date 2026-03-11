import { useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import * as ExpoLinking from 'expo-linking';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import {
  signInWithEmail as supabaseSignInWithEmail,
  requestMagicLinkSignIn as supabaseRequestMagicLinkSignIn,
  signUpWithEmail as supabaseSignUpWithEmail,
  signOut as supabaseSignOut,
  handleSupabaseAuthDeepLink,
  requestPasswordReset as supabaseRequestPasswordReset,
} from '@/lib/auth/supabaseAuth';
import { linkRevenueCatUser, unlinkRevenueCatUser } from '@/lib/auth/revenuecatAuth';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { firebaseConfig } from '@/config/firebase.config';
import { identifyPostHogUser } from '../lib/posthog';
import { getExpoPublicEnv } from '@/lib/publicEnv';

const PASSWORD_RESET_REDIRECT_URL =
  getExpoPublicEnv('EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL') ||
  `https://${firebaseConfig.authDomain}`;
const MAGIC_LINK_REDIRECT_URL =
  getExpoPublicEnv('EXPO_PUBLIC_MAGIC_LINK_REDIRECT_URL') || 'sobre://auth/login';
const MAGIC_LINK_EXPECTED_USER_ID_KEY = 'auth.magic_link_expected_user_id';
const MAGIC_LINK_EXPECTED_USER_ID_MAX_AGE_MS = 30 * 60 * 1000;

type NormalizedUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  metadata?: { creationTime?: string | null; lastSignInTime?: string | null };
  supabaseUser?: SupabaseUser;
};

function logAuthDebug(step: string, meta?: Record<string, unknown>) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (meta) {
      console.log(`[Auth][Supabase] ${step}`, meta);
    } else {
      console.log(`[Auth][Supabase] ${step}`);
    }
  }
}

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

function normalizeUserId(value?: string | null) {
  return String(value || '').trim() || null;
}

type PendingMagicLinkUserId = {
  expectedUserId: string;
  createdAtMs: number;
};

async function readPendingMagicLinkExpectedUserId() {
  try {
    const raw = await AsyncStorage.getItem(MAGIC_LINK_EXPECTED_USER_ID_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PendingMagicLinkUserId | null;
    const expectedUserId = normalizeUserId(parsed?.expectedUserId ?? null);
    const createdAtMs = Number(parsed?.createdAtMs ?? 0);
    const isFresh =
      expectedUserId &&
      Number.isFinite(createdAtMs) &&
      createdAtMs > 0 &&
      Date.now() - createdAtMs <= MAGIC_LINK_EXPECTED_USER_ID_MAX_AGE_MS;

    if (!isFresh) {
      await AsyncStorage.removeItem(MAGIC_LINK_EXPECTED_USER_ID_KEY).catch(() => {});
      return null;
    }

    return expectedUserId;
  } catch {
    return null;
  }
}

async function writePendingMagicLinkExpectedUserId(expectedUserId: string) {
  const payload: PendingMagicLinkUserId = {
    expectedUserId,
    createdAtMs: Date.now(),
  };
  await AsyncStorage.setItem(MAGIC_LINK_EXPECTED_USER_ID_KEY, JSON.stringify(payload));
}

async function clearPendingMagicLinkExpectedUserId() {
  await AsyncStorage.removeItem(MAGIC_LINK_EXPECTED_USER_ID_KEY).catch(() => {});
}

function useSupabaseAuth() {
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const manualLogoutRef = useRef(false);
  const expectedMagicLinkUserIdRef = useRef<string | null>(null);
  const mismatchAlertKeyRef = useRef<string | null>(null);

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

    const showMagicLinkMismatchAlert = (expectedUserId: string, actualUserId: string) => {
      const mismatchKey = `${expectedUserId}:${actualUserId}`;
      if (mismatchAlertKeyRef.current === mismatchKey) {
        return;
      }
      mismatchAlertKeyRef.current = mismatchKey;

      Alert.alert(
        'Compte non reconnu',
        "Ce lien de connexion n'est pas associe au compte attendu. Utilisez l'email du paiement ou contactez le support.",
      );
    };

    const clearExpectedMagicLinkUserId = async () => {
      expectedMagicLinkUserIdRef.current = null;
      await clearPendingMagicLinkExpectedUserId();
    };

    const hydrateExpectedMagicLinkUserId = async () => {
      expectedMagicLinkUserIdRef.current = await readPendingMagicLinkExpectedUserId();
      logAuthDebug('hydrate_magic_link_expected_user_id', {
        expectedUserId: expectedMagicLinkUserIdRef.current,
      });
    };

    const handleIncomingAuthUrl = async (url: string | null | undefined, source: 'initial' | 'event') => {
      logAuthDebug('deep_link_received', {
        source,
        hasUrl: Boolean(url),
        urlPreview: url ? String(url).slice(0, 160) : null,
      });

      if (!url) {
        return;
      }

      const result = await handleSupabaseAuthDeepLink(url);
      logAuthDebug('deep_link_result', {
        source,
        handled: result.handled,
        sessionEstablished: result.sessionEstablished,
        error: result.error,
      });
      if (!result.handled) {
        return;
      }

      if (result.error) {
        console.warn('[Auth] Supabase auth deep link failed', {
          source,
          error: result.error,
          url,
        });
        return;
      }

      if (result.sessionEstablished) {
        manualLogoutRef.current = false;
        await setShouldShowOnboardingFlag(false).catch(() => {});

        const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        const resolvedUser = normalizeSupabaseUser(userData?.user ?? sessionData?.session?.user ?? null);
        const expectedUserId = expectedMagicLinkUserIdRef.current;
        logAuthDebug('deep_link_session_after_exchange', {
          source,
          hasSession: Boolean(sessionData?.session),
          hasSessionError: Boolean(sessionError),
          hasUserError: Boolean(userError),
          expectedUserId,
          userId: resolvedUser?.uid ?? null,
        });

        if (expectedUserId && resolvedUser?.uid && resolvedUser.uid !== expectedUserId) {
          logAuthDebug('deep_link_user_mismatch', {
            source,
            expectedUserId,
            actualUserId: resolvedUser.uid,
          });
          await clearExpectedMagicLinkUserId();
          await supabase.auth.signOut().catch(() => {});

          if (isMounted) {
            setUser(null);
            setLoading(false);
          }

          showMagicLinkMismatchAlert(expectedUserId, resolvedUser.uid);
          return;
        }

        if (expectedUserId && resolvedUser?.uid && resolvedUser.uid === expectedUserId) {
          await clearExpectedMagicLinkUserId();
        }

        if (isMounted) {
          setUser(resolvedUser);
        }

        if (resolvedUser?.uid) {
          void linkRevenueCatUser(resolvedUser.uid, `supabase_deep_link_${source}`);
        }
      }
    };

    const bootstrap = async () => {
      try {
        await hydrateExpectedMagicLinkUserId();
        const initialUrl = await ExpoLinking.getInitialURL().catch(() => null);
        await handleIncomingAuthUrl(initialUrl, 'initial');

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] Supabase session bootstrap failed', error);
          return;
        }

        if (isMounted) {
          const bootUser = normalizeSupabaseUser(data?.session?.user ?? null);
          const expectedUserId = expectedMagicLinkUserIdRef.current;

          if (expectedUserId && bootUser?.uid && bootUser.uid !== expectedUserId) {
            logAuthDebug('bootstrap_user_mismatch', {
              expectedUserId,
              actualUserId: bootUser.uid,
            });
            await clearExpectedMagicLinkUserId();
            await supabase.auth.signOut().catch(() => {});
            setUser(null);
            showMagicLinkMismatchAlert(expectedUserId, bootUser.uid);
            return;
          }

          if (expectedUserId && bootUser?.uid && bootUser.uid === expectedUserId) {
            await clearExpectedMagicLinkUserId();
          }

          setUser(bootUser);
          if (bootUser?.uid) {
            void linkRevenueCatUser(bootUser.uid, 'supabase_bootstrap_session');
          }
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
    let linkingSubscription: { remove?: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) {
          return;
        }

        const nextUser = normalizeSupabaseUser(session?.user ?? null);
        const expectedUserId = expectedMagicLinkUserIdRef.current;
        logAuthDebug('on_auth_state_change', {
          event,
          hasSession: Boolean(session),
          expectedUserId,
          userId: nextUser?.uid ?? null,
        });

        if (expectedUserId && nextUser?.uid && nextUser.uid !== expectedUserId) {
          logAuthDebug('on_auth_state_change_user_mismatch', {
            event,
            expectedUserId,
            actualUserId: nextUser.uid,
          });
          void clearExpectedMagicLinkUserId();
          setUser(null);
          setLoading(false);
          void supabase.auth.signOut().catch(() => {});
          showMagicLinkMismatchAlert(expectedUserId, nextUser.uid);
          return;
        }

        if (expectedUserId && nextUser?.uid && nextUser.uid === expectedUserId) {
          void clearExpectedMagicLinkUserId();
        }

        setUser(nextUser);
        if (nextUser?.uid) {
          void linkRevenueCatUser(nextUser.uid, 'supabase_auth_state_change');
        } else if (event === 'SIGNED_OUT') {
          void unlinkRevenueCatUser('supabase_auth_state_change');
        }

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

    try {
      linkingSubscription = ExpoLinking.addEventListener('url', (event) => {
        void handleIncomingAuthUrl(event?.url, 'event');
      }) as unknown as { remove?: () => void };
    } catch (error) {
      console.warn('[Auth] Supabase deep-link subscription failed', error);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
      linkingSubscription?.remove?.();
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

  const requestMagicLinkSignIn = async (
    email: string,
    options?: { expectedAppUserId?: string | null },
  ) => {
    const expectedUserId = normalizeUserId(options?.expectedAppUserId ?? null);

    if (expectedUserId) {
      expectedMagicLinkUserIdRef.current = expectedUserId;
      await writePendingMagicLinkExpectedUserId(expectedUserId);
    } else {
      expectedMagicLinkUserIdRef.current = null;
      await clearPendingMagicLinkExpectedUserId();
    }

    const result = await supabaseRequestMagicLinkSignIn(email, MAGIC_LINK_REDIRECT_URL);
    if (result.error) {
      expectedMagicLinkUserIdRef.current = null;
      await clearPendingMagicLinkExpectedUserId();
    }

    return result;
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
    requestMagicLinkSignIn,
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
