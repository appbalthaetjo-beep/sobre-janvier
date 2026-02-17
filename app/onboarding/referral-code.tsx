import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Générer les particules avec positions aléatoires
const generateParticles = () => {
  return Array.from({ length: 50 }, (_, index) => ({
    id: index,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.6 + 0.2,
  }));
};

export default function ReferralCodeScreen() {
  const { saveUserData } = useFirestore();
  const [referralCode, setReferralCode] = useState('');
  const [particles] = useState(generateParticles());
  const { triggerTap } = useHaptics();
  
  // Animations
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation séquentielle douce
    titleOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    subtitleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    inputOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
  }, []);

  const handleContinue = async () => {
    triggerTap('medium');
    try {
      // Sauvegarder le code de parrainage s'il y en a un
      if (referralCode.trim()) {
        console.log('🎯 REFERRAL CODE ENTERED:', referralCode.trim().toUpperCase());
        
        const referralData = {
          code: referralCode.trim().toUpperCase(),
          enteredAt: new Date().toISOString(),
          userEmail: null, // Sera mis à jour après l'auth
          isValid: true // Par défaut, validation ultérieure possible
        };
        
        console.log('💾 Saving referral data:', referralData);
        
        // Sauvegarder dans Firebase
        await saveUserData({ referralCode: referralData });
        
        // Aussi sauvegarder localement
        await AsyncStorage.setItem('referralCode', JSON.stringify(referralData));
        
        console.log('✅ Referral code saved successfully');
      } else {
        console.log('⚠️ No referral code entered - user skipped');
      }
      
      // Continuer vers la page finale
      router.push('/onboarding/personalized-summary');
    } catch (error) {
      console.error('Error saving referral code:', error);
      console.error('❌ CRITICAL: Referral code NOT saved due to error');
      // Continuer même en cas d'erreur
      router.push('/onboarding/personalized-summary');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/personalized-summary');
  };

  const handleBack = () => {
    router.back();
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Fond avec particules subtiles */}
      <View style={styles.backgroundContainer}>
        {particles.map((particle) => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
              }
            ]}
          />
        ))}
      </View>

      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        
        {/* Titre principal */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={styles.title}>Avez-vous un code de parrainage ?</Text>
        </Animated.View>

        {/* Sous-titre */}
        <Animated.View style={[styles.subtitleSection, subtitleStyle]}>
          <Text style={styles.subtitle}>Vous pouvez passer cette étape.</Text>
        </Animated.View>

        {/* Zone d'input */}
        <Animated.View style={[styles.inputSection, inputStyle]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Code de parrainage"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>
        </Animated.View>

      </View>

      {/* Boutons en bas */}
      <Animated.View style={[styles.bottomContainer, buttonStyle]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Suivant</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#FFD700',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 1,
  },
  backButton: {
    padding: 12,
    width: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 36,
  },
  subtitleSection: {
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    paddingVertical: 16,
    textAlign: 'left',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    paddingBottom: 40,
    zIndex: 1,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
