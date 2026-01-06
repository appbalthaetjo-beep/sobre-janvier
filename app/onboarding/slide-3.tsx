import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';

export default function Slide3Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-4');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Emoji central */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>😞</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          Vous vous sentez malheureux ?
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          Un niveau de dopamine élevé signifie que vous avez besoin de plus de dopamine pour vous sentir bien. 
          C'est pourquoi tant d'utilisateurs intensifs de pornographie rapportent se sentir déprimés, 
          démotivés et antisociaux.
        </Text>
      </View>

      {/* Bouton suivant */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <Text style={styles.nextButtonText}>Suivant</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e40d28', // Rouge QUITTR
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
  nextButton: {
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
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#e40d28',
  },
});
