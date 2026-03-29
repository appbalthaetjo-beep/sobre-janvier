import { getExpoPublicEnv } from '@/lib/publicEnv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AppState, InteractionManager, Linking, Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import 'react-native-get-random-values';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import PurchasesUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { promoEvents } from './analytics';
import {
  logMetaInitiateCheckout,
  logMetaPurchase,
  logMetaStartTrial,
  logMetaSubscribe,
} from './metaConversionEvents';
import { capturePostHogEvent } from './posthog';

const APP_OWNERSHIP = Constants?.appOwnership ?? 'unknown';
const FORCE_ENABLE =
  getExpoPublicEnv('EXPO_PUBLIC_ENABLE_REVENUECAT') === 'true';
const ENABLE_REVENUECAT =
  FORCE_ENABLE || (Platform.OS !== 'web' && APP_OWNERSHIP !== 'expo');
const REQUIRE_RC_APP_USER_ID =
  getExpoPublicEnv('EXPO_PUBLIC_REQUIRE_REVENUECAT_USER_ID') !== 'false';
const CAN_USE_NATIVE_PAYWALL =
  Platform.OS !== 'web' && APP_OWNERSHIP !== 'expo';
const RC_IOS_API_KEY = getExpoPublicEnv(
  'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
)?.trim();
const RC_ANDROID_API_KEY = getExpoPublicEnv(
  'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
)?.trim();
const RC_WEB_API_KEY = getExpoPublicEnv(
  'EXPO_PUBLIC_REVENUECAT_WEB_API_KEY',
)?.trim();
const RC_FALLBACK_API_KEY = getExpoPublicEnv(
  'EXPO_PUBLIC_REVENUECAT_API_KEY',
)?.trim();

if (!ENABLE_REVENUECAT) {
  const reason = FORCE_ENABLE
    ? 'forced disable'
    : `appOwnership=${APP_OWNERSHIP}`;
  console.log(`[RevenueCat] Disabled (${reason})`);
}

let purchasesConfigured = false;
let didConfigure = false;
let initPromise: Promise<boolean> | null = null;
let runtimeReadyPromise: Promise<void> | null = null;
let customLogHandlerInstalled = false;
let activeRevenueCatAppUserId: string | null = null;
let paywallPresentationInProgress = false;

const PAYWALL_ABANDON_OPENED_AT_KEY = 'paywallAbandonOpenedAtMs';
const PAYWALL_ABANDON_CANDIDATE_AT_KEY = 'paywallAbandonCandidateAtMs';
const PAYWALL_ABANDON_LAST_SCHEDULED_AT_KEY = 'paywallAbandonLastScheduledAtMs';
const PAYWALL_ABANDON_ID_30M_KEY = 'paywallAbandonNotificationId30m';
const PAYWALL_ABANDON_ID_NEXTDAY_KEY = 'paywallAbandonNotificationIdNextDay10';

const PAYWALL_ABANDON_SHORTCUT_URL_30M =
  'sobre://paywall?source=paywall-abandon-30m';
const PAYWALL_ABANDON_SHORTCUT_URL_NEXTDAY =
  'sobre://paywall?source=paywall-abandon-nextday10';

const POST_PURCHASE_BLOCKERS_REMINDER_LAST_SCHEDULED_AT_KEY =
  'postPurchaseBlockersReminderLastScheduledAtMs';
const POST_PURCHASE_BLOCKERS_REMINDER_ID_30M_KEY =
  'postPurchaseBlockersReminderNotificationId30m';
const POST_PURCHASE_BLOCKERS_REMINDER_URL =
  'sobre://blocking-settings?source=post-purchase-reminder';
const RC_DEVICE_IDENTIFIERS_SYNCED_KEY =
  'revenueCatDeviceIdentifiersSynced';
const RC_FB_ANON_ID_SYNCED_KEY = 'revenueCatFbAnonIdSynced';

