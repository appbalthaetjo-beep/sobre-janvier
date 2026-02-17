import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function Slide1Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-2');
  };

  return (
    <LinearGradient
      colors={['#F24B5D', '#F04C77', '#EF4A5C', '#F03D3D']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.content}>
        {/* Image pilule */}
        <View style={styles.emojiContainer}>
          <Image
            source={{ uri: 'https://i.imgur.com/xXnqTfI.png' }}
            style={styles.pillImage}
            resizeMode="contain"
          />
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          La pornographie est une drogue
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          L'utilisation de pornographie libère un produit chimique dans le cerveau appelé dopamine. 
          Ce produit chimique vous fait vous sentir bien – c'est pourquoi vous ressentez du plaisir 
          lorsque vous regardez de la pornographie.
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
  header: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 6,
  },
  headerLogo: {
    width: 74,
    height: 74,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  emojiContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillImage: {
    width: 280,
    height: 280,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 36,
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
