import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '@/hooks/useHaptics';

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 320, useNativeDriver: true }),
          Animated.delay(320),
        ]),
      );

    const a1 = make(dot1, 0);
    const a2 = make(dot2, 120);
    const a3 = make(dot3, 240);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
}

export default function Slide7Screen() {
  const { triggerTap } = useHaptics();
  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-8');
  };

  const totalDots = 5;
  const activeDotIndex = 1;

  const liveIn = useRef(new Animated.Value(0)).current;
  const postIn = useRef(new Animated.Value(0)).current;
  const reactionsIn = useRef(new Animated.Value(0)).current;
  const typingIn = useRef(new Animated.Value(0)).current;

  const liveShimmerX = useRef(new Animated.Value(0)).current;
  const typingShimmerX = useRef(new Animated.Value(0)).current;
  const liveDotPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeIn = (v: Animated.Value, duration = 420) =>
      Animated.timing(v, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    const animation = Animated.stagger(120, [
      makeIn(liveIn, 360),
      makeIn(postIn, 420),
      makeIn(reactionsIn, 420),
      makeIn(typingIn, 420),
    ]);

    animation.start();

    return () => {
      liveIn.stopAnimation();
      postIn.stopAnimation();
      reactionsIn.stopAnimation();
      typingIn.stopAnimation();
    };
  }, [liveIn, postIn, reactionsIn, typingIn]);

  useEffect(() => {
    const shimmer = (v: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotPulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(liveDotPulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    liveShimmerX.setValue(0);
    typingShimmerX.setValue(0);
    liveDotPulse.setValue(0);

    const s1 = shimmer(liveShimmerX, 1600);
    const s2 = shimmer(typingShimmerX, 1700);

    s1.start();
    s2.start();
    pulse.start();

    return () => {
      liveShimmerX.stopAnimation();
      typingShimmerX.stopAnimation();
      liveDotPulse.stopAnimation();
    };
  }, [liveDotPulse, liveShimmerX, typingShimmerX]);

  const slideUpStyle = (v: Animated.Value, fromY = 12) => ({
    opacity: v,
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <Animated.View style={[styles.livePill, slideUpStyle(liveIn, 10)]}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  transform: [
                    {
                      scale: liveDotPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.35],
                      }),
                    },
                  ],
                  opacity: liveDotPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerOverlay,
                {
                  transform: [
                    {
                      translateX: liveShimmerX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-120, 120],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
        </View>

        <View style={styles.preview}>
          <Animated.View style={[styles.postCard, slideUpStyle(postIn, 14)]}>
            <View style={styles.postHeaderRow}>
              <Text style={styles.postTitle}>Presque au bout !</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>75</Text>
              </View>
            </View>
            <Text style={styles.postBody}>
              Aujourd’hui ça fait 75 jours sans porno… je sens déjà la différence.
            </Text>
            <View style={styles.postMetaRow}>
              <Ionicons name="person-circle-outline" size={18} color="rgba(255, 215, 106, 0.7)" />
              <Text style={styles.postMetaText}>Jacob</Text>
              <View style={styles.metaDot} />
              <Text style={styles.postMetaText}>0 jours</Text>
              <View style={styles.metaDot} />
              <Text style={styles.postMetaText}>il y a 1 jour</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.reactionsRow, slideUpStyle(reactionsIn, 14)]}>
            <View style={styles.reactionPill}>
              <Ionicons name="chatbubble-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.reactionText}>305</Text>
            </View>
            <View style={styles.reactionPill}>
              <Ionicons name="thumbs-up-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.reactionText}>1224</Text>
            </View>
            <View style={styles.reactionPill}>
              <Ionicons name="thumbs-down-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.reactionText}>5</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.typingCard, slideUpStyle(typingIn, 14)]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerOverlay,
                {
                  transform: [
                    {
                      translateX: typingShimmerX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-160, 160],
                      }),
                    },
                  ],
                  opacity: 0.55,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
            <Image
              source={{ uri: 'https://i.imgur.com/32zD9SI.png' }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.typingTextCol}>
              <Text style={styles.typingName}>Jake</Text>
              <View style={styles.typingRow}>
                <Text style={styles.typingSub}>En train d’écrire</Text>
                <TypingDots />
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Réussissons ensemble</Text>
          <Text style={styles.message}>
            Vous n’êtes pas seul. Rejoignez une communauté grandissante de plus de 10&nbsp;000 membres sur le
            même chemin, qui se soutiennent et se motivent à chaque étape.
          </Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: totalDots }).map((_, index) => {
            const isActive = index === activeDotIndex;
            return <View key={index} style={isActive ? styles.dotActive : styles.dot} />;
          })}
        </View>
      </View>

      {/* Bouton suivant */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F7E08A', '#D6A93A', '#B17A10']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="arrow-forward" size={18} color="#6B4A00" style={styles.nextArrow} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Noir SOBRE
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 86,
    height: 86,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.18)',
    backgroundColor: 'rgba(255, 215, 106, 0.06)',
    overflow: 'hidden',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.9)',
  },
  liveText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 215, 106, 0.8)',
    letterSpacing: 1,
  },
  preview: {
    width: '100%',
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  postCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.12)',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.22)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFD76A',
  },
  postBody: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 22,
    marginBottom: 12,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postMetaText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reactionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  typingTextCol: {
    flex: 1,
  },
  typingName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  typingSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: -60,
    width: 120,
  },
  shimmerGradient: {
    flex: 1,
    borderRadius: 999,
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 6,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.22)',
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.9)',
  },
  nextButton: {
    borderRadius: 16,
    marginBottom: 34,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    width: '100%',
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
});
