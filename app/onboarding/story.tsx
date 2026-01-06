import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { useTypewriterMessages } from '@/hooks/useTypewriterMessages';

const MESSAGES = [
  'La plupart des personnes qui essaient d’arrêter le porno 🌽 n’échouent pas parce qu’elles sont faibles.',
  'Elles échouent parce qu’elles ne comprennent pas vraiment leurs habitudes ni ce qui déclenche leurs envies.',
  'Nous allons t’aider à comprendre ça.',
  'Commençons par voir si tu as vraiment un problème avec le porno.',
];

const LETTER_DELAY_MS = 45;
const MESSAGE_DELAY_MS = 1300;

export default function OnboardingStoryScreen() {
  const { triggerTap } = useHaptics();

  const { displayedText, finished } = useTypewriterMessages({
    messages: MESSAGES,
    letterDelay: LETTER_DELAY_MS,
    messageDelay: MESSAGE_DELAY_MS,
    onType: () => triggerTap(),
  });

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/auth');
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

      <View style={styles.content}>
        <Text style={styles.messageText}>{displayedText}</Text>
      </View>

      {finished && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Commencer le quiz</Text>
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
  messageText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    maxWidth: '92%',
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
