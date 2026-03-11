import type { EmailOtpType, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';

import { SUPABASE_DEBUG, probeSupabaseAuthConnectivity, supabase } from '@/lib/supabase';
import { linkRevenueCatUser } from '@/lib/auth/revenuecatAuth';
import { ensureSupabaseProfile } from '@/utils/publicUser';

type AuthResult = { user: User | null; error: string | null };
type SignOutResult = { error: string | null };
type PasswordResetResult = { error: string | null };
type MagicLinkResult = { error: string | null };
type DeepLinkAuthResult = {
  handled: boolean;
  sessionEstablished: boolean;
  error: string | null;
};
const DEFAULT_MAGIC_LINK_REDIRECT_URL = 'sobre://auth/login';

function toFrenchAuthErrorMessage(error: unknown, fallback: string) {
  const message = (error as any)?.message as string | undefined;
  const status = (error as any)?.status as number | undefined;

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect';
  }
  if (normalized.includes('email not confirmed')) {
    return "Merci de confirmer votre email avant de vous connecter.";
  }
  if (normalized.includes('user already registered')) {
    return 'Cette adresse email est déjà utilisée';
  }
  if (normalized.includes('password should be at least')) {
    return 'Le mot de passe est trop court';
  }
  if (status === 429 || normalized.includes('rate limit')) {
    return 'Trop de tentatives. Réessayez plus tard';
  }

  return message;
}

function getDefaultRedirectUrl() {
  return Linking.createURL('auth/login');
}

function appendSearchParams(container: URLSearchParams, raw: string) {
  if (!raw) {
    return;
  }

  const normalized = raw.startsWith('?') || raw.startsWith('#') ? raw.slice(1) : raw;
  const segment = normalized.split('?').pop() ?? normalized;
  const incoming = new URLSearchParams(segment);
  incoming.forEach((value, key) => {
    container.set(key, value);
  });
}

function parseAuthParamsFromUrl(url: string) {
  const params = new URLSearchParams();

  try {
    const parsed = Linking.parse(url);
    const queryParams = parsed.queryParams ?? {};

    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    });
  } catch {
    // Ignore parser errors and fallback to manual extraction below.
  }

  const queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    const hashIndex = url.indexOf('#', queryIndex);
    const queryPart = hashIndex >= 0 ? url.slice(queryIndex + 1, hashIndex) : url.slice(queryIndex + 1);
    appendSearchParams(params, queryPart);
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    appendSearchParams(params, url.slice(hashIndex + 1));
  }

  return params;
}

function maskToken(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function logDeepLinkDebug(step: string, meta?: Record<string, unknown>) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (meta) {
      console.log(`[SupabaseAuth][DeepLink] ${step}`, meta);
    } else {
      console.log(`[SupabaseAuth][DeepLink] ${step}`);
    }
  }
}

function getOtpType(rawType: string | null): EmailOtpType {
  const normalized = (rawType ?? '').toLowerCase();

  switch (normalized) {
    case 'signup':
    case 'recovery':
    case 'invite':
    case 'email':
    case 'email_change':
    case 'magiclink':
      return normalized;
    default:
      return 'magiclink';
  }
}

function isNetworkRequestFailure(error: unknown) {
  const message = (error as any)?.message as string | undefined;
  return typeof message === 'string' && message.toLowerCase().includes('network request failed');
}

async function logAuthNetworkProbe(context: string) {
  try {
    const probe = await probeSupabaseAuthConnectivity();
    console.warn(`[SupabaseAuth] ${context}: connectivity probe`, probe);
  } catch (error) {
    console.warn(`[SupabaseAuth] ${context}: probe failed`, error);
  }
}

