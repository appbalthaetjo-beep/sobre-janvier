import AsyncStorage from '@react-native-async-storage/async-storage';

import { getOrCreatePublicUserId, getIdentityDebugInfo } from '@/utils/publicUser';
import { getMigrationState, migrateLegacySobrietyData } from '@/utils/sobrietyStorage';

type AsyncStorageMethods = Pick<
  typeof AsyncStorage,
  'getItem' | 'setItem' | 'removeItem' | 'mergeItem'
>;

const SOBRIETY_KEYS = new Set(['sobrietyStartDate', 'sobrietyData']);
let patched = false;
let cachedPublicUserId: string | null = null;

function mapKey(key: string): string {
  if (!cachedPublicUserId) return key;
  if (!SOBRIETY_KEYS.has(key)) return key;
  return `${key}:${cachedPublicUserId}`;
}

function patchAsyncStorage() {
  const original: AsyncStorageMethods = {
    getItem: AsyncStorage.getItem.bind(AsyncStorage),
    setItem: AsyncStorage.setItem.bind(AsyncStorage),
    removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
    mergeItem: AsyncStorage.mergeItem?.bind(AsyncStorage) ?? (async () => {}),
  };

  // Minimal monkey patch: only adjust sobriety keys, leave others intact.
  AsyncStorage.getItem = async (key: string) => {
    const mapped = mapKey(key);
    return original.getItem(mapped);
  };

  AsyncStorage.setItem = async (key: string, value: string) => {
    const mapped = mapKey(key);
    return original.setItem(mapped, value);
  };

  AsyncStorage.removeItem = async (key: string) => {
    const mapped = mapKey(key);
    return original.removeItem(mapped);
  };

  if (AsyncStorage.mergeItem) {
    AsyncStorage.mergeItem = async (key: string, value: string) => {
      const mapped = mapKey(key);
      return original.mergeItem(mapped, value);
    };
  }
}

export async function initSobrietyStorageCompat() {
  if (patched) return;

  const { publicUserId } = await getOrCreatePublicUserId();
  cachedPublicUserId = publicUserId;

  // One-shot migration of legacy keys -> namespaced keys.
  await migrateLegacySobrietyData(publicUserId);

  patchAsyncStorage();
  patched = true;

  if (__DEV__) {
    const identity = await getIdentityDebugInfo();
    const migration = await getMigrationState();
    console.log('[sobriety compat] provider=', identity.provider, {
      supabaseUserId: identity.supabaseUserId,
      firebaseUid: identity.firebaseUid,
      publicUserId: identity.publicUserId,
      migrationDone: migration.migrationDone,
    });
  }
}
