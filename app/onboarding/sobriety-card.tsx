import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import SobreLogo from '@/components/SobreLogo';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing 
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';

export function SobrietyCardPreview() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.sobrietyCard}>
        <View style={styles.cardHeader}>
          <SobreLogo fontSize={18} color="#FFD700" letterSpacing={1} />
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>Membre</Text>
          </View>
        </View>

        <View style={styles.cardMain}>
          <Text style={styles.sobreText}>Vous êtes sobre depuis</Text>

          <View style={styles.counterContainer}>
            <Text style={styles.daysNumber}>0</Text>
            <Text style={styles.daysLabel}>jours</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SobrietyCardScreen() {
  const { triggerTap } = useHaptics();
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation séquentielle fluide
    cardOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Text apparaît ensuite
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 600 });
    }, 400);
    
    // Bouton apparaît en dernier
    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 500 });
    }, 800);
  }, []);

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/question-1');
  };


  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
      
        {/* Carte de sobriété premium */}
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <SobrietyCardPreview />
        </Animated.View>

        {/* Texte d'accompagnement */}
        <Animated.View style={[styles.textSection, textAnimatedStyle]}>
          <Text style={styles.welcomeText}>
            Bienvenue dans SØBRE. Voici votre carte de suivi personnel. 
            Construisons maintenant l'application autour de vous.
          </Text>
        </Animated.View>

        {/* Bouton suivant */}
        <Animated.View style={[styles.buttonSection, buttonAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </Animated.View>

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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    marginBottom: 48,
  },
  sobrietyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: 320,
    height: 200,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  memberBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  memberText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  cardMain: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  sobreText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    marginBottom: 16,
    textAlign: 'center',
  },
  counterContainer: {
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    lineHeight: 52,
    marginBottom: -4,
  },
  daysLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 16,
    right: 20,
  },
  startDate: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  textSection: {
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonSection: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
});
