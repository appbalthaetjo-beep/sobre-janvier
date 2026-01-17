import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

let didInit = false;

export function initMetaSdk() {
  if (didInit) return;
  didInit = true;

  try {
    if (Platform.OS === 'web') {
      console.log('[MetaSDK] skip init on web');
      return;
    }

    Settings.setAutoLogAppEventsEnabled?.(false);
    Settings.setAdvertiserIDCollectionEnabled?.(true);

    const appId = Settings.getAppID?.();
    console.log('[MetaSDK] Settings.getAppID()', appId);
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
