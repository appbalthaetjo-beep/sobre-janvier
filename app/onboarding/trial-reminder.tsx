import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { linkRevenueCatUser } from '@/lib/auth/revenuecatAuth';
import { logMetaCompleteRegistration } from '@/src/lib/metaConversionEvents';
import { trackOnboardingScreen } from '@/src/lib/posthog';
import {
  initRevenueCat,
  isProActive,
  isRevenueCatEnabled,
  showDefaultPaywall,
} from '@/src/lib/revenuecat';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';

const PAYWALL_ONBOARDING_STEP = 38;
const PAYWALL_ONBOARDING_CONTEXT = {
  step: PAYWALL_ONBOARDING_STEP,
  placement: 'onboarding',
  source: 'trial_reminder',
};
const ONBOARDING_GUEST_RC_USER_ID_KEY = 'onboardingGuestRevenueCatUserId';
const RC_INIT_TIMEOUT_MS = 10000;

export default function TrialReminderScreen() {
  const { triggerTap } = useHaptics();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleBack = () => {
    triggerTap('light');
    if (router.canGoBack()) router.back();
  };

  const markOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    await setShouldShowOnboardingFlag(false);
  };

  const ensureSobrietyData = async () => {
    const existingSobrietyData = await AsyncStorage.getItem('sobrietyData');
    if (existingSobrietyData) return;

    const originalSignupDate = new Date().toISOString();
    await AsyncStorage.setItem('originalSignupDate', originalSignupDate);

    const sobrietyData = {
      startDate: new Date().toISOString(),
      originalSignupDate,
      daysSober: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalRelapses: 0,
      relapseHistory: [],
    };

    await AsyncStorage.setItem('sobrietyData', JSON.stringify(sobrietyData));
  };

  const resolveRevenueCatUserId = async () => {
    const canonicalUserId = String(user?.uid || '').trim();
    if (canonicalUserId) {
      return canonicalUserId;
    }

    const existingGuestId = String(
      (await AsyncStorage.getItem(ONBOARDING_GUEST_RC_USER_ID_KEY)) || '',
    ).trim();
    if (existingGuestId) {
      return existingGuestId;
    }

    const generatedGuestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(ONBOARDING_GUEST_RC_USER_ID_KEY, generatedGuestId);
    return generatedGuestId;
  };

  const navigateToApp = () => {
    router.replace('/(tabs)');
  };

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race<T>([
        promise,
        new Promise<T>((resolve) => {
          timeoutId = setTimeout(() => resolve(fallback), ms);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const handleContinue = async () => {
    if (isLoading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    triggerTap('medium');

    try {
      await ensureSobrietyData();

      if (isRevenueCatEnabled()) {
        const canonicalUserId = await resolveRevenueCatUserId();
        let paywallResult = PAYWALL_RESULT.NOT_PRESENTED;
        let revenueCatReady = false;

        try {
          revenueCatReady = await withTimeout(
            initRevenueCat(canonicalUserId),
            RC_INIT_TIMEOUT_MS,
            false,
          );
          if (revenueCatReady) {
            await withTimeout(
              linkRevenueCatUser(canonicalUserId, 'onboarding_trial_reminder'),
              5000,
              undefined,
            );
          }
        } catch (error) {
          console.warn('RevenueCat init failed before paywall', error);
        }

        if (!revenueCatReady) {
          Alert.alert(
            'Paiement indisponible',
            'Impossible d’ouvrir les offres pour le moment. Réessaie dans quelques instants.',
          );
          return;
        }

        void trackOnboardingScreen({
          screen_name: 'paywall',
          ...PAYWALL_ONBOARDING_CONTEXT,
        });

        try {
          paywallResult = await showDefaultPaywall(PAYWALL_ONBOARDING_CONTEXT);
        } catch (error) {
          console.warn('Default paywall presentation failed', error);
        }

        const hasAccess =
          paywallResult === PAYWALL_RESULT.PURCHASED ||
          paywallResult === PAYWALL_RESULT.RESTORED ||
          (await withTimeout(isProActive(), 5000, false));
        if (!hasAccess) {
          Alert.alert(
            'Accès requis',
            'Tu peux continuer après avoir finalisé ton essai gratuit / abonnement.',
          );
          return;
        }
      }

      await markOnboardingComplete();
      logMetaCompleteRegistration({ method: 'onboarding' });
      navigateToApp();
    } catch (error) {
      console.error('TrialReminderScreen: failed to continue', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          On t’enverra un rappel{'\n'}avant la fin de ton essai gratuit
        </Text>

        <View style={styles.bellWrap}>
          <Ionicons
            name="notifications"
            size={132}
            color="rgba(255,255,255,0.16)"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>

        <View style={styles.bottomInfo}>
          <View style={styles.noPaymentRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.noPaymentText}>Aucun paiement maintenant</Text>
          </View>

          <TouchableOpacity
            style={styles.ctaWrapper}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>
                {isLoading ? 'Chargement…' : 'Continuer gratuitement'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Asset prefetch guard (keeps bundle stable even if image removed) */}
      <Image
        source={require('../../modules/expo-family-controls/ios/ShieldConfigurationExtension/sobre_shield_logo.png')}
        style={styles.hidden}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 86,
    paddingBottom: 42,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 32,
  },
  bellWrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  badge: {
    position: 'absolute',
    top: 22,
    right: 34,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  bottomInfo: {
    width: '100%',
    alignItems: 'center',
  },
  noPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  check: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.78)',
    marginTop: 1,
  },
  noPaymentText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.78)',
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  cta: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#6B4A00',
  },
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});

