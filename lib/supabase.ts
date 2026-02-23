import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getExpoPublicEnv } from './publicEnv';

const SUPABASE_URL = getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_URL')?.trim();
const SUPABASE_ANON_KEY = getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')?.trim();
const isDevRuntime = typeof __DEV__ !== 'undefined' && __DEV__;
const SUPABASE_HTTP_TRACE = isDevRuntime && getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_HTTP_TRACE') === 'true';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const missingConfigMessage =
  'Variables Supabase manquantes. Definis EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans ton fichier .env.';

type JwtClaims = {
  role?: string;
  sub?: string;
  exp?: number;
  [key: string]: unknown;
};

const nativeFetch: typeof fetch | null = typeof fetch === 'function' ? fetch.bind(globalThis) : null;

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    if (typeof atob === 'function') {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(padded), (char: string) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join(''),
      );
    }
  } catch {
    // ignore
  }

  return null;
}

export function decodeJwtClaims(token?: string | null): JwtClaims | null {
  if (!token) {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as JwtClaims;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function shouldTraceSupabaseRequest(url: string) {
  if (!url) {
    return false;
  }
  return /\/auth\/v1\//.test(url) || /\/rest\/v1\/community_messages(?:\?|$)/.test(url) || /\/rest\/v1\/rpc\/community_/.test(url);
}

function getRequestUrl(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url;
  }

  return '';
}

function buildMergedHeaders(input: unknown, init?: RequestInit): Headers | null {
  if (typeof Headers === 'undefined') {
    return null;
  }

  const headers = new Headers();

  if (typeof Request !== 'undefined' && input instanceof Request) {
    new Headers(input.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

const tracedSupabaseFetch: typeof fetch = async (input, init) => {
  if (!nativeFetch) {
    throw new Error('Fetch API indisponible');
  }

  const url = getRequestUrl(input);
  const shouldTrace = shouldTraceSupabaseRequest(url);
  const method =
    (init?.method ??
      (typeof Request !== 'undefined' && input instanceof Request ? input.method : undefined) ??
      'GET')
      .toString()
      .toUpperCase();

  if (shouldTrace) {
    const headers = buildMergedHeaders(input, init);
    const authHeader = headers?.get('authorization') ?? null;
    const apiKeyHeader = headers?.get('apikey') ?? null;
    const tokenClaims =
      authHeader?.toLowerCase().startsWith('bearer ') ? decodeJwtClaims(authHeader.slice(7).trim()) : null;

    console.log('[SupabaseHTTP] request', {
      method,
      url,
      hasAuthorization: Boolean(authHeader),
      authorizationPrefix: authHeader ? authHeader.slice(0, 16) : null,
      hasApiKey: Boolean(apiKeyHeader),
      apiKeyPrefix: apiKeyHeader ? apiKeyHeader.slice(0, 8) : null,
      tokenRole: tokenClaims?.role ?? null,
      tokenSubSuffix: typeof tokenClaims?.sub === 'string' ? tokenClaims.sub.slice(-8) : null,
    });
  }

  try {
    const response = await nativeFetch(input, init);

    if (shouldTrace) {
      console.log('[SupabaseHTTP] response', {
        method,
        url,
        status: response.status,
        ok: response.ok,
        contentRange: response.headers.get('content-range'),
      });
    }

    return response;
  } catch (error) {
    if (shouldTrace) {
      console.warn('[SupabaseHTTP] request failed', {
        method,
        url,
        error: (error as any)?.message ?? String(error ?? 'Unknown error'),
      });
    }
    throw error;
  }
};

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

const clientOptions = {
  ...(SUPABASE_HTTP_TRACE ? { global: { fetch: tracedSupabaseFetch } } : {}),
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
};

export const supabase: SupabaseClient =
  isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions) : createMissingConfigClient();

// Lightweight runtime debug info (safe to log).
export const SUPABASE_DEBUG = {
  url: SUPABASE_URL,
  anonKeyPrefix: SUPABASE_ANON_KEY?.slice(0, 8) ?? null,
  anonKeySuffix: SUPABASE_ANON_KEY?.slice(-4) ?? null,
  anonKeyLength: SUPABASE_ANON_KEY?.length ?? 0,
  configured: isSupabaseConfigured,
  httpTraceEnabled: SUPABASE_HTTP_TRACE,
};

export async function probeSupabaseAuthConnectivity() {
  const healthUrl = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/health` : null;

  if (!healthUrl) {
    return {
      ok: false,
      status: null as number | null,
      url: null as string | null,
      error: 'missing_supabase_url',
    };
  }

  if (!nativeFetch) {
    return {
      ok: false,
      status: null as number | null,
      url: healthUrl,
      error: 'fetch_unavailable',
    };
  }

  try {
    const response = await nativeFetch(healthUrl, {
      method: 'GET',
      headers: SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : undefined,
    });

    return {
      ok: response.ok,
      status: response.status,
      url: healthUrl,
      error: null as string | null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null as number | null,
      url: healthUrl,
      error: (error as any)?.message ?? String(error ?? 'Unknown error'),
    };
  }
}

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
      anonKeyLength: SUPABASE_ANON_KEY?.length ?? 0,
      hasSession,
      userId: data?.session?.user?.id ?? null,
      httpTraceEnabled: SUPABASE_HTTP_TRACE,
    });
  } catch (error) {
    console.warn(`[${label}] health: unexpected error`, error);
  }
}
