import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function Slide6Screen() {
  const { triggerTap } = useHaptics();
  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-7');
  };

  const totalDots = 5;
  const activeDotIndex = 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.main}>
          {/* Logo en haut */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
        </View>

        <View style={styles.imageSection}>
          {/* Carte */}
          <View style={styles.heroWrapper} pointerEvents="none">
            <Image
              source={{ uri: 'https://i.imgur.com/HZ8ms40.png' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>Bienvenue sur SOBRE</Text>
            <Text style={styles.message}>
              Libérez-vous de la pornographie et reprenez le contrôle de votre vie.
            </Text>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: totalDots }).map((_, index) => {
              const isActive = index === activeDotIndex;
              return <View key={index} style={isActive ? styles.dotActive : styles.dot} />;
            })}
          </View>
        </View>
      </View>

      {/* Bouton suivant */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F7E08A', '#D6A93A', '#B17A10']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  main: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    paddingTop: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  imageSection: {
    flex: 1.35,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 20,
  },
  heroWrapper: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 300,
    height: 300,
  },
  textSection: {
    flex: 0.65,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFD76A',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 36,
    textShadowColor: 'rgba(255, 191, 0, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#F5D98A',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(255, 191, 0, 0.22)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 16,
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
    backgroundColor: 'transparent',
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
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
  },
});
