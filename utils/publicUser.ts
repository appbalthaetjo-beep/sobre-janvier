import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';

import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { supabase } from '@/lib/supabase';

type CachedPublicId = {
  publicUserId: string;
  from: 'supabase' | 'local';
  fullName?: string | null;
  avatarUrl?: string | null;
};

const LOCAL_CACHE_PREFIX = 'public_user_id';

function generatePublicUserId() {
  try {
    if (typeof globalThis !== 'undefined' && 'crypto' in globalThis) {
      const cryptoObj = (globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } }).crypto;
      if (cryptoObj?.randomUUID) {
        return cryptoObj.randomUUID();
      }
    }
  } catch {
    // ignore and fallback
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readCachedPublicId(cacheKey: string): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(cacheKey)) || null;
  } catch {
    return null;
  }
}

async function writeCachedPublicId(cacheKey: string, publicUserId: string) {
  try {
    await AsyncStorage.setItem(cacheKey, publicUserId);
  } catch {
    // ignore cache write failure
  }
}

function extractUserMetadata(user?: User | null) {
  const meta = (user as any)?.user_metadata ?? {};
  const fullName =
    meta?.full_name ?? meta?.name ?? meta?.display_name ?? meta?.displayName ?? meta?.username ?? null;
  const avatarUrl = meta?.avatar_url ?? meta?.picture ?? meta?.avatar ?? null;

  return {
    fullName: typeof fullName === 'string' && fullName.trim().length > 0 ? fullName : null,
    avatarUrl: typeof avatarUrl === 'string' && avatarUrl.trim().length > 0 ? avatarUrl : null,
    email: user?.email ?? null,
  };
}

async function fetchProfileById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('public_user_id, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error && __DEV__) {
      console.warn('[publicUserId] Failed to fetch profile', error);
    }

    return data ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[publicUserId] Unexpected profile fetch error', error);
    }
    return null;
  }
}

export async function ensureSupabaseProfile(
  authUser: User,
  overrides?: { publicUserId?: string | null; fullName?: string | null; avatarUrl?: string | null; email?: string | null; updateLastSeen?: boolean },
): Promise<CachedPublicId> {
  const metadata = extractUserMetadata(authUser);
  const existingProfile = await fetchProfileById(authUser.id);

  const publicUserId = overrides?.publicUserId ?? existingProfile?.public_user_id ?? generatePublicUserId();
  const fullName = overrides?.fullName ?? existingProfile?.full_name ?? metadata.fullName ?? null;
  const avatarUrl = overrides?.avatarUrl ?? existingProfile?.avatar_url ?? metadata.avatarUrl ?? null;

  const payload = {
    id: authUser.id,
    email: overrides?.email ?? metadata.email ?? null,
    public_user_id: publicUserId,
    full_name: fullName ?? null,
    avatar_url: avatarUrl ?? null,
    ...(overrides?.updateLastSeen === false ? {} : { last_seen_at: new Date().toISOString() }),
  };

  let upsertedProfile = existingProfile ?? null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('public_user_id, full_name, avatar_url')
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[publicUserId] Failed to upsert profile', error);
      }
    } else if (data) {
      upsertedProfile = data;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[publicUserId] Unexpected upsert error', error);
    }
  }

  const finalPublicUserId = upsertedProfile?.public_user_id ?? publicUserId;
  const cacheKey = `${LOCAL_CACHE_PREFIX}:supabase:${authUser.id}`;
  await writeCachedPublicId(cacheKey, finalPublicUserId);

  return {
    publicUserId: finalPublicUserId,
    from: 'supabase',
    fullName: upsertedProfile?.full_name ?? fullName ?? null,
    avatarUrl: upsertedProfile?.avatar_url ?? avatarUrl ?? null,
  };
}

export async function getOrCreatePublicUserId(options?: { fullName?: string | null; avatarUrl?: string | null }): Promise<CachedPublicId> {
  if (USE_SUPABASE_AUTH) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData?.user ?? null;
      if (authUser) {
        return ensureSupabaseProfile(authUser, {
          fullName: options?.fullName ?? undefined,
          avatarUrl: options?.avatarUrl ?? undefined,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[publicUserId] Failed to resolve Supabase user', error);
      }
    }
  }

  const cacheKey = `${LOCAL_CACHE_PREFIX}:local`;
  const cached = await readCachedPublicId(cacheKey);
  if (cached) {
    return { publicUserId: cached, from: 'local' };
  }

  const newId = generatePublicUserId();
  await writeCachedPublicId(cacheKey, newId);
  return { publicUserId: newId, from: 'local' };
}

export async function getIdentityDebugInfo() {
  const { data: supaUser } = USE_SUPABASE_AUTH ? await supabase.auth.getUser() : { data: null };
  const { publicUserId, from, fullName, avatarUrl } = await getOrCreatePublicUserId();

  return {
    provider: USE_SUPABASE_AUTH ? 'supabase' : 'local',
    supabaseUserId: supaUser?.user?.id ?? null,
    firebaseUid: null,
    publicUserId,
    source: from,
    fullName: fullName ?? null,
    avatarUrl: avatarUrl ?? null,
  };
}
