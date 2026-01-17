import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';

export default function OnboardingIntro() {
  const { triggerTap } = useHaptics();

  const handleStartQuiz = () => {
    triggerTap('medium');
    router.push('/onboarding/story');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Logo et titre */}
        <View style={styles.headerSection}>
          <Image 
            source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeTitle}>Bienvenue !</Text>
        </View>

        {/* Sous-texte */}
        <View style={styles.messageSection}>
          <Text style={styles.subtitle}>
            Commençons par déterminer si vous avez un problème avec la pornographie.
          </Text>
        </View>

        {/* Bouton */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartQuiz}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Commencer le quiz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>Deja un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLinkAction}>Se connecter</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fond complètement noir uni
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 140,
    height: 46,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 40,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF', // Blanc
    textAlign: 'center',
  },
  messageSection: {
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF', // Blanc
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  buttonSection: {
    alignItems: 'center',
  },
  loginLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  loginLinkAction: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  startButton: {
    backgroundColor: '#FFD700', // Jaune
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000', // Texte noir sur bouton jaune
    textAlign: 'center',
  },
});
