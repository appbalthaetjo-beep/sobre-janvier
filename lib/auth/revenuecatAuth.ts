import Purchases from 'react-native-purchases';
import { isRevenueCatEnabled } from '@/src/lib/revenuecat';

export async function linkRevenueCatUser(userId?: string | null, context?: string) {
  if (!userId || !isRevenueCatEnabled() || typeof Purchases?.logIn !== 'function') {
    return;
  }

  try {
    await Purchases.logIn(userId);
    if (__DEV__) {
      console.log('[RevenueCat] linked user', { userId, context });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[RevenueCat] link failed', error);
    }
  }
}

export async function unlinkRevenueCatUser(context?: string) {
  if (!isRevenueCatEnabled() || typeof Purchases?.logOut !== 'function') {
    return;
  }

  try {
    await Purchases.logOut();
    if (__DEV__) {
      console.log('[RevenueCat] logged out', { context });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[RevenueCat] logOut failed', error);
    }
  }
}