let paywallOpenedAtMs: number | null = null;
let paywallCandidateAtMs: number | null = null;
let paywallAbandonInitDone = false;
let paywallAbandonListener: { remove?: () => void } | null = null;

async function cancelPostPurchaseBlockersReminder() {
  try {
    const id = await AsyncStorage.getItem(
      POST_PURCHASE_BLOCKERS_REMINDER_ID_30M_KEY,
    );
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.log('[PostPurchaseReminder] cancel failed', error);
  } finally {
    await AsyncStorage.multiRemove([
      POST_PURCHASE_BLOCKERS_REMINDER_ID_30M_KEY,
      POST_PURCHASE_BLOCKERS_REMINDER_LAST_SCHEDULED_AT_KEY,
    ]).catch(() => {});
  }
}

async function schedulePostPurchaseBlockersReminder() {
  if (Platform.OS !== 'ios') return;

  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    return;
  }

  // Only for premium users.
  try {
    if (!ENABLE_REVENUECAT) return;
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return;
    }

    const info = await Purchases.getCustomerInfo();
    const pro = Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);
    if (!pro) return;
  } catch {
    return;
  }

  const now = Date.now();
  const lastScheduled = Number(
    (await AsyncStorage.getItem(
      POST_PURCHASE_BLOCKERS_REMINDER_LAST_SCHEDULED_AT_KEY,
    )) ?? 0,
  );
  if (lastScheduled > 0 && now - lastScheduled < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  await cancelPostPurchaseBlockersReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SOBRE',
      body: '🔒 Pense à configurer tes bloqueurs pour rester protégé au quotidien.',
      data: {
        url: POST_PURCHASE_BLOCKERS_REMINDER_URL,
        type: 'post-purchase-blockers-30m',
      },
    },
    trigger: { seconds: 30 * 60 },
  });

  await AsyncStorage.multiSet([
    [POST_PURCHASE_BLOCKERS_REMINDER_ID_30M_KEY, id],
    [POST_PURCHASE_BLOCKERS_REMINDER_LAST_SCHEDULED_AT_KEY, String(now)],
  ]);

  console.log('[PostPurchaseReminder] scheduled blockers reminder', { id });
}

async function cancelPaywallAbandonReminders() {
  try {
    const [id30, idNext] = await Promise.all([
      AsyncStorage.getItem(PAYWALL_ABANDON_ID_30M_KEY),
      AsyncStorage.getItem(PAYWALL_ABANDON_ID_NEXTDAY_KEY),
    ]);
    if (id30) {
      await Notifications.cancelScheduledNotificationAsync(id30);
    }
    if (idNext) {
      await Notifications.cancelScheduledNotificationAsync(idNext);
    }
  } catch (error) {
    console.log('[PaywallAbandon] cancel failed', error);
  } finally {
    await AsyncStorage.multiRemove([
      PAYWALL_ABANDON_ID_30M_KEY,
      PAYWALL_ABANDON_ID_NEXTDAY_KEY,
      PAYWALL_ABANDON_LAST_SCHEDULED_AT_KEY,
    ]).catch(() => {});
  }
}

