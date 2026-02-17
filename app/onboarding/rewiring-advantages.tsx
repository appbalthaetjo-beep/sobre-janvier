import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '@/hooks/useHaptics';

export default function RewiringAdvantagesScreen() {
  const { triggerTap } = useHaptics();
  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/personal-goals');
  };

  return (
    <LinearGradient
      colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Titre */}
        <View style={styles.titleContainer}>
          <Image
            source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Image centrale */}
        <View style={styles.imageContainer}>
          <View style={styles.chartFrame}>
            <Image
              source={{ uri: 'https://i.imgur.com/J1R2Yrc.png' }}
              style={styles.chartImage}
              resizeMode="contain"
            />
          </View>
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
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={styles.ctaWrapper}>
          <LinearGradient
            colors={['#FFFBF0', '#FFEFA3', '#FFDF70']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Continuer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  titleContainer: {
    paddingTop: 18,
    alignItems: 'center',
  },
  headerLogo: {
    width: 86,
    height: 86,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.88)',
    textAlign: 'center',
    lineHeight: 36,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartFrame: {
    width: '110%',
    height: 320,
    maxWidth: 420,
    borderRadius: 22,
    overflow: 'hidden',
  },
  chartImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  explanationText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(0,0,0,0.74)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  ctaWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cta: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
});
