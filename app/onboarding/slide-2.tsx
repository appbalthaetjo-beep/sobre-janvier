import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function Slide2Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-4');
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
          <View style={styles.emojiContainer}>
            <Image
              source={{ uri: 'https://i.imgur.com/aU4nBwM.png' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>La pornographie brise le désir</Text>

          <Text style={styles.message}>
            Plus de 50 % des personnes dépendantes au porno ont signalé une perte d’intérêt pour le vrai sexe.
          </Text>
        </View>

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
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 74,
    height: 74,
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
    color: '#F03D3D',
  },
});
