import type { User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';
import { linkRevenueCatUser, unlinkRevenueCatUser } from '@/lib/auth/revenuecatAuth';
import { ensureSupabaseProfile } from '@/utils/publicUser';

type AuthResult = { user: User | null; error: string | null };
type SignOutResult = { error: string | null };
type PasswordResetResult = { error: string | null };

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: toFrenchAuthErrorMessage(error, 'Erreur de connexion') };
    }

    await syncSupabaseProfile(data.user ?? null);
    await linkRevenueCatUser(data.user?.id ?? null, 'email_sign_in');
    await syncSupabaseProfile(data.user ?? null);
    return { user: data.user ?? null, error: null };
  } catch (error) {
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
    await unlinkRevenueCatUser('supabase_sign_out');
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
