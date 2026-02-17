import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import * as StoreReview from 'expo-store-review';

import { useHaptics } from '@/hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAR_GRADIENT = ['#FFEFA3', '#FFD44D', '#FFBF00'] as const;
const BG_GRADIENT = ['#000000', '#050313', '#120A2B'] as const;
const CTA_GRADIENT = ['#F7E08A', '#D6A93A', '#B17A10'] as const;

const CARD_WIDTH = 280;
const CARD_GAP = 14;
const ROW_GAP = 28;

type Review = {
  date: string;
  name: string;
  text: string;
};

function GradientStar({ size, id }: { size: number; id: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="0.5" x2="1" y2="0.5">
          <Stop offset="0" stopColor={STAR_GRADIENT[0]} />
          <Stop offset="0.55" stopColor={STAR_GRADIENT[1]} />
          <Stop offset="1" stopColor={STAR_GRADIENT[2]} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={`url(#${id})`}
      />
    </Svg>
  );
}

function MarqueeRow({
  reviews,
  direction,
  topOffset,
}: {
  reviews: Review[];
  direction: 'left' | 'right';
  topOffset: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const cycleWidth = (CARD_WIDTH + CARD_GAP) * reviews.length;
  const start = direction === 'left' ? 0 : -cycleWidth;
  const end = direction === 'left' ? -cycleWidth : 0;

  useEffect(() => {
    translateX.setValue(start);
    const duration = Math.max(12000, Math.round((cycleWidth / SCREEN_WIDTH) * 12000));
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: end,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => translateX.stopAnimation();
  }, [cycleWidth, end, start, translateX]);

  const duplicated = useMemo(() => reviews.concat(reviews), [reviews]);

  return (
    <Animated.View
      style={[
        styles.marqueeRow,
        { top: topOffset, transform: [{ translateX }] },
      ]}
      pointerEvents="none"
    >
      {duplicated.map((review, index) => (
        <View key={`${review.name}-${review.date}-${index}`} style={styles.reviewCard}>
          <View style={styles.reviewTopRow}>
            <Text style={styles.reviewDate}>{review.date}</Text>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <GradientStar key={starIndex} id={`${review.name}-${review.date}-${index}-s${starIndex}`} size={14} />
              ))}
            </View>
          </View>

          <Text style={styles.reviewName}>{review.name}</Text>
          <Text style={styles.reviewText}>{review.text}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

function TwinklingStars() {
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => twinkle.stopAnimation();
  }, [twinkle]);

  const starStyle = (baseOpacity: number, scaleIn = 1.18) => ({
    opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity, Math.min(1, baseOpacity + 0.35)] }),
    transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, scaleIn] }) }],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.star, { top: '10%', left: '16%' }, starStyle(0.55)]} />
      <Animated.View style={[styles.star, { top: '16%', left: '78%' }, starStyle(0.35, 1.25)]} />
      <Animated.View style={[styles.star, { top: '26%', left: '62%' }, starStyle(0.45)]} />
      <Animated.View style={[styles.star, { top: '32%', left: '12%' }, starStyle(0.4, 1.22)]} />
      <Animated.View style={[styles.star, { top: '44%', left: '88%' }, starStyle(0.55)]} />
      <Animated.View style={[styles.star, { top: '54%', left: '26%' }, starStyle(0.35, 1.25)]} />
      <Animated.View style={[styles.star, { top: '62%', left: '68%' }, starStyle(0.4)]} />
      <Animated.View style={[styles.star, { top: '72%', left: '10%' }, starStyle(0.5, 1.22)]} />
      <Animated.View style={[styles.star, { top: '78%', left: '86%' }, starStyle(0.35, 1.25)]} />
    </View>
  );
}

