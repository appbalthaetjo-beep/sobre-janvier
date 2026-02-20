import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

const FACEBOOK_APP_ID = '2293641301112058';
let didInit = false;

export function initMetaSdk() {
  if (didInit) return;
  didInit = true;

  try {
    if (Platform.OS === 'web') {
      console.log('[MetaSDK] skip init on web');
      return;
    }

    // Ensure the App ID is set before any other SDK call.
    Settings.setAppID(FACEBOOK_APP_ID);
    Settings.initializeSDK?.();

    // Auto-log must be ON for SKAdNetwork install attribution to work.
    Settings.setAutoLogAppEventsEnabled?.(true);

    // Advertiser tracking / ID collection will be set properly once ATT
    // status is known (see metaAppEvents.ts).  We do NOT force them to
    // `false` here; the SDK defaults to respecting the device ATT setting.

    console.log('[MetaSDK] initialised — appId =', FACEBOOK_APP_ID);
  } catch (e) {
    console.warn('[MetaSDK] init error', e);
  }
}

export async function initMetaOnce() {
  initMetaSdk();
}

export async function sendMetaTestEvent() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    AppEventsLogger.setFlushBehavior?.('explicit_only');
    AppEventsLogger.logEvent('test_event', {
      ts: String(Date.now()),
      build: __DEV__ ? 'debug' : 'release',
    });
    AppEventsLogger.flush?.();
    console.log('[META] ✅ test_event sent + flushed');
  } catch (error) {
    console.warn('[META] failed to send test_event', error);
  }
}
