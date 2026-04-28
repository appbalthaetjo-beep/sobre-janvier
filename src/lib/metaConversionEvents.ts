import { Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';

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

export function logMetaPurchase(
  revenue: number,
  currency: string = 'EUR',
  extra?: { productId?: string; offeringId?: string },
) {
  const params: Record<string, string> = {};
  if (extra?.productId) params.fb_content_id = extra.productId;
  if (extra?.offeringId) params.fb_order_id = extra.offeringId;
  safeLogEvent('fb_mobile_purchase', revenue > 0 ? revenue : undefined, params);
}

export function logMetaStartTrial(extra?: {
  productId?: string;
  offeringId?: string;
  trialDuration?: string;
}) {
  const params: Record<string, string> = {};
  if (extra?.productId) params.fb_content_id = extra.productId;
  if (extra?.offeringId) params.fb_order_id = extra.offeringId;
  if (extra?.trialDuration) params.fb_num_items = extra.trialDuration;
  safeLogEvent('fb_mobile_start_trial', undefined, params);
}

export function logMetaSubscribe(extra?: {
  productId?: string;
  offeringId?: string;
  revenue?: number;
  currency?: string;
}) {
  const params: Record<string, string> = {};
  if (extra?.productId) params.fb_content_id = extra.productId;
  if (extra?.offeringId) params.fb_order_id = extra.offeringId;
  safeLogEvent('fb_mobile_subscribe', extra?.revenue ?? undefined, params);
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
