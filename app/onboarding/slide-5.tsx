import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';

export default function Slide5Screen() {
  const { triggerTap } = useHaptics();

  const handleFinishOnboarding = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-6');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Emoji central */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>🚀</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          Commencez votre parcours
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          Félicitations ! Vous avez franchi la première étape en reconnaissant le problème. 
          Votre parcours vers la liberté commence maintenant.
        </Text>
      </View>

      {/* Bouton terminer */}
      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinishOnboarding}
        activeOpacity={0.9}
      >
        <Text style={styles.finishButtonText}>Commencer avec SOBRE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10B981', // Vert pour symboliser l'espoir et le nouveau départ
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 36,
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  finishButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
});
