import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim() ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() ?? '';

let client: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

function isIos() {
  return Platform.OS === 'ios';
}

export async function initPostHog(): Promise<PostHog | null> {
  if (!isIos()) {
    return null;
  }

  if (!POSTHOG_API_KEY || !POSTHOG_HOST) {
    console.warn('[PostHog] Missing API key or host, skipping init');
    return null;
  }

  if (client) {
    return client;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const instance = new PostHog(POSTHOG_API_KEY, {
          host: POSTHOG_HOST,
          autocapture: {
            // expo-router requires manual screen tracking
            captureScreens: false,
          },
          captureAppLifecycleEvents: true,
          enableSessionReplay: true,
          sessionReplayConfig: {
            maskAllTextInputs: true,
            maskAllImages: true,
            captureNetworkTelemetry: true,
          },
          errorTracking: {
            autocapture: {
              console: true,
              uncaughtExceptions: true,
              unhandledRejections: true,
            },
          },
          // Persist session to avoid fragmenting funnels during onboarding
          enablePersistSessionIdAcrossRestart: true,
        });

        client = instance;
        return instance;
      } catch (error) {
        console.warn('[PostHog] Init failed', error);
        return null;
      } finally {
        initPromise = null;
      }
    })();
  }

  const instance = await initPromise;
  if (instance) {
    client = instance;
  }
  return client;
}

type OnboardingScreenPayload = {
  step: number;
  screen_name: string;
};

export async function trackOnboardingScreen(payload: OnboardingScreenPayload) {
  if (!payload?.screen_name || typeof payload.step !== 'number') {
    return;
  }
  const instance = await initPostHog();
  if (!instance) {
    return;
  }
  instance.capture('onboarding_screen_viewed', {
    step: payload.step,
    screen_name: payload.screen_name,
  });
}

export async function identifyPostHogUser(userId: string | null | undefined) {
  if (!userId) {
    const instance = await initPostHog();
    instance?.reset?.();
    return;
  }

  const instance = await initPostHog();
  if (!instance) {
    return;
  }

  instance.identify(userId);
}
