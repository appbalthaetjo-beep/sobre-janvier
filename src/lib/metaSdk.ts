import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

let initialized = false;

export async function initMetaSdk() {
  if (initialized) {
    return;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  initialized = true;

  try {
    await Settings.initializeSDK?.();
    console.log('[MetaSDK] initialized');
  } catch (error) {
    console.warn('[MetaSDK] initializeSDK failed', error);
  }

  try {
    const appId = Settings.getAppID?.();
    const clientToken = (Settings as any)?.getClientToken?.();
    console.log('[MetaSDK] appId:', appId);
    console.log('[MetaSDK] clientToken:', clientToken);
  } catch (logError) {
    console.warn('[MetaSDK] failed to log appId/clientToken', logError);
  }

  try {
    AppEventsLogger.logEvent('test_event');
    console.log('[MetaSDK] test_event fired');
  } catch (eventError) {
    console.warn('[MetaSDK] failed to fire test_event', eventError);
  }
}
