import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '@/hooks/useHaptics';

export default function RewiringAdvantagesScreen() {
  const { triggerTap } = useHaptics();
  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/commitment-signature');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Avantages du recâblage</Text>
        </View>

        {/* Image centrale */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://i.imgur.com/u1KwJ4i.png' }}
            style={styles.chartImage}
            resizeMode="contain"
          />
        </View>

        {/* Texte explicatif */}
        <View style={styles.textContainer}>
          <Text style={styles.explanationText}>
            SOBRE vous aide à arrêter 76% plus rapidement que la seule volonté.
          </Text>
        </View>
      </View>

      {/* Bouton continuer */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  titleContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartImage: {
    width: '110%',
    height: 320,
    maxWidth: 420,
    borderRadius: 20,
  },
  textContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  explanationText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
