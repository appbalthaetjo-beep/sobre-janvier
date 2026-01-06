import { Platform } from 'react-native';
import { Settings } from 'react-native-fbsdk-next';

let didInit = false;

export function initMetaSdk() {
  if (didInit) return;
  didInit = true;

  try {
    if (Platform.OS === 'web') {
      console.log('[MetaSDK] skip init on web');
      return;
    }

    const appId = Settings.getAppID?.();
    console.log('[MetaSDK] Settings.getAppID()', appId);
  } catch (e) {
    console.warn('[MetaSDK] init error', e);
  }
}
