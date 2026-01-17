import 'react-native-get-random-values';
import { AppState, InteractionManager, Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import PurchasesUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { promoEvents } from './analytics';
import { syncRevenueCatFacebookAnonId } from './metaAttribution';
import { capturePostHogEvent } from './posthog';

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
let didConfigure = false;
let initPromise: Promise<boolean> | null = null;
let runtimeReadyPromise: Promise<void> | null = null;

type PaywallTrackingContext = {
  step?: number;
  placement?: string;
  source?: string;
};

function logCustomerInfo(source: string, info: CustomerInfo) {
  console.log(`[RevenueCat] ${source} entitlements.active`, info?.entitlements?.active ?? {});
  console.log(`[RevenueCat] ${source} activeSubscriptions`, info?.activeSubscriptions ?? []);
}

function markPurchasesUnconfigured(error?: unknown) {
  if (didConfigure) {
    void error;
    return;
  }
  purchasesConfigured = false;
  void error;
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

  if (initPromise) {
    await initPromise;
    return purchasesConfigured;
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

export async function initRevenueCat(userId?: string): Promise<boolean> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - skipping initialization');
    return false;
  }

  if (await ensurePurchasesConfigured()) {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  const apiKey = getRevenueCatApiKeyForPlatform();
  if (!apiKey) {
    return false;
  }

  initPromise = (async () => {
    try {
      if (!runtimeReadyPromise) {
        runtimeReadyPromise = new Promise((resolve) => {
          const run = () => {
            InteractionManager.runAfterInteractions(() => resolve());
          };

          if (AppState.currentState === 'active') {
            run();
            return;
          }

          const subscription = AppState.addEventListener?.('change', (state) => {
            if (state === 'active') {
              subscription?.remove?.();
              run();
            }
          });
        });
      }

      await runtimeReadyPromise;

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });
      purchasesConfigured = true;
      didConfigure = true;
      console.log('RevenueCat configured successfully');

      try {
        await syncRevenueCatFacebookAnonId();
      } catch (syncError) {
        console.warn('[RevenueCat] Failed to sync FB anonymous ID', syncError);
      }

      return true;
    } catch (error) {
      markPurchasesUnconfigured(error);
      console.error('RevenueCat initialization error:', error);
      // Continue without RevenueCat if initialization fails
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function onCustomerInfoChange(cb: (hasAccess: boolean, info: CustomerInfo) => void) {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - no customer info updates');
    return () => {}; // Return empty unsubscribe function
  }

  if (!purchasesConfigured) {
    return () => {};
  }

  try {
    // Renvoie l'unsubscribe
    return Purchases.addCustomerInfoUpdateListener((info) => {
      logCustomerInfo('listener', info);
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
    return false;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    logCustomerInfo('getCustomerInfo:isProActive', info);
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
    return null;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    logCustomerInfo('getCustomerInfo:getLatestCustomerInfo', info);
    return info;
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

function buildPaywallTrackingPayload(
  result: PAYWALL_RESULT,
  tracking: PaywallTrackingContext | undefined,
  offering?: any,
) {
  const payload: Record<string, any> = { result };

  if (typeof tracking?.step === 'number') {
    payload.step = tracking.step;
  }

  if (tracking?.placement) {
    payload.placement = tracking.placement;
  }

  if (tracking?.source) {
    payload.source = tracking.source;
  }

  const offeringId = typeof offering?.identifier === 'string' ? offering.identifier : undefined;
  if (offeringId) {
    payload.offering_id = offeringId;
  }

  const paywallId =
    (typeof offering?.paywall?.identifier === 'string' ? offering.paywall.identifier : undefined) ||
    (typeof offering?.metadata?.paywall_id === 'string' ? offering.metadata.paywall_id : undefined);

  if (paywallId) {
    payload.paywall_id = paywallId;
  }

  return payload;
}

async function presentPaywallAndTrack(
  params: { offering?: any; displayCloseButton?: boolean },
  tracking?: PaywallTrackingContext,
) {
  const result = await PurchasesUI.presentPaywall(params);
  const payload = buildPaywallTrackingPayload(result, tracking, params?.offering);

  await capturePostHogEvent('paywall_result', payload);

  if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
    await capturePostHogEvent('paywall_converted', payload);
  }

  return result;
}

// Paywall standard (offering "default")
export async function showDefaultPaywall(tracking?: PaywallTrackingContext): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show default paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('default');
  try {
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    if (!CAN_USE_NATIVE_PAYWALL || typeof PurchasesUI?.presentPaywall !== 'function') {
      console.warn('Native paywall UI unavailable, falling back to web purchase flow');
      await openWebPurchase('default');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    const offerings = await Purchases.getOfferings();
    const mainOffering = offerings.all?.main;

    if (mainOffering) {
      return await presentPaywallAndTrack({ offering: mainOffering, displayCloseButton: false }, tracking);
    }

    return await presentPaywallAndTrack({ displayCloseButton: false }, tracking);
  } catch (error) {
    console.warn('Paywall default error', error);
    await promoEvents.purchaseCancel('default');
    return PAYWALL_RESULT.ERROR;
  }
}

// Paywall promo (offering "promo")
export async function showPromoPaywall(tracking?: PaywallTrackingContext): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show promo paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('promo');
  try {
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return PAYWALL_RESULT.NOT_PRESENTED;
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
      return await presentPaywallAndTrack({ displayCloseButton: true }, tracking);
    }

    return await presentPaywallAndTrack({ offering: promoOffering, displayCloseButton: true }, tracking);
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
    return false;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    logCustomerInfo('getCustomerInfo:userHasAccess', info);
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
    return;
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





