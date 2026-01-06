import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'react-native';
import { useHaptics } from '@/hooks/useHaptics';

export default function Slide7Screen() {
  const { triggerTap } = useHaptics();
  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-8');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo SOBRE en haut */}
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Emoji central */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>🧠</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          Recâblez votre cerveau
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          Des exercices validés par la science pour restaurer votre dopamine et éviter les rechutes.
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
    backgroundColor: '#000000', // Noir SOBRE
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
  },
  logoImage: {
    width: 100,
    height: 33,
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
    backgroundColor: '#FFD700',
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
    color: '#000000',
  },
});
