import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

let alreadyRan = false;

export async function initMetaDiagnostics() {
  if (alreadyRan) {
    return;
  }
  alreadyRan = true;

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    console.log('[MetaDiagnostics] Skip (platform not supported):', Platform.OS);
    return;
  }

  try {
    console.log('[MetaDiagnostics] Platform:', Platform.OS);
    console.log('[MetaDiagnostics] getAppID():', Settings.getAppID?.());
    const clientToken = (Settings as any)?.getClientToken?.();
    console.log('[MetaDiagnostics] getClientToken():', clientToken);
  } catch (error) {
    console.warn('[MetaDiagnostics] Failed to log appId/clientToken', error);
  }

  try {
    AppEventsLogger.logEvent('test_event');
    console.log('[MetaDiagnostics] test_event fired');
  } catch (eventError) {
    console.warn('[MetaDiagnostics] Failed to fire test_event', eventError);
  }
}
