import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { useTypewriterMessages } from '@/hooks/useTypewriterMessages';
import TapToContinueButton from '@/components/onboarding/TapToContinueButton';
import { LinearGradient } from 'expo-linear-gradient';

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

  const { displayedText, finished, tapToContinue } = useTypewriterMessages({
    messages: MESSAGES,
    letterDelay: LETTER_DELAY_MS,
    messageDelay: MESSAGE_DELAY_MS,
    onType: () => triggerTap(),
  });

  const handleTapToContinue = () => {
    triggerTap('light');
    tapToContinue();
  };

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/personal-data');
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

      {!finished && <TapToContinueButton onPress={handleTapToContinue} />}

      {finished && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleContinue} activeOpacity={0.9}>
            <LinearGradient
              colors={['#F7E08A', '#D6A93A', '#B17A10']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Commencer le quiz</Text>
            </LinearGradient>
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
    paddingTop: 14,
  },
  logoImage: {
    width: 110,
    height: 36,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 420,
  },
  startButtonGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
    textAlign: 'center',
  },
});
