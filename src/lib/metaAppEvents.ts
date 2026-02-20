import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

const FACEBOOK_APP_ID = '2293641301112058';
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

    // Auto-log MUST be enabled for SKAdNetwork install postbacks.
    Settings.setAutoLogAppEventsEnabled?.(true);

    if (trackingStatus) {
      const enabled = trackingStatus === 'granted';
      await Settings.setAdvertiserTrackingEnabled(enabled);
      Settings.setAdvertiserIDCollectionEnabled?.(enabled);
      console.log('[MetaEvents] Advertiser tracking set to', enabled);
    } else {
      // Even without explicit ATT status, enable advertiser tracking flag
      // so Meta SDK can still register SKAdNetwork postbacks (privacy-safe).
      await Settings.setAdvertiserTrackingEnabled(false);
      Settings.setAdvertiserIDCollectionEnabled?.(false);
    }

    facebookInitialized = true;
    console.log('[MetaEvents] Facebook SDK initialized');
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
    const enabled = status === 'granted';
    await Settings.setAdvertiserTrackingEnabled(enabled);
    Settings.setAdvertiserIDCollectionEnabled?.(enabled);
  } catch (error) {
    console.warn(
      '[MetaEvents] Failed to sync advertiser tracking preference',
      error,
    );
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

export async function setupMetaAppEvents(): Promise<() => void> {
  if (Platform.OS !== 'ios') {
    return () => {};
  }

  try {
    const { status } = await getTrackingPermissionsAsync();
    const trackingStatus = status && status !== 'undetermined' ? status : null;
    await applyAdvertiserTrackingPreference(trackingStatus);
    await logActivateAppOnce(trackingStatus);
    return () => {};
  } catch (error) {
    console.warn('[MetaEvents] setup failed', error);
    return () => {};
  }
}

export async function requestMetaTrackingPermission(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const trackingStatus = await requestTrackingPermissionOnce();
    await applyAdvertiserTrackingPreference(trackingStatus);
    await logActivateAppOnce(trackingStatus);
    return trackingStatus;
  } catch (error) {
    console.warn('[MetaEvents] ATT request failed', error);
    return null;
  }
}