async function syncSupabaseProfile(user: User | null) {
  if (!user) {
    return;
  }

  const metadata = (user as any)?.user_metadata ?? {};
  const fullName =
    metadata?.full_name ?? metadata?.name ?? metadata?.display_name ?? metadata?.displayName ?? metadata?.username;
  const avatarUrl = metadata?.avatar_url ?? metadata?.picture ?? metadata?.avatar;

  try {
    await ensureSupabaseProfile(user, {
      fullName: typeof fullName === 'string' ? fullName : null,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
      email: user.email ?? null,
    });
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[SupabaseAuth] Failed to sync profile', error);
    }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('[SupabaseAuth] signInWithEmail:start', {
      url: SUPABASE_DEBUG.url,
      configured: SUPABASE_DEBUG.configured,
      anonKeyPrefix: SUPABASE_DEBUG.anonKeyPrefix,
      anonKeySuffix: SUPABASE_DEBUG.anonKeySuffix,
      httpTraceEnabled: SUPABASE_DEBUG.httpTraceEnabled,
      emailDomain: email.includes('@') ? email.split('@').pop() : null,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    console.log('[SupabaseAuth] signInWithEmail:signInWithPassword result', {
      data: {
        hasUser: Boolean(data?.user),
        userId: data?.user?.id ?? null,
        hasSession: Boolean(data?.session),
        sessionUserId: data?.session?.user?.id ?? null,
      },
      error: error
        ? {
            message: error.message ?? null,
            status: (error as any)?.status ?? null,
            code: (error as any)?.code ?? null,
            details: (error as any)?.details ?? null,
          }
        : null,
    });

    if (error) {
      console.warn('[SupabaseAuth] signInWithEmail:error', {
        message: error.message ?? null,
        status: (error as any)?.status ?? null,
        code: (error as any)?.code ?? null,
      });
      if (isNetworkRequestFailure(error)) {
        await logAuthNetworkProbe('signInWithEmail:error');
      }
      return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur de connexion') };
    }

    await syncSupabaseProfile(data.user ?? null);
    await linkRevenueCatUser(data.user?.id ?? null, 'email_sign_in');
    return { user: data.user ?? null, error: null };
  } catch (error) {
    console.warn('[SupabaseAuth] signInWithEmail:unexpected', {
      message: (error as any)?.message ?? String(error ?? 'Unknown error'),
      name: (error as any)?.name ?? null,
      stack: (error as any)?.stack ?? null,
      error,
    });
    if (isNetworkRequestFailure(error)) {
      await logAuthNetworkProbe('signInWithEmail:unexpected');
    }
    return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur de connexion') };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur lors de la création du compte') };
    }

    return { user: data.user ?? null, error: null };
  } catch (error) {
    return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur lors de la création du compte') };
  }
}

export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { user: null, error: 'Impossible de valider le jeton Apple.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error || !data?.user) {
      return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur de connexion avec Apple') };
    }

    await syncSupabaseProfile(data.user ?? null);
    await linkRevenueCatUser(data.user?.id ?? null, 'apple_sign_in');
    return { user: data.user ?? null, error: null };
  } catch (error) {
    return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur de connexion avec Apple') };
  }
}

export async function signOut(): Promise<SignOutResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: toFrenchAuthErrorMessage(error, 'Erreur lors de la déconnexion') };
    }
    return { error: null };
  } catch (error) {
    return { error: toFrenchAuthErrorMessage(error, 'Erreur lors de la déconnexion') };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[SupabaseAuth] getCurrentUser error', error);
      }
      return null;
    }
    return data.user ?? null;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[SupabaseAuth] getCurrentUser unexpected error', error);
    }
    return null;
  }
}

export async function requestPasswordReset(email: string, redirectTo?: string): Promise<PasswordResetResult> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { error: 'Veuillez saisir votre adresse email avant de continuer.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: redirectTo ?? getDefaultRedirectUrl(),
    });

    if (error) {
      return { error: toFrenchAuthErrorMessage(error, "Impossible d'envoyer l'email de réinitialisation.") };
    }

    return { error: null };
  } catch (error) {
    return { error: toFrenchAuthErrorMessage(error, "Impossible d'envoyer l'email de réinitialisation.") };
  }
}

