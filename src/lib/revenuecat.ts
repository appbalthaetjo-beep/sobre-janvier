import 'react-native-get-random-values';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import PurchasesUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { promoEvents } from './analytics';
import { syncRevenueCatFacebookAnonId } from './metaAttribution';

const APP_OWNERSHIP = Constants?.appOwnership ?? 'unknown';
const FORCE_ENABLE = process.env.EXPO_PUBLIC_ENABLE_REVENUECAT === 'true';
const ENABLE_REVENUECAT = FORCE_ENABLE || (Platform.OS !== 'web' && APP_OWNERSHIP !== 'expo');
const CAN_USE_NATIVE_PAYWALL = Platform.OS !== 'web' && APP_OWNERSHIP !== 'expo';
const RC_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
const RC_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
const RC_WEB_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY?.trim();
const RC_FALLBACK_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();

if (!ENABLE_REVENUECAT) {
  const reason = FORCE_ENABLE ? 'forced disable' : `appOwnership=${APP_OWNERSHIP}`;
  console.log(`[RevenueCat] Disabled (${reason})`);
}

let purchasesConfigured = false;

function markPurchasesUnconfigured(error?: unknown) {
  purchasesConfigured = false;
  if (error) {
    console.warn('RevenueCat marked as unconfigured:', error);
  }
}

function getRevenueCatApiKeyForPlatform(): string | null {
  let apiKey: string | undefined | null;

  switch (Platform.OS) {
    case 'ios':
      apiKey = RC_IOS_API_KEY || RC_FALLBACK_API_KEY;
      break;
    case 'android':
      apiKey = RC_ANDROID_API_KEY || RC_FALLBACK_API_KEY;
      break;
    case 'web':
      apiKey = RC_WEB_API_KEY || RC_FALLBACK_API_KEY;
      break;
    default:
      apiKey = RC_FALLBACK_API_KEY || RC_IOS_API_KEY || RC_ANDROID_API_KEY || RC_WEB_API_KEY;
      break;
  }

  apiKey = apiKey?.trim();
  if (!apiKey) {
    const envHint =
      Platform.OS === 'ios'
        ? 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'
        : Platform.OS === 'android'
          ? 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'
          : Platform.OS === 'web'
            ? 'EXPO_PUBLIC_REVENUECAT_WEB_API_KEY'
            : 'EXPO_PUBLIC_REVENUECAT_API_KEY';
    const message = `[RevenueCat] Missing API key for platform "${Platform.OS}". Set ${envHint} in your env file.`;
    console.warn(message);
    markPurchasesUnconfigured(new Error(message));
    return null;
  }

  const expectedPrefixes = getExpectedApiKeyPrefixes();
  if (expectedPrefixes.length && !expectedPrefixes.some((prefix) => apiKey!.startsWith(prefix))) {
    const message = `[RevenueCat] Invalid API key for platform "${Platform.OS}". Expected prefix ${expectedPrefixes.join(' or ')}.`;
    console.error(message);
    markPurchasesUnconfigured(new Error(message));
    return null;
  }

  return apiKey;
}

function getExpectedApiKeyPrefixes(): string[] {
  switch (Platform.OS) {
    case 'ios':
      return ['appl_'];
    case 'android':
      return ['goog_'];
    case 'web':
      return ['wpk_', 'pad_'];
    default:
      return [];
  }
}

async function ensurePurchasesConfigured() {
  if (!ENABLE_REVENUECAT) {
    return false;
  }

  if (purchasesConfigured) {
    return true;
  }

  try {
    const alreadyConfigured = await Purchases.isConfigured?.();
    purchasesConfigured = Boolean(alreadyConfigured);
  } catch (error) {
    markPurchasesUnconfigured(error);
  }

  return purchasesConfigured;
}

export function isRevenueCatEnabled() {
  return ENABLE_REVENUECAT;
}

// 👇 Remplace par l'ID EXACT de ton entitlement dans RC (ex: "Accès à SOBRE." s'il n'y a pas d'ID technique)
export const ENTITLEMENT_ID = 'Accès à SOBRE.';

// Web Purchase Links (à remplacer par vos vrais liens)
export const WEB_PURCHASE_LINK_PROMO = '<<COLLER ICI le Web Purchase Link de l\'offering promo>>';
export const WEB_PURCHASE_LINK_DEFAULT = '<<COLLER ICI le Web Purchase Link de l\'offering default>>';

export async function initRevenueCat(userId?: string) {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - skipping initialization');
    return;
  }

  if (await ensurePurchasesConfigured()) {
    return;
  }

  const apiKey = getRevenueCatApiKeyForPlatform();
  if (!apiKey) {
    return;
  }

  try {
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
    purchasesConfigured = true;
    console.log('RevenueCat configured successfully');

    try {
      await syncRevenueCatFacebookAnonId();
    } catch (syncError) {
      console.warn('[RevenueCat] Failed to sync FB anonymous ID', syncError);
    }
  } catch (error) {
    markPurchasesUnconfigured(error);
    console.error('RevenueCat initialization error:', error);
    // Continue without RevenueCat if initialization fails
  }
}