function computeTomorrowAt10Local(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function schedulePaywallAbandonReminders() {
  if (Platform.OS !== 'ios') return;

  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    console.log(
      '[PaywallAbandon] notifications not granted; skipping schedule',
    );
    return;
  }

  // Never notify paying users (only schedule if we can confirm the user is NOT premium).
  try {
    if (!ENABLE_REVENUECAT) return;
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return;
    }

    const info = await Purchases.getCustomerInfo();
    logCustomerInfo('getCustomerInfo:paywallAbandon', info);

    const pro = Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);
    if (pro) return;
  } catch (error) {
    console.log(
      '[PaywallAbandon] failed to confirm pro status; skipping schedule',
      error,
    );
    return;
  }

  const now = Date.now();
  const lastScheduled = Number(
    (await AsyncStorage.getItem(PAYWALL_ABANDON_LAST_SCHEDULED_AT_KEY)) ?? 0,
  );
  if (lastScheduled > 0 && now - lastScheduled < 24 * 60 * 60 * 1000) {
    return;
  }

  await cancelPaywallAbandonReminders();

  const id30m = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SOBRE',
      body: '✨ Essai gratuit disponible — obtiens l’accès complet à l’app SOBRE.',
      data: {
        url: PAYWALL_ABANDON_SHORTCUT_URL_30M,
        type: 'paywall-abandon-30m',
      },
    },
    trigger: { seconds: 30 * 60 },
  });

  const tomorrow10 = computeTomorrowAt10Local(new Date(now));
  const idNextDay = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SOBRE',
      body: '✨ Tu peux essayer gratuitement — débloque l’accès complet à l’app SOBRE.',
      data: {
        url: PAYWALL_ABANDON_SHORTCUT_URL_NEXTDAY,
        type: 'paywall-abandon-nextday10',
      },
    },
    trigger: { type: 'date', date: tomorrow10 },
  });

  await AsyncStorage.multiSet([
    [PAYWALL_ABANDON_ID_30M_KEY, id30m],
    [PAYWALL_ABANDON_ID_NEXTDAY_KEY, idNextDay],
    [PAYWALL_ABANDON_LAST_SCHEDULED_AT_KEY, String(now)],
  ]);

  console.log('[PaywallAbandon] scheduled reminders', {
    id30m,
    idNextDay,
    tomorrow10: tomorrow10.toISOString(),
  });
}

async function clearPaywallAbandonState() {
  paywallOpenedAtMs = null;
  paywallCandidateAtMs = null;
  await AsyncStorage.multiRemove([
    PAYWALL_ABANDON_OPENED_AT_KEY,
    PAYWALL_ABANDON_CANDIDATE_AT_KEY,
  ]).catch(() => {});
}

async function markPaywallOpenedForAbandonReminders() {
  if (Platform.OS !== 'ios') return;
  const now = Date.now();
  paywallOpenedAtMs = now;
  paywallCandidateAtMs = null;
  await AsyncStorage.multiSet([
    [PAYWALL_ABANDON_OPENED_AT_KEY, String(now)],
    [PAYWALL_ABANDON_CANDIDATE_AT_KEY, '0'],
  ]).catch(() => {});
}

async function markPaywallClosedWithoutPurchaseForAbandonReminders() {
  if (Platform.OS !== 'ios') return;
  const now = Date.now();
  paywallOpenedAtMs = null;
  paywallCandidateAtMs = now;
  await AsyncStorage.multiSet([
    [PAYWALL_ABANDON_OPENED_AT_KEY, '0'],
    [PAYWALL_ABANDON_CANDIDATE_AT_KEY, String(now)],
  ]).catch(() => {});
}

async function maybeScheduleAbandonRemindersFromExit() {
  if (Platform.OS !== 'ios') return;
  if (paywallPresentationInProgress) return;
  const now = Date.now();

  const openedRaw =
    (await AsyncStorage.getItem(PAYWALL_ABANDON_OPENED_AT_KEY)) ?? '0';
  const candRaw =
    (await AsyncStorage.getItem(PAYWALL_ABANDON_CANDIDATE_AT_KEY)) ?? '0';
  const openedAt = paywallOpenedAtMs ?? Number(openedRaw);
  const candidateAt = paywallCandidateAtMs ?? Number(candRaw);

  const withinWindow = (ts: number) => ts > 0 && now - ts < 5 * 60 * 1000;
  if (!withinWindow(openedAt) && !withinWindow(candidateAt)) {
    return;
  }

  // Avoid rescheduling repeatedly during the same session.
  await clearPaywallAbandonState();
  await schedulePaywallAbandonReminders();
}

