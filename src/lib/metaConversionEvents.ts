import { Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';

// ─── Standard Meta Event Names ────────────────────────────────────────────────
// Using the exact names that Meta recognises for optimisation & attribution.
const META_EVENT_START_TRIAL = 'StartTrial';
const META_EVENT_SUBSCRIBE = 'Subscribe';
const META_EVENT_INITIATE_CHECKOUT = 'fb_mobile_initiated_checkout';
const META_EVENT_COMPLETE_REGISTRATION = 'fb_mobile_complete_registration';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeLogEvent(
  eventName: string,
  valueToSum?: number,
  params?: Record<string, string>,
) {
  if (Platform.OS === 'web') return;

  try {
    if (valueToSum != null && valueToSum > 0) {
      AppEventsLogger.logPurchase(valueToSum, 'EUR', params);
      console.log(`[MetaConversion] ${eventName} (purchase)`, {
        valueToSum,
        ...params,
      });
    } else {
      AppEventsLogger.logEvent(eventName, params);
      console.log(`[MetaConversion] ${eventName}`, params);
    }
    AppEventsLogger.flush?.();
  } catch (error) {
    console.warn(`[MetaConversion] Failed to log ${eventName}`, error);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Log a purchase event to Meta.
 * Should be called after a successful subscription purchase or one-time payment.
 *
 * This triggers `fb_mobile_purchase` which Meta uses for:
 *  - Install attribution in Ads Manager
 *  - SKAdNetwork conversion value update
 *  - Value Optimisation campaigns
 */
export function logMetaPurchase(
  revenue: number,
  currency: string = 'EUR',
  extra?: { productId?: string; offeringId?: string },
) {
  if (Platform.OS === 'web') return;

  try {
    const params: Record<string, string> = {};
    if (extra?.productId) params.fb_content_id = extra.productId;
    if (extra?.offeringId) params.fb_content_type = extra.offeringId;

    // logPurchase is the canonical way to send revenue events to Meta.
    // It automatically maps to the `fb_mobile_purchase` standard event.
    AppEventsLogger.logPurchase(revenue, currency, params);
    AppEventsLogger.flush?.();
    console.log('[MetaConversion] fb_mobile_purchase', {
      revenue,
      currency,
      ...params,
    });
  } catch (error) {
    console.warn('[MetaConversion] Failed to log purchase', error);
  }
}

/**
 * Log a "Start Trial" event to Meta.
 * Should be called when a user begins a free trial.
 *
 * Maps to Meta's `StartTrial` standard event for AEO campaigns.
 */
export function logMetaStartTrial(extra?: {
  productId?: string;
  offeringId?: string;
  trialDuration?: string;
}) {
  const params: Record<string, string> = {};
  if (extra?.productId) params.fb_content_id = extra.productId;
  if (extra?.offeringId) params.fb_content_type = extra.offeringId;
  if (extra?.trialDuration) params.fb_description = extra.trialDuration;

  safeLogEvent(META_EVENT_START_TRIAL, undefined, params);
}

/**
 * Log a "Subscribe" event to Meta.
 * Should be called when the user's paid subscription actually activates
 * (after the trial ends, or immediately if no trial).
 *
 * Maps to Meta's `Subscribe` standard event for AEO campaigns.
 */
export function logMetaSubscribe(extra?: {
  productId?: string;
  offeringId?: string;
  revenue?: number;
  currency?: string;
}) {
  const params: Record<string, string> = {};
  if (extra?.productId) params.fb_content_id = extra.productId;
  if (extra?.offeringId) params.fb_content_type = extra.offeringId;

  safeLogEvent(META_EVENT_SUBSCRIBE, extra?.revenue, params);
}

/**
 * Log "Initiate Checkout" when the user opens the paywall.
 * Useful for building a conversion funnel in Meta Ads.
 */
export function logMetaInitiateCheckout(extra?: {
  placement?: string;
  offeringId?: string;
}) {
  const params: Record<string, string> = {};
  if (extra?.placement) params.fb_content_type = extra.placement;
  if (extra?.offeringId) params.fb_content_id = extra.offeringId;

  safeLogEvent(META_EVENT_INITIATE_CHECKOUT, undefined, params);
}

/**
 * Log "Complete Registration" when onboarding is finished.
 * Useful as a mid-funnel event for optimisation.
 */
export function logMetaCompleteRegistration(extra?: { method?: string }) {
  const params: Record<string, string> = {};
  if (extra?.method) params.fb_registration_method = extra.method;

  safeLogEvent(META_EVENT_COMPLETE_REGISTRATION, undefined, params);
}
