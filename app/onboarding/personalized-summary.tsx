import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useHaptics } from '@/hooks/useHaptics';

type RoadmapItem = {
  title: string;
  description: string;
  icon: string;
  variant?: 'standard' | 'highlight';
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
  const animatedStyle = useAnimatedStyle(() => {
    const offset = cardOffsetsRef.current[index] ?? 0;
    const start = offset - viewportHeight + 80;
    const end = start + 220;
    const progress = interpolate(scrollY.value, [start, end], [0, 1], Extrapolate.CLAMP);

    return {
      opacity: progress,
      transform: [
        { translateY: (1 - progress) * 18 },
      ],
    };
  });

  if (item.variant === 'highlight') {
    return (
      <Animated.View
        style={[styles.highlightCard, animatedStyle]}
        onLayout={(event) => {
          cardOffsetsRef.current[index] = event.nativeEvent.layout.y;
        }}
      >
        <LinearGradient
          colors={['rgba(255, 239, 163, 0.22)', 'rgba(255, 212, 77, 0.18)', 'rgba(255, 191, 0, 0.16)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.highlightGradient}
        >
          <Text style={styles.highlightTitle}>{item.title}</Text>
          <Text style={styles.highlightDescription}>{item.description}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.roadmapCard,
        { alignSelf: 'stretch' },
        animatedStyle,
      ]}
      onLayout={(event) => {
        cardOffsetsRef.current[index] = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.roadmapRow}>
        <View style={styles.roadmapIconCircle}>
          <Text style={styles.roadmapIcon}>{item.icon}</Text>
        </View>
        <View style={styles.roadmapTextCol}>
          <Text style={styles.roadmapCardTitle}>{item.title}</Text>
          <Text style={styles.roadmapCardDescription}>{item.description}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function PersonalizedSummaryScreen() {
  const [userName, setUserName] = useState('Champion');
  const [targetDate, setTargetDate] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { triggerTap } = useHaptics();

  const { height: viewportHeight } = useWindowDimensions();
  const cardOffsetsRef = useRef<number[]>([]);
  const scrollY = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const dateOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    loadUserData();
    loadReferralCode();
    calculateTargetDate();

    titleOpacity.value = withTiming(1, { duration: 800 });
    dateOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
  }, [buttonOpacity, dateOpacity, titleOpacity]);

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

  const handleJoinSobre = () => {
    triggerTap('medium');
    router.push('/onboarding/trial-reminder');
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const dateStyle = useAnimatedStyle(() => ({
    opacity: dateOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const roadmap: RoadmapItem[] = [
    {
      title: 'Jour 0 — Préparer ton espace',
      description: 'Optimise ton environnement (physique & digital) pour rendre le changement plus simple.',
      icon: '🗓️',
    },
    {
      title: 'Jour 1 — Déjouer le sevrage',
      description: 'Utilise des outils mentaux et physiques pour traverser les envies et te recentrer.',
      icon: '🧠',
    },
    {
      title: 'Jour 2 — Battre le jeu des envies',
      description: 'Repère tes déclencheurs et remplace-les par des habitudes plus saines et gratifiantes.',
      icon: '🔥',
    },
    {
      title: '🧠 Dès le jour 2, ton cerveau commence à se réinitialiser.',
      description:
        'La dopamine commence à se stabiliser. Les envies peuvent monter au début — mais c’est un signe clair que la guérison a commencé.',
      icon: '🧠',
      variant: 'highlight',
    },
    {
      title: 'Jour 3 — Renforcer ton “pourquoi”',
      description: 'Transforme tes raisons profondes en motivation quotidienne et en focus.',
      icon: '🎯',
    },
    {
      title: 'Jour 4 — Écraser les symptômes',
      description: 'Apprends à gérer la fatigue, le stress ou l’irritabilité avec des “resets” simples.',
      icon: '🛠️',
    },
    {
      title: '🧠 Ton focus revient vite.',
      description:
        'Le brouillard mental commence à se lever et la motivation revient. Sommeil, énergie et clarté sont juste au coin de la rue.',
      icon: '🧠',
      variant: 'highlight',
    },
    {
      title: 'Jour 5 — Se sentir mieux dans son corps',
      description: 'Bouge, mange mieux et recharge : ton énergie et ta clarté peuvent revenir rapidement.',
      icon: '💪',
    },
    {
      title: 'Jour 6 — Tu n’es pas seul',
      description: 'Connecte-toi à d’autres sur le même chemin. Partage tes victoires et reçois du soutien.',
      icon: '🌍',
    },
    {
      title: 'Jour 7 — Reprendre ton temps',
      description: 'Remplace les anciennes habitudes par de vrais objectifs et des actions qui comptent.',
      icon: '📍',
    },
    {
      title: '📊 Fin de la semaine 1 — stats & élan',
      description:
        'Les envies sont encore là, mais plus faciles à gérer. Énergie, confiance et motivation se renforcent : c’est ton premier vrai goût de liberté.',
      icon: '📊',
      variant: 'highlight',
    },
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
        {/* Logo (même que sur les shields / daily mode) */}
        <View style={styles.topLogoContainer}>
          <Image
            source={require('../../modules/expo-family-controls/ios/ShieldConfigurationExtension/sobre_shield_logo.png')}
            style={styles.topLogo}
            resizeMode="contain"
          />
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

        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>Ce n’est pas une question de volonté.</Text>
          <Text style={styles.introSubtitle}>C’est un système qui fonctionne vraiment.</Text>
          <Text style={styles.introBody}>
            SOBRE te guide à travers un reset puissant, avec une structure et des outils qui t’aident à progresser, même
            quand c’est difficile.
          </Text>
          <Text style={styles.introKicker}>Voici à quoi ressemblent tes 7 premiers jours :</Text>
        </View>

        {/* Roadmap semaine 1 */}
        <View style={styles.roadmapContainer}>
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
        <View style={styles.cancelAnytimePill}>
          <Text style={styles.cancelAnytimeText}>✅ Sans engagement, annule quand tu veux</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinSobre}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.joinButtonGradient}
          >
            <Text style={styles.joinButtonText}>Essayer pour 0€</Text>
          </LinearGradient>
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
    paddingBottom: 320,
    paddingTop: 0,
  },
  notificationBanner: {
    display: 'none',
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
  topLogoContainer: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 10,
  },
  topLogo: {
    width: 86,
    height: 86,
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
  introCopy: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 18,
  },
  introTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 34,
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 14,
  },
  introBody: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 22,
    marginBottom: 14,
  },
  introKicker: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.82)',
  },
  roadmapContainer: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 34,
  },
  roadmapList: {
    gap: 18,
  },
  roadmapCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 22,
    padding: 18,
    minHeight: 120,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  roadmapTextCol: {
    flex: 1,
    paddingTop: 2,
  },
  roadmapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  roadmapIcon: {
    fontSize: 22,
  },
  roadmapCardTitle: {
    fontSize: 17,
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
  highlightCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.30)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8,
  },
  highlightGradient: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  highlightTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 10,
  },
  highlightDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
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
  cancelAnytimePill: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  cancelAnytimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  joinButtonGradient: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#6B4A00',
    letterSpacing: 0.5,
  },
});
