import { Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';

// ─── Standard Meta Event Names ────────────────────────────────────────────────
// Using the exact names that Meta recognises for optimisation & attribution.
//
// IMPORTANT: "Log in-app events automatically" is ENABLED in Meta's dashboard.
// This means Meta already auto-logs Purchase, Subscribe, and StartTrial events
// from App Store receipts.
//
// Only events that are NOT auto-logged (InitiateCheckout, CompleteRegistration)
// should be sent manually via the SDK.
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
 * No-op: "Log in-app events automatically" is enabled in Meta's dashboard,
 * so purchase events are auto-logged from App Store / Google Play receipts.
 * Manually logging them causes duplicate events and attribution issues.
 */
export function logMetaPurchase(
  _revenue: number,
  _currency: string = 'EUR',
  _extra?: { productId?: string; offeringId?: string },
) {
  // Intentionally empty — auto-logged by Meta dashboard.
}

/**
 * No-op: "Log in-app events automatically" is enabled in Meta's dashboard,
 * so StartTrial events are auto-logged from App Store / Google Play receipts.
 * Manually logging them causes duplicate events and attribution issues.
 */
export function logMetaStartTrial(_extra?: {
  productId?: string;
  offeringId?: string;
  trialDuration?: string;
}) {
  // Intentionally empty — auto-logged by Meta dashboard.
}

/**
 * No-op: "Log in-app events automatically" is enabled in Meta's dashboard,
 * so Subscribe events are auto-logged from App Store / Google Play receipts.
 * Manually logging them causes duplicate events and attribution issues.
 */
export function logMetaSubscribe(_extra?: {
  productId?: string;
  offeringId?: string;
  revenue?: number;
  currency?: string;
}) {
  // Intentionally empty — auto-logged by Meta dashboard.
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
