import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingIntro() {
  const { triggerTap } = useHaptics();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const showNoPremiumMessage = reason === 'no-premium';

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
          {showNoPremiumMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Aucun accès premium trouvé ⚡</Text>
              <Text style={styles.warningText}>Commence par le diagnostic pour démarrer.</Text>
            </View>
          ) : null}
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
            <LinearGradient
              colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Commencer le quizz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginPill}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginPillText}>
            Déjà un compte ? <Text style={styles.loginPillAction}>Se connecter</Text>
          </Text>
        </TouchableOpacity>

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
    width: '100%',
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  warningTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 6,
  },
  warningText: {
    color: '#EDEDED',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
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
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
    textAlign: 'center',
  },
  loginPill: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  loginPillText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
  },
  loginPillAction: {
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.92)',
  },
});