export function onCustomerInfoChange(cb: (hasAccess: boolean, info: CustomerInfo) => void) {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - no customer info updates');
    return () => {}; // Return empty unsubscribe function
  }

  if (!purchasesConfigured) {
    console.warn('RevenueCat listener requested before configuration');
    return () => {};
  }

  try {
    // Renvoie l'unsubscribe
    return Purchases.addCustomerInfoUpdateListener((info) => {
      const hasAccess = Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);
      cb(hasAccess, info);
    });
  } catch (error) {
    console.error('RevenueCat customer info listener error:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

export async function isProActive(): Promise<boolean> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - returning false for isProActive');
    return false;
  }

  if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
    console.warn('RevenueCat not configured - returning false for isProActive');
    return false;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);
  } catch (error) {
    markPurchasesUnconfigured(error);
    console.error('RevenueCat getCustomerInfo error:', error);
    return false; // Default to no access if RevenueCat fails
  }
}

export async function getLatestCustomerInfo(): Promise<CustomerInfo | null> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - returning null for getLatestCustomerInfo');
    return null;
  }

  if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
    console.warn('RevenueCat not configured - returning null for getLatestCustomerInfo');
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    markPurchasesUnconfigured(error);
    console.error('RevenueCat getLatestCustomerInfo error:', error);
    return null;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - returning false for restorePurchases');
    return false;
  }

  if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
    console.warn('RevenueCat not configured - returning false for restorePurchases');
    return false;
  }

  try {
    const info = await Purchases.restorePurchases();
    return Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);
  } catch (error) {
    markPurchasesUnconfigured(error);
    console.error('RevenueCat restorePurchases error:', error);
    return false;
  }
}

// ---- Paywalls ----

// Paywall standard (offering "default")
export async function showDefaultPaywall(): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show default paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('default');
  try {
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      throw new Error('RevenueCat not configured');
    }

    if (!CAN_USE_NATIVE_PAYWALL || typeof PurchasesUI?.presentPaywall !== 'function') {
      console.warn('Native paywall UI unavailable, falling back to web purchase flow');
      await openWebPurchase('default');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    const offerings = await Purchases.getOfferings();
    const mainOffering = offerings.all?.main;

    if (mainOffering) {
      return await PurchasesUI.presentPaywall({ offering: mainOffering, displayCloseButton: false });
    }

    return await PurchasesUI.presentPaywall({ displayCloseButton: false });
  } catch (error) {
    console.warn('Paywall default error', error);
    await promoEvents.purchaseCancel('default');
    return PAYWALL_RESULT.ERROR;
  }
}

// Paywall promo (offering "promo")
export async function showPromoPaywall(): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show promo paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('promo');
  try {
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      throw new Error('RevenueCat not configured');
    }

    if (!CAN_USE_NATIVE_PAYWALL || typeof PurchasesUI?.presentPaywall !== 'function') {
      console.warn('Native paywall UI unavailable, falling back to web purchase flow');
      await openWebPurchase('promo');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    const offerings = await Purchases.getOfferings();
    const promoOffering = offerings.all?.promo;

    if (!promoOffering) {
      console.warn('Promo offering not configured, falling back to default paywall');
      return await PurchasesUI.presentPaywall({ displayCloseButton: true });
    }

    return await PurchasesUI.presentPaywall({ offering: promoOffering, displayCloseButton: true });
  } catch (error) {
    console.warn('Paywall promo error', error);
    await promoEvents.purchaseCancel('promo');
    return PAYWALL_RESULT.ERROR;
  }
}

// Fallback web pour les paiements
export async function openWebPurchase(offering: 'promo' | 'default') {
  await promoEvents.webPurchaseClick(offering);
  const url = offering === 'promo' ? WEB_PURCHASE_LINK_PROMO : WEB_PURCHASE_LINK_DEFAULT;
  if (url && url !== `<<COLLER ICI le Web Purchase Link de l'offering ${offering}>>`) {
    Linking.openURL(url);
  } else {
    console.warn(`Web purchase link not configured for offering: ${offering}`);
  }
}

// (garde-fou pour "hasAccess")
export async function userHasAccess(): Promise<boolean> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - returning false for userHasAccess');
    return false;
  }

  if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
    console.warn('RevenueCat not configured - returning false for userHasAccess');
    return false;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (error) {
    markPurchasesUnconfigured(error);
    console.error('RevenueCat userHasAccess error:', error);
    return false;
  }
}

// Fonction pour acheter un package
export async function purchasePackage(packageToPurchase) {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot purchase package');
    return;
  }

  if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
    throw new Error('RevenueCat not configured');
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error('Erreur achat package:', error);
    throw error;
  }
}

// Gestion d'abonnement
export async function openManageSubscription() {
  const url = Platform.select({
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: 'https://apps.apple.com/account/subscriptions',
  })!;
  try { 
    await Linking.openURL(url); 
  } catch (error) {
    console.warn('Impossible d\'ouvrir la gestion d\'abonnement:', error);
  }
}





