import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getExpoPublicEnv } from './publicEnv';

const SUPABASE_URL = getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_URL')?.trim();
const SUPABASE_ANON_KEY = getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')?.trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const missingConfigMessage =
  'Variables Supabase manquantes. Définis EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans ton fichier .env.';

function createMissingConfigClient(): SupabaseClient {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`[Supabase] ${missingConfigMessage}`);
  }

  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(missingConfigMessage);
    },
  });
}

export const supabase: SupabaseClient =
  isSupabaseConfigured
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: Platform.OS === 'web' ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : createMissingConfigClient();

export async function debugSupabaseHealth(label = 'Supabase') {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn(`[${label}] health: getSession error`, error);
      return;
    }

    const hasSession = Boolean(data?.session);
    console.log(`[${label}] health: configured`, {
      url: SUPABASE_URL,
      anonKeyLength: SUPABASE_ANON_KEY.length,
      hasSession,
      userId: data?.session?.user?.id ?? null,
    });
  } catch (error) {
    console.warn(`[${label}] health: unexpected error`, error);
  }
}
