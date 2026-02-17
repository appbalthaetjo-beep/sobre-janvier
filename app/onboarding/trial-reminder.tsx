import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { trackOnboardingScreen } from '@/src/lib/posthog';
import { initRevenueCat, isProActive, isRevenueCatEnabled, showDefaultPaywall } from '@/src/lib/revenuecat';

const PAYWALL_ONBOARDING_STEP = 38;
const PAYWALL_ONBOARDING_CONTEXT = {
  step: PAYWALL_ONBOARDING_STEP,
  placement: 'onboarding',
  source: 'trial_reminder',
};

export default function TrialReminderScreen() {
  const { triggerTap } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);

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

  const navigateToApp = () => {
    router.replace('/(tabs)');
  };

  const handleContinue = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerTap('medium');

    try {
      await ensureSobrietyData();

      if (isRevenueCatEnabled()) {
        try {
          await initRevenueCat();
        } catch (error) {
          console.warn('RevenueCat init failed before paywall', error);
        }

        void trackOnboardingScreen({ screen_name: 'paywall', ...PAYWALL_ONBOARDING_CONTEXT });

        try {
          await showDefaultPaywall(PAYWALL_ONBOARDING_CONTEXT);
        } catch (error) {
          console.warn('Default paywall presentation failed', error);
        }

        const hasAccess = await isProActive();
        if (!hasAccess) {
          Alert.alert(
            'Accès requis',
            'Tu peux continuer après avoir finalisé ton essai gratuit / abonnement.',
          );
          return;
        }
      }

      await markOnboardingComplete();
      navigateToApp();
    } catch (error) {
      console.error('TrialReminderScreen: failed to continue', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>On t’enverra un rappel{'\n'}avant la fin de ton essai gratuit</Text>

        <View style={styles.bellWrap}>
          <Ionicons name="notifications" size={132} color="rgba(255,255,255,0.16)" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>

        <View style={styles.bottomInfo}>
          <View style={styles.noPaymentRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.noPaymentText}>Aucun paiement maintenant</Text>
          </View>

          <TouchableOpacity style={styles.ctaWrapper} onPress={handleContinue} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{isLoading ? 'Chargement…' : 'Continuer gratuitement'}</Text>
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
