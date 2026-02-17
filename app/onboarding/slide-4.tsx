import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function Slide4Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-6');
  };

  return (
    <LinearGradient
      colors={['#53E0E8', '#3B7BFF', '#6C4CF6']}
      start={{ x: 0.9, y: 0.05 }}
      end={{ x: 0.15, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Image centrale */}
          <View style={styles.emojiContainer}>
            <Image
              source={{ uri: 'https://i.imgur.com/bYpnEIV.png' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Titre */}
          <Text style={styles.title}>Chemin vers le rétablissement</Text>

          {/* Message */}
          <Text style={styles.message}>
            Le rétablissement est possible. En t&apos;abstenant de pornographie, ton cerveau peut
            réinitialiser sa sensibilité à la dopamine, conduisant à des relations plus saines et un
            bien-être amélioré.
          </Text>
        </View>

        {/* Bouton suivant */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 200,
    height: 200,
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
    color: '#002f5d',
  },
});
