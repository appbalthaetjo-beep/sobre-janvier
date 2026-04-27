import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import { Settings } from 'react-native-fbsdk-next';

// SDK initialisation (setAppID / initializeSDK / setAutoLogAppEventsEnabled)
// is handled exclusively by lib/metaSdk.ts → initMetaOnce().
// This module is responsible only for ATT permission and advertiser-tracking flags.
const ATT_REQUESTED_KEY = 'meta_att_prompt_requested';

async function applyAdvertiserTrackingFlags(trackingStatus: string | null) {
  if (Platform.OS !== 'ios') return;

  try {
    const enabled = trackingStatus === 'granted';
    await Settings.setAdvertiserTrackingEnabled(enabled);
    Settings.setAdvertiserIDCollectionEnabled?.(enabled);
    console.log('[MetaEvents] Advertiser tracking set to', enabled);
  } catch (error) {
    console.warn('[MetaEvents] Failed to set advertiser tracking flags', error);
  }
}

async function applyAdvertiserTrackingPreference(status: string | null) {
  if (Platform.OS !== 'ios' || !status) {
    return;
  }
  await applyAdvertiserTrackingFlags(status);
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

export async function setupMetaAppEvents(): Promise<() => void> {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await getTrackingPermissionsAsync();
      const trackingStatus =
        status && status !== 'undetermined' ? status : null;
      await applyAdvertiserTrackingPreference(trackingStatus);
    }
  } catch (error) {
    console.warn('[MetaEvents] setup failed', error);
  }
  return () => {};
}

export async function requestMetaTrackingPermission(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const trackingStatus = await requestTrackingPermissionOnce();
    await applyAdvertiserTrackingPreference(trackingStatus);
    return trackingStatus;
  } catch (error) {
    console.warn('[MetaEvents] ATT request failed', error);
    return null;
  }
}
