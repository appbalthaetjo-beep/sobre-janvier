import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SobreLogo from '@/components/SobreLogo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { formatDateFrench } from '@/utils/date';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import {
  initRevenueCat,
  showDefaultPaywall,
  showPromoPaywall,
  isRevenueCatEnabled,
  isProActive,
} from '@/src/lib/revenuecat';

const PROMO_PAYWALL_DELAY_MS = 5000;
const PROMO_PAYWALL_AUTO_ENABLED = false; // Toggle to true to re-enable automatic promo paywall triggers

type RoadmapItem = {
  title: string;
  description: string;
  icon: string;
};

function RoadmapCard({
  item,
  index,
  scrollY,
  viewportHeight,
  cardOffsetsRef,
}: {
  item: RoadmapItem;
  index: number;
  scrollY: Animated.SharedValue<number>;
  viewportHeight: number;
  cardOffsetsRef: React.MutableRefObject<number[]>;
}) {
  const baseOffsetX = index % 2 === 0 ? -32 : 32;
  const alignSelf = index % 2 === 0 ? 'flex-start' : 'flex-end';

  const animatedStyle = useAnimatedStyle(() => {
    const offset = cardOffsetsRef.current[index] ?? 0;
    const start = offset - viewportHeight + 80;
    const end = start + 220;
    const progress = interpolate(scrollY.value, [start, end], [0, 1], Extrapolate.CLAMP);

    return {
      opacity: progress,
      transform: [
        { translateX: baseOffsetX },
        { translateY: (1 - progress) * 18 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.roadmapCard,
        { alignSelf, width: '90%' },
        animatedStyle,
      ]}
      onLayout={(event) => {
        cardOffsetsRef.current[index] = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.roadmapIconCircle}>
        <Text style={styles.roadmapIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.roadmapCardTitle}>{item.title}</Text>
      <Text style={styles.roadmapCardDescription}>{item.description}</Text>
    </Animated.View>
  );
}

export default function PersonalizedSummaryScreen() {
  const [userName, setUserName] = useState('Champion');
  const [targetDate, setTargetDate] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isFinishingOnboarding, setIsFinishingOnboarding] = useState(false);
  const { triggerTap } = useHaptics();

  const { height: viewportHeight } = useWindowDimensions();
  const cardOffsetsRef = useRef<number[]>([]);
  const scrollY = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const dateOpacity = useSharedValue(0);
  const benefitsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    loadUserData();
    loadReferralCode();
    calculateTargetDate();
    startAnimations();
  }, []);

  const loadUserData = async () => {
    try {
      const personalData = await AsyncStorage.getItem('personalData');
      if (personalData) {
        const { firstName } = JSON.parse(personalData);
        if (firstName) {
          setUserName(firstName);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadReferralCode = async () => {
    try {
      const referralData = await AsyncStorage.getItem('referralCode');
      if (referralData) {
        const { code } = JSON.parse(referralData);
        setReferralCode(code);
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
    }
  };

  const calculateTargetDate = () => {
    const today = new Date();
    const target = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    setTargetDate(
      formatDateFrench(target, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  };

  const startAnimations = () => {
    titleOpacity.value = withTiming(1, { duration: 800 });
    dateOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    benefitsOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
  };

  const navigateToApp = () => {
    router.replace('/(tabs)');
  };

  const checkAccess = async () => {
    try {
      return await isProActive();
    } catch (error) {
      console.warn('Unable to verify premium access', error);
      return false;
    }
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const enforceOnboardingPaywalls = async () => {
    if (!isRevenueCatEnabled()) {
      return true;
    }

    try {
      await initRevenueCat();
    } catch (error) {
      console.warn('RevenueCat init failed before paywall', error);
    }

    let hasAccess = await checkAccess();
    if (hasAccess) {
      return true;
    }

    try {
      await showDefaultPaywall();
    } catch (error) {
      console.warn('Default paywall presentation failed', error);
    }

    hasAccess = await checkAccess();
    if (hasAccess) {
      return true;
    }

    if (!PROMO_PAYWALL_AUTO_ENABLED) {
      return hasAccess;
    }

    await wait(PROMO_PAYWALL_DELAY_MS);

    try {
      await showPromoPaywall();
    } catch (error) {
      console.warn('Promo paywall presentation failed', error);
    }

    hasAccess = await checkAccess();
    return hasAccess;
  };

  const markOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    await setShouldShowOnboardingFlag(false);
  };

  const handleJoinSobre = async () => {
    if (isFinishingOnboarding) {
      return;
    }

    setIsFinishingOnboarding(true);

    try {
      const existingSobrietyData = await AsyncStorage.getItem('sobrietyData');

      if (!existingSobrietyData) {
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
      }

      const hasPremiumAccess = await enforceOnboardingPaywalls();

      if (hasPremiumAccess) {
        await markOnboardingComplete();
        triggerTap('medium');
        navigateToApp();
      } else {
        Alert.alert(
          'Accès requis',
          'Vous devez souscrire à SOBRE Premium pour continuer. Revenez en arrière pour finaliser votre achat.'
        );
      }
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la finalisation de votre inscription. Veuillez réessayer.'
      );
    } finally {
      setIsFinishingOnboarding(false);
    }
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const dateStyle = useAnimatedStyle(() => ({
    opacity: dateOpacity.value,
  }));

  const benefitsStyle = useAnimatedStyle(() => ({
    opacity: benefitsOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const benefits = [
    { emoji: '⚡', title: "Plus d'énergie", description: 'Retrouvez votre vitalité naturelle' },
    { emoji: '🤝', title: 'Meilleures relations', description: 'Connexions plus authentiques' },
    { emoji: '🛡️', title: 'Plus de confiance', description: 'Estime de soi renforcée' },
    { emoji: '✨', title: 'Clarté mentale', description: 'Focus et concentration améliorés' },
  ];

  const roadmap: RoadmapItem[] = [
    { title: 'Jour 0 — Préparer ton mental', description: 'Prépare ton environnement mental et émotionnel pour éviter les rechutes dès le départ.', icon: '🧠' },
    { title: 'Jour 1 — Déjouer les rechutes', description: 'Apprends à reconnaître les pensées automatiques et à les interrompre efficacement.', icon: '🛡️' },
    { title: 'Jour 3 — Renforcer ton “pourquoi”', description: 'Transforme tes raisons profondes en motivation quotidienne.', icon: '🔥' },
    { title: 'Jour 4 — Gérer les symptômes', description: 'Comprends et traverse les moments difficiles sans perdre le contrôle.', icon: '🌊' },
    { title: 'Jour 5 — Tu n’es pas seul', description: 'Avance avec une communauté qui partage les mêmes objectifs que toi.', icon: '🤝' },
    { title: 'Jour 6 — Reprendre le contrôle de ton temps', description: 'Remplace les anciennes habitudes par des activités qui te font réellement progresser.', icon: '⏱️' },
    { title: 'Fin de la semaine 1 — Première vraie victoire', description: 'Prends conscience du chemin parcouru et prépare la suite avec confiance.', icon: '🏁' },
  ];

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Notification simulée */}
        <View style={styles.notificationBanner}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Notifications SOBRE</Text>
            <Text style={styles.notificationSubtitle}>
              Les notifications peuvent inclure des alertes, des sons et des pastilles d'icônes.
            </Text>
          </View>
        </View>

        {/* Logo SOBRE */}
        <View style={styles.logoContainer}>
          <SobreLogo fontSize={28} color="#FFD700" letterSpacing={3} />
        </View>

        {/* Titre personnalisé */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.personalizedTitle}>{userName}, voici ton plan personnalisé.</Text>
        </Animated.View>

        {/* Date cible */}
        <Animated.View style={[styles.dateContainer, dateStyle]}>
          <Text style={styles.dateLabel}>Tu seras sobre à partir du :</Text>
          <Text style={styles.targetDate}>{targetDate}</Text>
        </Animated.View>

        {/* Slogan */}
        <View style={styles.sloganContainer}>
          <Text style={styles.sloganTitle}>Devenez la meilleure version de vous-même avec SOBRE.</Text>
          <Text style={styles.sloganSubtitle}>Plus fort. Plus sain. Plus heureux.</Text>
        </View>

        {/* Bénéfices */}
        <Animated.View style={[styles.benefitsContainer, benefitsStyle]}>
          <Text style={styles.benefitsTitle}>Vos bénéfices à venir :</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Text style={styles.benefitEmoji}>{benefit.emoji}</Text>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Roadmap semaine 1 */}
        <View style={styles.roadmapContainer}>
          <Text style={styles.roadmapTitle}>Ce qui t’attend dès les premiers jours</Text>
          <View style={styles.roadmapList}>
            {roadmap.map((item, index) => (
              <RoadmapCard
                key={item.title}
                item={item}
                index={index}
                scrollY={scrollY}
                viewportHeight={viewportHeight}
                cardOffsetsRef={cardOffsetsRef}
              />
            ))}
          </View>
        </View>

        {/* Étoiles décoratives */}
        <View style={styles.starsContainer}>
          <Text style={[styles.star, { top: '10%', left: '15%' }]}>✦</Text>
          <Text style={[styles.star, { top: '25%', right: '20%' }]}>✧</Text>
          <Text style={[styles.star, { top: '40%', left: '10%' }]}>✦</Text>
          <Text style={[styles.star, { top: '60%', right: '15%' }]}>✧</Text>
          <Text style={[styles.star, { top: '80%', left: '25%' }]}>✦</Text>
        </View>

        {/* Debug info pour tracking (visible en dev) */}
        {__DEV__ && referralCode && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Code de parrainage: {referralCode}</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Bouton CTA */}
      <Animated.View style={[styles.bottomContainer, buttonStyle]}>
        <TouchableOpacity
          style={[styles.joinButton, isFinishingOnboarding && styles.joinButtonDisabled]}
          onPress={handleJoinSobre}
          activeOpacity={0.9}
          disabled={isFinishingOnboarding}
        >
          <Text style={styles.joinButtonText}>
            {isFinishingOnboarding ? 'Chargement...' : 'Rejoindre SOBRE'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 220,
    paddingTop: 0,
  },
  notificationBanner: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  notificationContent: {
    flexDirection: 'column',
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 16,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  personalizedTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  dateContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  sloganContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  sloganTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  sloganSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  benefitCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  benefitEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 16,
  },
  roadmapContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  roadmapTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  roadmapList: {
    gap: 14,
  },
  roadmapCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  roadmapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  roadmapIcon: {
    fontSize: 22,
  },
  roadmapCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  roadmapCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CFCFCF',
    lineHeight: 20,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    fontSize: 16,
    color: '#FFD700',
    opacity: 0.6,
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  debugText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  joinButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
import { useHaptics } from '@/hooks/useHaptics';
