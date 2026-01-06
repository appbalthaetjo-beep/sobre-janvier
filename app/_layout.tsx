import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useMetaAppEvents } from '@/hooks/useMetaAppEvents';
import { usePostHogInit } from '@/hooks/usePostHogInit';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/useAuth';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { router } from 'expo-router';
import SplashScreenComponent from '@/components/SplashScreen';
import { Linking, Platform, View } from 'react-native';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import FeedbackModalHost from '@/components/FeedbackModalHost';
import { readShouldShowOnboardingFlag, subscribeShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { recordNavigationEvent } from '@/utils/diagnostics';
import { trackOnboardingScreen } from '../lib/posthog';
import { initSobrietyStorageCompat } from '@/lib/storageCompat';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { initMetaDiagnostics } from '@/lib/metaDiagnostics';
import { initMetaSdk } from '@/lib/metaSdk';

const ONBOARDING_STEPS: { path: string; screen_name: string }[] = [
  { path: '/onboarding/index', screen_name: 'welcome' },
  { path: '/onboarding/auth', screen_name: 'auth' },
  { path: '/onboarding/story', screen_name: 'story' },
  { path: '/onboarding/sobriety-card', screen_name: 'sobriety_card' },
  { path: '/onboarding/question-1', screen_name: 'question_1' },
  { path: '/onboarding/question-2', screen_name: 'question_2' },
  { path: '/onboarding/question-3', screen_name: 'question_3' },
  { path: '/onboarding/question-4', screen_name: 'question_4' },
  { path: '/onboarding/question-5', screen_name: 'question_5' },
  { path: '/onboarding/question-6', screen_name: 'question_6' },
  { path: '/onboarding/question-7', screen_name: 'question_7' },
  { path: '/onboarding/question-8', screen_name: 'question_8' },
  { path: '/onboarding/question-9', screen_name: 'question_9' },
  { path: '/onboarding/question-10', screen_name: 'question_10' },
  { path: '/onboarding/personal-data', screen_name: 'personal_data' },
  { path: '/onboarding/loading', screen_name: 'loading' },
  { path: '/onboarding/results', screen_name: 'results' },
  { path: '/onboarding/testimonials', screen_name: 'testimonials' },
  { path: '/onboarding/symptoms', screen_name: 'symptoms' },
  { path: '/onboarding/slide-1', screen_name: 'slide_1' },
  { path: '/onboarding/slide-2', screen_name: 'slide_2' },
  { path: '/onboarding/slide-3', screen_name: 'slide_3' },
  { path: '/onboarding/slide-4', screen_name: 'slide_4' },
  { path: '/onboarding/rewiring-advantages', screen_name: 'rewiring_advantages' },
  { path: '/onboarding/commitment-signature', screen_name: 'commitment_signature' },
  { path: '/onboarding/slide-5', screen_name: 'slide_5' },
  { path: '/onboarding/slide-6', screen_name: 'slide_6' },
  { path: '/onboarding/slide-7', screen_name: 'slide_7' },
  { path: '/onboarding/slide-8', screen_name: 'slide_8' },
  { path: '/onboarding/slide-9', screen_name: 'slide_9' },
  { path: '/onboarding/slide-10', screen_name: 'slide_10' },
  { path: '/onboarding/slide-11', screen_name: 'slide_11' },
  { path: '/onboarding/personal-goals', screen_name: 'personal_goals' },
  { path: '/onboarding/referral-code', screen_name: 'referral_code' },
  { path: '/onboarding/personalized-summary', screen_name: 'personalized_summary' },
  { path: '/onboarding/plan-story', screen_name: 'plan_story' },
];

const ONBOARDING_STEP_MAP = ONBOARDING_STEPS.reduce<Record<string, { step: number; screen_name: string }>>(
  (acc, item, index) => {
    acc[item.path] = { step: index + 1, screen_name: item.screen_name };
    return acc;
  },
  {},
);

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  useFrameworkReady();
  usePostHogInit();
  useMetaAppEvents();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { isLoading: rcLoading } = useRevenueCat();
  const [showSplash, setShowSplash] = useState(true);
  const [pendingOnboarding, setPendingOnboarding] = useState<boolean | null>(null);
  const sobrietyCompatDidInitRef = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const fbDebugInitRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (fbDebugInitRef.current) {
      return;
    }
    fbDebugInitRef.current = true;

    (async () => {
      try {
        await initMetaSdk();
        console.log('[FB DEBUG] FB SDK LOADED');
        console.log('[FB DEBUG] getAppID (before set)', Settings.getAppID?.());
        Settings.setAppID('2293641301112058');
        console.log('[FB DEBUG] getAppID (after set)', Settings.getAppID?.());
        await Settings.initializeSDK();
        console.log('[FB DEBUG] FB SDK INITIALIZED');
        AppEventsLogger.logEvent('debug_test_event');
        console.log('[FB DEBUG] FB EVENT SENT');
        await initMetaDiagnostics();
      } catch (error) {
        console.warn('[FB DEBUG] Failed to init/send event', error);
      }
    })();
  }, []);

  useEffect(() => {
    const globalScope = globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: any, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: any, isFatal?: boolean) => void) => void;
      };
    } & {
      __SOBRE_ERROR_HANDLER__?: boolean;
    };

    const errorUtils = globalScope.ErrorUtils;

    if (typeof errorUtils?.getGlobalHandler === 'function' && !globalScope.__SOBRE_ERROR_HANDLER__) {
      const originalHandler = errorUtils.getGlobalHandler?.();
      errorUtils.setGlobalHandler?.((error: any, isFatal?: boolean) => {
        console.error('[GLOBAL ERROR HANDLER]', error?.message || error, { isFatal, platform: Platform.OS, stack: error?.stack });
        if (typeof originalHandler === 'function') {
          try {
            originalHandler(error, isFatal);
          } catch (handlerError) {
            console.error('[GLOBAL ERROR HANDLER] Original handler failed', handlerError);
          }
        }
      });
      globalScope.__SOBRE_ERROR_HANDLER__ = true;
    }
  }, []);

  useEffect(() => {
    const globalScope = globalThis as typeof globalThis & { onunhandledrejection?: (event: any) => void } & {
      addEventListener?: (event: string, handler: (event: any) => void) => void;
      removeEventListener?: (event: string, handler: (event: any) => void) => void;
    };

    const handler = (event: any) => {
      const reason = event?.reason ?? event;
      console.error('[UNHANDLED PROMISE REJECTION]', reason?.message || reason, reason);
    };

    let cleanup: (() => void) | undefined;

    try {
      if (typeof globalScope.addEventListener === 'function' && typeof globalScope.removeEventListener === 'function') {
        globalScope.addEventListener('unhandledrejection', handler);
        cleanup = () => globalScope.removeEventListener?.('unhandledrejection', handler);
      } else {
        const previous = globalScope.onunhandledrejection;
        globalScope.onunhandledrejection = (event: any) => {
          handler(event);
          if (typeof previous === 'function') {
            previous(event);
          }
        };
        cleanup = () => {
          globalScope.onunhandledrejection = previous;
        };
      }
    } catch (error) {
      console.error('[GLOBAL ERROR HANDLER] Failed to attach unhandled rejection listener', error);
    }

    return () => {
      try {
        cleanup?.();
      } catch (error) {
        console.error('[GLOBAL ERROR HANDLER] Failed to detach unhandled rejection listener', error);
      }
    };
  }, []);

  useEffect(() => {
    let subscription: { remove?: () => void } | undefined;

    const logInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('[LINKING] initialURL', url ?? 'none');
      } catch (error) {
        console.error('[LINKING] Failed to get initial URL', error);
      }
    };

    logInitialUrl();

    try {
      subscription = Linking.addEventListener?.('url', (event) => {
        console.log('[LINKING] url event', event?.url);
      }) as unknown as { remove?: () => void };
    } catch (error) {
      console.error('[LINKING] Failed to attach url listener', error);
    }

    return () => {
      try {
        subscription?.remove?.();
      } catch (error) {
        console.error('[LINKING] Failed to detach url listener', error);
      }
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const loadFlag = async () => {
      if (!user) {
        setPendingOnboarding(null);
        return;
      }

      const value = await readShouldShowOnboardingFlag();
      setPendingOnboarding(value);
    };

    loadFlag();
  }, [user]);

  useEffect(() => {
    return subscribeShouldShowOnboardingFlag((value) => {
      setPendingOnboarding(value);
    });
  }, []);

  useEffect(() => {
    if (sobrietyCompatDidInitRef.current) {
      return;
    }
    sobrietyCompatDidInitRef.current = true;

    // Initialise le compat sobriété une seule fois pour éviter les boucles et pertes de streak.
    void initSobrietyStorageCompat().catch((error) => {
      if (__DEV__) {
        console.warn('[sobriety compat] init failed', error);
      }
    });
  }, []);

  const shouldShowOnboarding = useMemo(() => {
    if (!user) {
      return true;
    }

    if (pendingOnboarding !== null) {
      return pendingOnboarding;
    }

    const creationTime = user.metadata?.creationTime;
    const lastSignInTime = user.metadata?.lastSignInTime;

    if (!creationTime || !lastSignInTime) {
      return true;
    }

    return creationTime === lastSignInTime;
  }, [pendingOnboarding, user]);

  const isInOnboarding = pathname?.startsWith('/onboarding') ?? false;
  const isInTabs = pathname?.startsWith('/(tabs)') ?? false;

  useEffect(() => {
    if (!pathname) {
      return;
    }

    void recordNavigationEvent({
      path: pathname,
      action: 'focus',
      meta: { isInTabs, isInOnboarding },
    });

    if (pathname.startsWith('/onboarding')) {
      const match = ONBOARDING_STEP_MAP[pathname];
      if (match) {
        void trackOnboardingScreen(match);
      }
    }
  }, [pathname, isInTabs, isInOnboarding]);


  useEffect(() => {
    if (loading || !fontsLoaded || showSplash) {
      return;
    }

    if (!user) {
      if (!isInOnboarding) {
        void recordNavigationEvent({ path: '/onboarding', action: 'redirect_missing_user', meta: { previousPath: pathname ?? '(unknown)' } });
        router.replace('/onboarding');
      }
      return;
    }

    if (rcLoading) {
      return;
    }

    if (shouldShowOnboarding) {
      if (!isInOnboarding) {
        void recordNavigationEvent({ path: '/onboarding/sobriety-card', action: 'redirect_needs_onboarding', meta: { previousPath: pathname ?? '(unknown)' } });
        router.replace('/onboarding/sobriety-card');
      }
      return;
    }

    if (isInOnboarding) {
      void recordNavigationEvent({ path: '/(tabs)', action: 'exit_onboarding', meta: { previousPath: pathname ?? '(unknown)' } });
      router.replace('/(tabs)');
      return;
    }

    // Plus de redirection globale : on laisse les �crans modaux vivre leur vie.
  }, [user, loading, rcLoading, fontsLoaded, showSplash, shouldShowOnboarding, pathname, isInOnboarding, isInTabs]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (showSplash) {
    return (
      <SplashScreenComponent
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <GlobalErrorBoundary onReset={() => router.replace('/(tabs)') }>
      <View style={{ flex: 1 }}>
        <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/auth" />
          <Stack.Screen name="onboarding/story" />
          <Stack.Screen name="onboarding/sobriety-card" />
          <Stack.Screen name="onboarding/question-1" />
          <Stack.Screen name="onboarding/question-2" />
          <Stack.Screen name="onboarding/question-3" />
          <Stack.Screen name="onboarding/question-4" />
          <Stack.Screen name="onboarding/question-5" />
          <Stack.Screen name="onboarding/question-6" />
          <Stack.Screen name="onboarding/question-7" />
          <Stack.Screen name="onboarding/question-8" />
          <Stack.Screen name="onboarding/question-9" />
          <Stack.Screen name="onboarding/question-10" />
          <Stack.Screen name="onboarding/personal-data" />
          <Stack.Screen name="onboarding/loading" />
          <Stack.Screen name="onboarding/results" />
          <Stack.Screen name="onboarding/testimonials" />
          <Stack.Screen name="onboarding/symptoms" />
          <Stack.Screen name="onboarding/slide-1" />
          <Stack.Screen name="onboarding/slide-2" />
          <Stack.Screen name="onboarding/slide-3" />
          <Stack.Screen name="onboarding/slide-4" />
          <Stack.Screen name="onboarding/rewiring-advantages" />
          <Stack.Screen name="onboarding/commitment-signature" />
          <Stack.Screen name="onboarding/slide-5" />
          <Stack.Screen name="onboarding/slide-6" />
          <Stack.Screen name="onboarding/slide-7" />
          <Stack.Screen name="onboarding/slide-8" />
          <Stack.Screen name="onboarding/slide-9" />
          <Stack.Screen name="onboarding/slide-10" />
          <Stack.Screen name="onboarding/slide-11" />
          <Stack.Screen name="onboarding/personal-goals" />
          <Stack.Screen name="onboarding/referral-code" />
          <Stack.Screen name="onboarding/personalized-summary" />
          <Stack.Screen name="onboarding/plan-story" />
          <Stack.Screen name="commitment" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="emergency"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
              headerShown: false,
            }}
          />
          <Stack.Screen name="stay-sober" options={{ presentation: 'modal' }} />
          <Stack.Screen name="pause-mode" options={{ presentation: 'modal' }} />
          <Stack.Screen name="relapse" options={{ presentation: 'modal' }} />
          <Stack.Screen name="reasons" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-reason" options={{ presentation: 'modal' }} />
          <Stack.Screen name="reflect-reason" options={{ presentation: 'modal' }} />
          <Stack.Screen name="journal" />
          <Stack.Screen name="site-blocking" />
          <Stack.Screen name="edit-blacklist" />
          <Stack.Screen name="safe-browser" />
          <Stack.Screen name="challenges" />
          <Stack.Screen name="milestone-detail" />
          <Stack.Screen name="lesson-detail" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="terms-of-service" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="debug/billing" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <FeedbackModalHost />
        <StatusBar style="auto" />
      </View>
    </GlobalErrorBoundary>
  );
}

export default function RootLayout() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey((value) => value + 1);
  };

  const content = useMemo(() => <RootLayoutInner key={resetKey} />, [resetKey]);

  return (
    <GlobalErrorBoundary onReset={handleReset}>
      {content}
    </GlobalErrorBoundary>
  );
}


