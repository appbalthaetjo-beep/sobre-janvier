import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';

function getFirebaseUid(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { auth } = require('@/lib/firebase');
    return auth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

export function getUserScopedKey(baseKey: string, uid?: string | null) {
  const userId = uid ?? (!USE_SUPABASE_AUTH ? getFirebaseUid() : null);
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export async function migrateLegacyKey(baseKey: string, uid?: string | null) {
  const scopedKey = getUserScopedKey(baseKey, uid);
  if (scopedKey === baseKey) {
    return;
  }

  try {
    const legacyValue = await AsyncStorage.getItem(baseKey);
    if (legacyValue) {
      await AsyncStorage.setItem(scopedKey, legacyValue);
      await AsyncStorage.removeItem(baseKey);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(`[Storage] Failed migration for ${baseKey}`, error);
    }
  }
}
