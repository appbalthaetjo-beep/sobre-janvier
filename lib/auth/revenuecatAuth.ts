import Purchases from 'react-native-purchases';
import {
  getRevenueCatAppUserId,
  isRevenueCatEnabled,
  isRevenueCatConfigured,
  setRevenueCatAppUserId,
} from '@/src/lib/revenuecat';

let logoutPromise: Promise<void> | null = null;

export async function linkRevenueCatUser(userId?: string | null, context?: string) {
  const canonicalUserId = String(userId || '').trim();
  if (
    !canonicalUserId ||
    !isRevenueCatEnabled() ||
    !isRevenueCatConfigured() ||
    typeof Purchases?.logIn !== 'function'
  ) {
    return;
  }

  if (getRevenueCatAppUserId() === canonicalUserId) {
    if (__DEV__) {
      console.log('[RevenueCat] link skipped (already active)', {
        userId: canonicalUserId,
        context,
      });
    }
    return;
  }

  try {
    const result = await Purchases.logIn(canonicalUserId);
    setRevenueCatAppUserId(canonicalUserId);
    if (__DEV__) {
      const customerInfo = result?.customerInfo;
      const entitlementKeys = Object.keys(customerInfo?.entitlements?.active ?? {});
      const activeSubscriptions = customerInfo?.activeSubscriptions ?? [];
      console.log('[RevenueCat] linked user', {
        userId: canonicalUserId,
        context,
        created: result?.created ?? null,
        originalAppUserId: customerInfo?.originalAppUserId ?? null,
        entitlementKeys,
        activeSubscriptions,
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[RevenueCat] link failed', error);
    }
  }
}

export async function unlinkRevenueCatUser(context?: string) {
  if (
    !isRevenueCatEnabled() ||
    !isRevenueCatConfigured() ||
    typeof Purchases?.logOut !== 'function'
  ) {
    return;
  }

  if (!getRevenueCatAppUserId()) {
    if (__DEV__) {
      console.log('[RevenueCat] logout skipped (already anonymous)', { context });
    }
    return;
  }

  if (logoutPromise) {
    if (__DEV__) {
      console.log('[RevenueCat] logout skipped (already in flight)', { context });
    }
    return logoutPromise;
  }

  try {
    logoutPromise = (async () => {
      try {
        await Purchases.logOut();
        setRevenueCatAppUserId(null);
        if (__DEV__) {
          console.log('[RevenueCat] logged out', { context });
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[RevenueCat] logOut failed', error);
        }
      } finally {
        logoutPromise = null;
      }
    })();

    await logoutPromise;
  } finally {
    if (!logoutPromise) {
      setRevenueCatAppUserId(null);
    }
  }
}