export async function requestMagicLinkSignIn(email: string, redirectTo?: string): Promise<MagicLinkResult> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return { error: 'Veuillez saisir votre adresse email avant de continuer.' };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo ?? DEFAULT_MAGIC_LINK_REDIRECT_URL,
        // Funnel login must bind to an existing Supabase user created by backend/webhook.
        shouldCreateUser: false,
      },
    });

    if (error) {
      return { error: toFrenchAuthErrorMessage(error, "Impossible d'envoyer le lien de connexion.") };
    }

    return { error: null };
  } catch (error) {
    return { error: toFrenchAuthErrorMessage(error, "Impossible d'envoyer le lien de connexion.") };
  }
}

export async function handleSupabaseAuthDeepLink(url: string): Promise<DeepLinkAuthResult> {
  const trimmedUrl = String(url || '').trim();
  logDeepLinkDebug('received_url', {
    hasUrl: Boolean(trimmedUrl),
    urlPreview: trimmedUrl ? trimmedUrl.slice(0, 160) : null,
  });

  if (!trimmedUrl) {
    logDeepLinkDebug('skip_empty_url');
    return { handled: false, sessionEstablished: false, error: null };
  }

  const params = parseAuthParamsFromUrl(trimmedUrl);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const tokenHash = params.get('token_hash');
  const code = params.get('code');
  const type = params.get('type');
  logDeepLinkDebug('parsed_params', {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    hasTokenHash: Boolean(tokenHash),
    hasCode: Boolean(code),
    otpType: type ?? null,
    accessTokenPreview: maskToken(accessToken),
    refreshTokenPreview: maskToken(refreshToken),
    tokenHashPreview: maskToken(tokenHash),
    codePreview: maskToken(code),
  });

  if (!accessToken && !refreshToken && !tokenHash && !code) {
    logDeepLinkDebug('skip_no_auth_params');
    return { handled: false, sessionEstablished: false, error: null };
  }

  try {
    if (accessToken && refreshToken) {
      logDeepLinkDebug('execute_setSession');
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      logDeepLinkDebug('setSession_result', {
        hasSession: Boolean(data?.session),
        userId: data?.session?.user?.id ?? data?.user?.id ?? null,
        hasError: Boolean(error),
      });

      if (error) {
        return {
          handled: true,
          sessionEstablished: false,
          error: toFrenchAuthErrorMessage(error, 'Impossible de valider votre connexion.'),
        };
      }

      return {
        handled: true,
        sessionEstablished: Boolean(data?.session || data?.user),
        error: null,
      };
    }

    if (code) {
      logDeepLinkDebug('execute_exchangeCodeForSession');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      logDeepLinkDebug('exchangeCodeForSession_result', {
        hasSession: Boolean(data?.session),
        userId: data?.session?.user?.id ?? data?.user?.id ?? null,
        hasError: Boolean(error),
      });

      if (error) {
        return {
          handled: true,
          sessionEstablished: false,
          error: toFrenchAuthErrorMessage(error, 'Impossible de valider votre connexion.'),
        };
      }

      return {
        handled: true,
        sessionEstablished: Boolean(data?.session || data?.user),
        error: null,
      };
    }

    if (tokenHash) {
      logDeepLinkDebug('execute_verifyOtp', {
        otpType: getOtpType(type),
      });
      const { data, error } = await supabase.auth.verifyOtp({
        type: getOtpType(type),
        token_hash: tokenHash,
      });
      logDeepLinkDebug('verifyOtp_result', {
        hasSession: Boolean(data?.session),
        userId: data?.session?.user?.id ?? data?.user?.id ?? null,
        hasError: Boolean(error),
      });

      if (error) {
        return {
          handled: true,
          sessionEstablished: false,
          error: toFrenchAuthErrorMessage(error, 'Impossible de valider votre connexion.'),
        };
      }

      return {
        handled: true,
        sessionEstablished: Boolean(data?.session || data?.user),
        error: null,
      };
    }
  } catch (error) {
    logDeepLinkDebug('handler_exception', {
      message: (error as any)?.message ?? String(error ?? 'Unknown error'),
    });
    return {
      handled: true,
      sessionEstablished: false,
      error: toFrenchAuthErrorMessage(error, 'Impossible de valider votre connexion.'),
    };
  }

  logDeepLinkDebug('no_matching_branch');
  return { handled: false, sessionEstablished: false, error: null };
}