export default function RateUsScreen() {
  const { triggerTap } = useHaptics();
  const didRequestReviewRef = useRef(false);

  const topRow = useMemo<Review[]>(
    () => [
      { date: '8 mai', name: 'Brandon S.', text: '“Le blocage des sites a stoppé mon plus gros déclencheur.”' },
      { date: '13 sept.', name: 'Marcus L.', text: '“90 jours clean grâce aux streaks et au soutien de la communauté.”' },
      { date: '29 janv.', name: 'Derek', text: '“Je reprends le contrôle. C’est simple et ça m’aide vraiment.”' },
      { date: '2 fév.', name: 'Alex', text: '“J’ai enfin de la clarté mentale et je suis plus motivé.”' },
    ],
    [],
  );

  const bottomRow = useMemo<Review[]>(
    () => [
      { date: '6 juin', name: 'Thomas', text: '“Le diagnostic m’a fait un déclic. Je sais quoi faire maintenant.”' },
      { date: '18 août', name: 'Nolan', text: '“Les rappels et le suivi m’aident à rester constant.”' },
      { date: '12 oct.', name: 'Yanis', text: '“Je suis plus présent avec ma copine. Merci SOBRE.”' },
      { date: '21 déc.', name: 'Mat', text: '“Je craque beaucoup moins. Je me sens enfin en contrôle.”' },
    ],
    [],
  );

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/free-trial');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const askForReview = async () => {
        try {
          if (didRequestReviewRef.current) return;
          const available = await StoreReview.isAvailableAsync();
          if (!available) return;
          didRequestReviewRef.current = true;
          await StoreReview.requestReview();
        } catch {
          // ignore
        }
      };
      void askForReview();
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient colors={BG_GRADIENT as unknown as string[]} start={{ x: 0.92, y: 0.05 }} end={{ x: 0.15, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <TwinklingStars />

        <View style={styles.content}>
          <Text style={styles.title}>{'Aide-nous à vaincre le\nporno'}</Text>
          <Text style={styles.subtitle}>
            Chaque note nous aide à lutter contre l’industrie du porno et à aider plus de personnes.
          </Text>

          <View style={styles.starsBlock}>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <GradientStar key={index} id={`star-${index}`} size={34} />
              ))}
            </View>
          </View>

          <Text style={styles.kicker}>Plus de 300 avis 5 étoiles</Text>

          <View style={styles.avatarsRow}>
            <Image source={{ uri: 'https://i.imgur.com/pMpaMOd.png' }} style={[styles.avatar, styles.avatarLeft]} />
            <Image source={{ uri: 'https://i.imgur.com/4P80kpY.png' }} style={[styles.avatar, styles.avatarMid]} />
            <Image source={{ uri: 'https://i.imgur.com/By8HOi5.png' }} style={[styles.avatar, styles.avatarRight]} />
          </View>

          <Text style={styles.usersText}>5k+ utilisateurs SOBRE</Text>
        </View>

        {/* Marquee reviews (2 lignes, directions opposées) */}
        <View style={styles.marqueeContainer} pointerEvents="none">
          <MarqueeRow reviews={topRow} direction="left" topOffset={0} />
          <MarqueeRow reviews={bottomRow} direction="right" topOffset={112 + ROW_GAP} />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleContinue} activeOpacity={0.9}>
          <LinearGradient
            colors={CTA_GRADIENT as unknown as string[]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={18} color="#6B4A00" style={styles.nextArrow} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
    marginBottom: 20,
  },
  starsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  kicker: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 16,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  avatarLeft: {
    marginRight: -12,
  },
  avatarMid: {
    zIndex: 2,
  },
  avatarRight: {
    marginLeft: -12,
  },
  usersText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  marqueeContainer: {
    marginTop: 16,
    height: 112 + ROW_GAP + 132,
    overflow: 'hidden',
  },
  marqueeRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_GAP,
    paddingHorizontal: 10,
  },
  reviewCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
  },
  nextButton: {
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 34,
    alignItems: 'center',
    overflow: 'hidden',
  },
  nextButtonGradient: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
  },
  nextArrow: {
    marginTop: 1,
  },
  star: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
