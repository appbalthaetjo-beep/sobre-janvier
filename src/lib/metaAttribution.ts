import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import { initMetaSdk } from '@/lib/metaSdk';

export async function syncRevenueCatFacebookAnonId() {
  if (Platform.OS !== 'ios') {
    console.log('[MetaAttribution] Skip FB anonymous ID sync (platform not supported)', Platform.OS);
    return;
  }

  if (
    typeof Purchases?.collectDeviceIdentifiers !== 'function' &&
    typeof Purchases?.setFBAnonymousID !== 'function'
  ) {
    console.log('[MetaAttribution] RevenueCat identifiers not available, skipping');
    return;
  }

  try {
    await initMetaSdk();

    if (typeof Purchases?.collectDeviceIdentifiers === 'function') {
      await Purchases.collectDeviceIdentifiers();
    }

    const anonId =
      typeof AppEventsLogger?.getAnonymousID === 'function'
        ? await AppEventsLogger.getAnonymousID()
        : null;

    if (!anonId) {
      console.log('[MetaAttribution] Anonymous ID missing, skipping setFBAnonymousID');
      return;
    }

    if (typeof Purchases?.setFBAnonymousID === 'function') {
      await Purchases.setFBAnonymousID(anonId);
    }

    console.log('[MetaAttribution] Synced FB anonymous ID with RevenueCat');
  } catch (error) {
    console.warn('[MetaAttribution] Failed to sync FB anonymous ID', error);
  }
}