export function initPaywallAbandonReminders() {
  if (paywallAbandonInitDone) return;
  paywallAbandonInitDone = true;

  if (Platform.OS !== 'ios') return;

  // Best-effort: if the user is already premium, ensure nothing is scheduled.
  isProActive()
    .then((pro) => {
      if (pro) {
        void cancelPaywallAbandonReminders();
        void cancelPostPurchaseBlockersReminder();
      }
    })
    .catch(() => {});

  if (paywallAbandonListener) return;
  paywallAbandonListener = AppState.addEventListener('change', (state) => {
    if (state === 'background' || state === 'inactive') {
      if (paywallPresentationInProgress) return;
      void maybeScheduleAbandonRemindersFromExit();
    }
  }) as unknown as { remove?: () => void };
}

type PaywallTrackingContext = {
  step?: number;
  placement?: string;
  source?: string;
};

function logCustomerInfo(source: string, info: CustomerInfo) {
  console.log(
    `[RevenueCat] ${source} entitlements.active`,
    info?.entitlements?.active ?? {},
  );
  console.log(
    `[RevenueCat] ${source} activeSubscriptions`,
    info?.activeSubscriptions ?? [],
  );
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
      apiKey =
        RC_FALLBACK_API_KEY ||
        RC_IOS_API_KEY ||
        RC_ANDROID_API_KEY ||
        RC_WEB_API_KEY;
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
  if (
    expectedPrefixes.length &&
    !expectedPrefixes.some((prefix) => apiKey!.startsWith(prefix))
  ) {
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

function installCustomRevenueCatLogHandler() {
  if (customLogHandlerInstalled || typeof Purchases?.setLogHandler !== 'function') {
    return;
  }

  try {
    Purchases.setLogHandler((level, message) => {
      const rendered = `[RevenueCat] ${message}`;
      const normalizedMessage =
        typeof message === 'string' ? message.toLowerCase() : '';
      const isNonBlockingSubscriberAttributesLog =
        normalizedMessage.includes('subscriber attributes') ||
        normalizedMessage.includes('$idfv') ||
        normalizedMessage.includes('$fbanonid') ||
        normalizedMessage.includes('immutable');

      if (isNonBlockingSubscriberAttributesLog) {
        console.warn(`${rendered} (non-blocking)`);
        return;
      }

      switch (level) {
        case Purchases.LOG_LEVEL.DEBUG:
          console.debug(rendered);
          break;
        case Purchases.LOG_LEVEL.INFO:
          console.info(rendered);
          break;
        case Purchases.LOG_LEVEL.WARN:
          console.warn(rendered);
          break;
        case Purchases.LOG_LEVEL.ERROR:
          console.error(rendered);
          break;
        default:
          console.log(rendered);
          break;
      }
    });

    customLogHandlerInstalled = true;
  } catch (error) {
    console.warn('[RevenueCat] setLogHandler failed', error);
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

export function isRevenueCatConfigured() {
  return purchasesConfigured;
}

export function getRevenueCatAppUserId() {
  return activeRevenueCatAppUserId;
}

export function setRevenueCatAppUserId(userId?: string | null) {
  activeRevenueCatAppUserId = String(userId || '').trim() || null;
}

async function markRevenueCatAttributeSynced(storageKey: string) {
  await AsyncStorage.setItem(storageKey, '1');
}

async function hasRevenueCatAttributeBeenSynced(storageKey: string) {
  return (await AsyncStorage.getItem(storageKey)) === '1';
}

function shouldTreatRevenueCatAttributeErrorAsSynced(error: unknown) {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes('immutable') ||
    message.includes('$idfv') ||
    message.includes('$fbanonid') ||
    message.includes('subscriber attributes')
  );
}

async function syncRevenueCatStaticSubscriberAttributesOnce() {
  if (await hasRevenueCatAttributeBeenSynced(RC_DEVICE_IDENTIFIERS_SYNCED_KEY)) {
    if (__DEV__) {
      console.log('[RevenueCat] collectDeviceIdentifiers skipped (already sent)');
    }
  } else {
    try {
      await Purchases.collectDeviceIdentifiers();
      await markRevenueCatAttributeSynced(RC_DEVICE_IDENTIFIERS_SYNCED_KEY);
      console.log('[RevenueCat] collectDeviceIdentifiers ok');
    } catch (error) {
      if (shouldTreatRevenueCatAttributeErrorAsSynced(error)) {
        await markRevenueCatAttributeSynced(RC_DEVICE_IDENTIFIERS_SYNCED_KEY);
      }
      console.warn('[RevenueCat] collectDeviceIdentifiers failed', error);
    }
  }

  if (await hasRevenueCatAttributeBeenSynced(RC_FB_ANON_ID_SYNCED_KEY)) {
    if (__DEV__) {
      console.log('[RevenueCat] setFBAnonymousID skipped (already sent)');
    }
    return;
  }

  try {
    const fbAnonId = await AppEventsLogger.getAnonymousID();
    if (!fbAnonId) {
      return;
    }

    await Purchases.setFBAnonymousID(fbAnonId);
    await markRevenueCatAttributeSynced(RC_FB_ANON_ID_SYNCED_KEY);
    console.log(
      '[RevenueCat] setFBAnonymousID ok',
      fbAnonId.slice(0, 8) + '...',
    );
  } catch (error) {
    if (shouldTreatRevenueCatAttributeErrorAsSynced(error)) {
      await markRevenueCatAttributeSynced(RC_FB_ANON_ID_SYNCED_KEY);
    }
    console.warn('[RevenueCat] setFBAnonymousID failed', error);
  }
}

// 👇 Remplace par l'ID EXACT de ton entitlement dans RC (ex: "Accès à SOBRE." s'il n'y a pas d'ID technique)
export const ENTITLEMENT_ID = 'Accès à SOBRE.';

// Web Purchase Links (à remplacer par vos vrais liens)
export const WEB_PURCHASE_LINK_PROMO =
  "<<COLLER ICI le Web Purchase Link de l'offering promo>>";
export const WEB_PURCHASE_LINK_DEFAULT =
  "<<COLLER ICI le Web Purchase Link de l'offering default>>";

export async function initRevenueCat(userId?: string): Promise<boolean> {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - skipping initialization');
    return false;
  }

  const canonicalUserId = String(userId || '').trim();
  if (REQUIRE_RC_APP_USER_ID && !canonicalUserId) {
    console.warn(
      '[RevenueCat] Missing canonical userId. Refusing anonymous configure.',
    );
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
  installCustomRevenueCatLogHandler();

  initPromise = (async () => {
    try {
      if (!runtimeReadyPromise) {
        runtimeReadyPromise = new Promise((resolve) => {
          let resolved = false;
          let subscription: { remove?: () => void } | undefined;
          let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

          const finalizeResolve = () => {
            if (resolved) return;
            resolved = true;
            subscription?.remove?.();
            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
              fallbackTimer = null;
            }
            resolve();
          };

          const run = () => {
            if (resolved) return;
            InteractionManager.runAfterInteractions(() => {
              finalizeResolve();
            });
          };

          if (AppState.currentState === 'active') {
            run();
          } else {
            subscription = AppState.addEventListener?.(
              'change',
              (state) => {
                if (state === 'active') {
                  run();
                }
              },
            );
          }

          // Guard against rare AppState / InteractionManager stalls.
          fallbackTimer = setTimeout(() => {
            finalizeResolve();
          }, 1500);
        });
      }

      await runtimeReadyPromise;

      await Purchases.configure({
        apiKey,
        appUserID: canonicalUserId || undefined,
      });
      purchasesConfigured = true;
      didConfigure = true;
      activeRevenueCatAppUserId = canonicalUserId || null;
      console.log('[RevenueCat] configure ok');

      if (!canonicalUserId) {
        console.log('[RevenueCat] skipping subscriber attributes sync (no confirmed app user id)');
        return true;
      }

      // Bridge device identifiers so RevenueCat can share attribution
      // data with Meta (IDFA when ATT granted, IDFV always).
      await syncRevenueCatStaticSubscriberAttributesOnce();

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

// Track whether we've already sent a Meta conversion for this session
// to avoid duplicate events when the listener fires multiple times.
let lastMetaConversionProductId: string | null = null;

export function onCustomerInfoChange(
  cb: (hasAccess: boolean, info: CustomerInfo) => void,
) {
  if (!ENABLE_REVENUECAT) {
    console.log('RevenueCat disabled - no customer info updates');
    return () => {}; // Return empty unsubscribe function
  }

  if (!purchasesConfigured) {
    return () => {};
  }

  try {
    const listener = (info: CustomerInfo) => {
      logCustomerInfo('listener', info);
      const hasAccess = Boolean(info.entitlements?.active?.[ENTITLEMENT_ID]);

      // ── Forward subscription state changes to Meta ──
      // This catches trial-to-paid conversions and renewals that happen
      // in the background (e.g., Apple processes the charge overnight).
      if (hasAccess) {
        try {
          const ent = info.entitlements?.active?.[ENTITLEMENT_ID];
          const productId = ent?.productIdentifier ?? 'unknown';
          const periodType = ent?.periodType; // 'normal' | 'trial' | 'intro'

          // Only send once per product to avoid duplicate events in the same session
          if (productId !== lastMetaConversionProductId) {
            lastMetaConversionProductId = productId;

            if (periodType === 'normal') {
              // Paid period — full subscription
              logMetaSubscribe({ productId });
              logMetaPurchase(0, 'EUR', { productId });
              console.log('[RevenueCat→Meta] listener: Subscribe', {
                productId,
              });
            }
            // trial/intro events are already sent in presentPaywallAndTrack
          }
        } catch (metaErr) {
          console.warn('[RevenueCat→Meta] listener event failed', metaErr);
        }
      }

      cb(hasAccess, info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
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
    console.log(
      'RevenueCat disabled - returning null for getLatestCustomerInfo',
    );
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

  const offeringId =
    typeof offering?.identifier === 'string' ? offering.identifier : undefined;
  if (offeringId) {
    payload.offering_id = offeringId;
  }

  const paywallId =
    (typeof offering?.paywall?.identifier === 'string'
      ? offering.paywall.identifier
      : undefined) ||
    (typeof offering?.metadata?.paywall_id === 'string'
      ? offering.metadata.paywall_id
      : undefined);

  if (paywallId) {
    payload.paywall_id = paywallId;
  }

  return payload;
}

async function presentPaywallAndTrack(
  params: { offering?: any; displayCloseButton?: boolean },
  tracking?: PaywallTrackingContext,
) {
  paywallPresentationInProgress = true;

  try {
    const offeringId =
      typeof params?.offering?.identifier === 'string'
        ? params.offering.identifier
        : undefined;

    logMetaInitiateCheckout({
      placement: tracking?.placement,
      offeringId,
    });

    const result = await PurchasesUI.presentPaywall(params);
    const payload = buildPaywallTrackingPayload(
      result,
      tracking,
      params?.offering,
    );

    await capturePostHogEvent('paywall_result', payload);

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await capturePostHogEvent('paywall_converted', payload);

      try {
        const info = await Purchases.getCustomerInfo();
        const activeEntitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];

        if (activeEntitlement) {
          const productId = activeEntitlement.productIdentifier;
          const periodType = activeEntitlement.periodType; // 'normal' | 'trial' | 'intro'
          const latestPrice = (activeEntitlement as any)?.latestPurchaseDateMillis
            ? 0
            : 0;

          if (periodType === 'trial' || periodType === 'intro') {
            logMetaStartTrial({ productId, offeringId });
            console.log('[RevenueCat->Meta] StartTrial', {
              productId,
              periodType,
            });
          } else {
            logMetaSubscribe({ productId, offeringId });
            console.log('[RevenueCat->Meta] Subscribe', { productId, periodType });
          }

          logMetaPurchase(0, 'EUR', { productId, offeringId });
        }
      } catch (metaErr) {
        console.warn(
          '[RevenueCat->Meta] Failed to send conversion events',
          metaErr,
        );
      }
    }

    return result;
  } finally {
    paywallPresentationInProgress = false;
  }
}

// Paywall standard (offering "default")
export async function showDefaultPaywall(
  tracking?: PaywallTrackingContext,
): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show default paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('default');
  try {
    await markPaywallOpenedForAbandonReminders();
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    if (
      !CAN_USE_NATIVE_PAYWALL ||
      typeof PurchasesUI?.presentPaywall !== 'function'
    ) {
      console.warn(
        'Native paywall UI unavailable, falling back to web purchase flow',
      );
      await openWebPurchase('default');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    const offerings = await Purchases.getOfferings();
    const mainOffering = offerings.all?.main;

    const result = mainOffering
      ? await presentPaywallAndTrack(
          { offering: mainOffering, displayCloseButton: false },
          tracking,
        )
      : await presentPaywallAndTrack({ displayCloseButton: false }, tracking);

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await clearPaywallAbandonState();
      await cancelPaywallAbandonReminders();
      await schedulePostPurchaseBlockersReminder();
    } else {
      await markPaywallClosedWithoutPurchaseForAbandonReminders();
    }

    return result;
  } catch (error) {
    console.warn('Paywall default error', error);
    await promoEvents.purchaseCancel('default');
    await markPaywallClosedWithoutPurchaseForAbandonReminders();
    return PAYWALL_RESULT.ERROR;
  }
}

// Paywall promo (offering "promo")
export async function showPromoPaywall(
  tracking?: PaywallTrackingContext,
): Promise<PAYWALL_RESULT> {
  if (!ENABLE_REVENUECAT) {
    console.warn('RevenueCat disabled - cannot show promo paywall');
    return PAYWALL_RESULT.NOT_PRESENTED;
  }

  await promoEvents.paywallOpen('promo');
  try {
    await markPaywallOpenedForAbandonReminders();
    if (!purchasesConfigured && !(await ensurePurchasesConfigured())) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    if (
      !CAN_USE_NATIVE_PAYWALL ||
      typeof PurchasesUI?.presentPaywall !== 'function'
    ) {
      console.warn(
        'Native paywall UI unavailable, falling back to web purchase flow',
      );
      await openWebPurchase('promo');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    const offerings = await Purchases.getOfferings();
    const promoOffering = offerings.all?.promo;

    let result: PAYWALL_RESULT;
    if (!promoOffering) {
      console.warn(
        'Promo offering not configured, falling back to default paywall',
      );
      result = await presentPaywallAndTrack(
        { displayCloseButton: true },
        tracking,
      );
    } else {
      result = await presentPaywallAndTrack(
        { offering: promoOffering, displayCloseButton: true },
        tracking,
      );
    }

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await clearPaywallAbandonState();
      await cancelPaywallAbandonReminders();
      await schedulePostPurchaseBlockersReminder();
    } else {
      await markPaywallClosedWithoutPurchaseForAbandonReminders();
    }

    return result;
  } catch (error) {
    console.warn('Paywall promo error', error);
    await promoEvents.purchaseCancel('promo');
    await markPaywallClosedWithoutPurchaseForAbandonReminders();
    return PAYWALL_RESULT.ERROR;
  }
}

// Fallback web pour les paiements
export async function openWebPurchase(offering: 'promo' | 'default') {
  await promoEvents.webPurchaseClick(offering);
  const url =
    offering === 'promo' ? WEB_PURCHASE_LINK_PROMO : WEB_PURCHASE_LINK_DEFAULT;
  if (
    url &&
    url !== `<<COLLER ICI le Web Purchase Link de l'offering ${offering}>>`
  ) {
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
    console.warn("Impossible d'ouvrir la gestion d'abonnement:", error);
  }
}

