import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { useTypewriterMessages } from '@/hooks/useTypewriterMessages';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SobrietyCardPreview } from './sobriety-card';

const LETTER_DELAY_MS = 45;
const MESSAGE_DELAY_MS = 1300;

export default function PlanStoryScreen() {
  const { triggerTap } = useHaptics();
  const [firstName, setFirstName] = useState('toi');

  useEffect(() => {
    const loadName = async () => {
      try {
        const personalData = await AsyncStorage.getItem('personalData');
        if (personalData) {
          const parsed = JSON.parse(personalData);
          const name = parsed?.firstName?.trim();
          if (name) {
            setFirstName(name);
          }
        }
      } catch (error) {
        console.error('PlanStoryScreen: failed to load first name', error);
      }
    };

    void loadName();
  }, []);

  const messages = useMemo(
    () => [
      `Salut, ${firstName}`,
      'Bienvenue sur SOBRE, ton chemin vers la liberté.',
      'À partir de tes réponses, nous avons construit un plan spécialement pour toi.',
      'Il est conçu pour t’aider à arrêter le porno définitivement.',
      'Maintenant, il est temps d’investir en toi.',
    ],
    [firstName]
  );

  const { displayedText, finished, currentIndex } = useTypewriterMessages({
    messages,
    letterDelay: LETTER_DELAY_MS,
    messageDelay: MESSAGE_DELAY_MS,
    onType: () => triggerTap(),
  });

  const cardVisibleRef = useRef(false);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const cardTranslateY = useSharedValue(12);

  useEffect(() => {
    const targetIndex = 2;
    if (cardVisibleRef.current) return;
    if (currentIndex >= targetIndex) {
      cardVisibleRef.current = true;
      cardOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      cardScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      cardTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      triggerTap('light');
    }
  }, [cardOpacity, cardScale, cardTranslateY, currentIndex, triggerTap]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const isCardPhase = currentIndex >= 2;

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/personalized-summary');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.content, isCardPhase && styles.contentShifted]}>
        <Text style={styles.messageText}>{displayedText}</Text>
      </View>

      {isCardPhase && (
        <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
          <SobrietyCardPreview />
        </Animated.View>
      )}

      {finished && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Voir mon plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
  },
  logoImage: {
    width: 140,
    height: 46,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  contentShifted: {
    marginBottom: 0,
  },
  messageText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    maxWidth: '92%',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -90,
    marginBottom: 4,
  },
  bottomContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
});
