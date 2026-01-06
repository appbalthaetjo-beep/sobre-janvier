import { Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import Purchases from 'react-native-purchases';

export async function syncRevenueCatFacebookAnonId() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    console.log('[MetaAttribution] Skip FB anonymous ID sync (platform not supported)', Platform.OS);
    return;
  }

  if (typeof Purchases?.setFBAnonymousID !== 'function') {
    console.log('[MetaAttribution] setFBAnonymousID unavailable on Purchases, skipping');
    return;
  }

  try {
    const anonId = typeof AppEventsLogger?.getAnonymousID === 'function' ? await AppEventsLogger.getAnonymousID() : null;
    console.log('[MetaAttribution] Fetched FB anonymous ID', anonId);

    if (!anonId) {
      console.log('[MetaAttribution] Anonymous ID missing, skipping setFBAnonymousID');
      return;
    }

    await Purchases.setFBAnonymousID(anonId);
    console.log('[MetaAttribution] Synced FB anonymous ID with RevenueCat');
  } catch (error) {
    console.warn('[MetaAttribution] Failed to sync FB anonymous ID', error);
  }
}
