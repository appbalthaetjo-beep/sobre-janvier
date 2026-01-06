import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { ENTITLEMENT_ID, getLatestCustomerInfo, initRevenueCat, onCustomerInfoChange } from '@/src/lib/revenuecat';
import type { CustomerInfo } from 'react-native-purchases';

const FACEBOOK_APP_ID = '2293641301112058';
const START_TRIAL_STORAGE_KEY = 'meta_last_start_trial_purchase';
const ATT_REQUESTED_KEY = 'meta_att_prompt_requested';

let facebookInitialized = false;
let activationLogged = false;

async function ensureFacebookInitialized(trackingStatus: string | null) {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (facebookInitialized) {
    return true;
  }

  try {
    Settings.setAppID(FACEBOOK_APP_ID);
    Settings.initializeSDK?.();

    if (trackingStatus) {
      await Settings.setAdvertiserTrackingEnabled(trackingStatus === 'granted');
    }

    facebookInitialized = true;
    return true;
  } catch (error) {
    console.warn('[MetaEvents] Failed to initialize Facebook SDK', error);
    return false;
  }
}

async function applyAdvertiserTrackingPreference(status: string | null) {
  if (Platform.OS !== 'ios' || !status) {
    return;
  }

  try {
    await ensureFacebookInitialized(status);
    await Settings.setAdvertiserTrackingEnabled(status === 'granted');
  } catch (error) {
    console.warn('[MetaEvents] Failed to sync advertiser tracking preference', error);
  }
}

async function requestTrackingPermissionOnce(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const alreadyRequested = await AsyncStorage.getItem(ATT_REQUESTED_KEY);
    const { status } = await getTrackingPermissionsAsync();

    if (status !== 'undetermined') {
      if (!alreadyRequested) {
        await AsyncStorage.setItem(ATT_REQUESTED_KEY, '1');
      }
      return status;
    }

    const response = await requestTrackingPermissionsAsync();
    await AsyncStorage.setItem(ATT_REQUESTED_KEY, '1');
    return response.status;
  } catch (error) {
    console.warn('[MetaEvents] Failed to request tracking permission', error);
    return null;
  }
}

async function logActivateAppOnce(trackingStatus: string | null) {
  if (Platform.OS !== 'ios' || activationLogged) {
    return;
  }

  const ready = await ensureFacebookInitialized(trackingStatus);
  if (!ready) {
    return;
  }

  activationLogged = true;

  try {
    AppEventsLogger.logEvent('fb_mobile_activate_app');
  } catch (error) {
    console.warn('[MetaEvents] Failed to log fb_mobile_activate_app', error);
  }
}

function getActiveTrial(info: CustomerInfo) {
  const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
  if (!entitlement) {
    return null;
  }

  const periodType = `${entitlement.periodType ?? ''}`.toUpperCase();
  const isTrialPeriod = periodType === 'TRIAL' || periodType === 'INTRO';
  if (!isTrialPeriod) {
    return null;
  }

  return {
    token:
      `${entitlement.productIdentifier ?? 'unknown'}:` +
      `${entitlement.latestPurchaseDateMillis ?? entitlement.latestPurchaseDate ?? info.requestDate}`,
    productId: entitlement.productIdentifier ?? 'unknown',
  };
}

async function maybeLogStartTrial(info: CustomerInfo) {
  if (Platform.OS !== 'ios') {
    return;
  }

  const trial = getActiveTrial(info);
  if (!trial) {
    return;
  }

  try {
    const lastLoggedToken = await AsyncStorage.getItem(START_TRIAL_STORAGE_KEY);
    if (lastLoggedToken === trial.token) {
      return;
    }

    const ready = await ensureFacebookInitialized(null);
    if (!ready) {
      return;
    }

    AppEventsLogger.logEvent('StartTrial', { productId: trial.productId });
    await AsyncStorage.setItem(START_TRIAL_STORAGE_KEY, trial.token);
  } catch (error) {
    console.warn('[MetaEvents] Failed to log StartTrial', error);
  }
}

export async function setupMetaAppEvents(): Promise<() => void> {
  if (Platform.OS !== 'ios') {
    return () => {};
  }

  try {
    const trackingStatus = await requestTrackingPermissionOnce();
    await applyAdvertiserTrackingPreference(trackingStatus);
    await logActivateAppOnce(trackingStatus);

    await initRevenueCat();
    const initialInfo = await getLatestCustomerInfo();
    if (initialInfo) {
      await maybeLogStartTrial(initialInfo);
    }

    const unsubscribe = onCustomerInfoChange((_, info) => {
      void maybeLogStartTrial(info);
    });

    return typeof unsubscribe === 'function' ? unsubscribe : () => {};
  } catch (error) {
    console.warn('[MetaEvents] setup failed', error);
    return () => {};
  }
}
