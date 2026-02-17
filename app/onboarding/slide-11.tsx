import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';

const CLARIO_IMAGE = { uri: 'https://i.imgur.com/yWky9d2.png' };

export default function Slide11Screen() {
  const { triggerTap } = useHaptics();

  const handleFinishOnboarding = () => {
    triggerTap('medium');
    router.push('/onboarding/testimonials');
  };

  const totalDots = 5;
  const activeDotIndex = 4;

  const bubbleIn = useRef(new Animated.Value(0)).current;
  const cardIn = useRef(new Animated.Value(0)).current;

  const bubbleFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bubbleIn, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardIn, {
        toValue: 1,
        duration: 640,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [bubbleIn, cardIn]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleFloat, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bubbleFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => bubbleFloat.stopAnimation();
  }, [bubbleFloat]);

  const fadeUp = (v: Animated.Value, fromY = 14) => ({
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
        </View>

        <View style={styles.preview}>
          <Animated.View
            style={[
              styles.clarioHeroWrap,
              {
                opacity: bubbleIn,
                transform: [
                  {
                    translateY: bubbleIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                  {
                    translateY: bubbleFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }),
                  },
                ],
              },
            ]}
          >
            <Image source={CLARIO_IMAGE} style={styles.clarioHero} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={[styles.chatCard, fadeUp(cardIn, 16)]}>
            <View style={styles.chatRow}>
              <Image source={CLARIO_IMAGE} style={styles.aiAvatar} resizeMode="cover" />
              <View style={styles.aiBubble}>
                <Text style={styles.chatText}>
                  Hey, je prends des nouvelles. Ces derniers jours ont été intenses… comment tu te sens ?
                </Text>
              </View>
            </View>

            <View style={styles.chatRowRight}>
              <View style={styles.userBubble}>
                <Text style={styles.chatText}>
                  Honnêtement… je me perds dans le scroll et je replonge dès que ça devient difficile.
                </Text>
              </View>
              <Image
                source={{ uri: 'https://i.imgur.com/32zD9SI.png' }}
                style={styles.userAvatar}
                resizeMode="cover"
              />
            </View>
          </Animated.View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Support personnalisé</Text>
          <Text style={styles.message}>
            Ton assistant IA t’aide au quotidien avec des check-ins, des rappels et des conseils adaptés — pour avancer,
            même quand c’est dur.
          </Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: totalDots }).map((_, index) => {
            const isActive = index === activeDotIndex;
            return <View key={index} style={isActive ? styles.dotActive : styles.dot} />;
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleFinishOnboarding} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F7E08A', '#D6A93A', '#B17A10']}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  preview: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  clarioHeroWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 12,
  },
  clarioHero: {
    width: 132,
    height: 132,
  },
  chatCard: {
    width: '100%',
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.12)',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chatRowRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  aiBubble: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userBubble: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.18)',
  },
  chatText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 20,
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
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
