import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
import ProgressBar from './ProgressBar';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';

interface Choice {
  id: string;
  label: string;
}

interface QuestionTemplateProps {
  currentStep: number;
  totalSteps: number;
  helperText?: string;
  question: string;
  details?: string[];
  questionKey: string; // Clé unique pour identifier la question
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  selectedChoice?: string;
  nextRoute: string;
  showSkip?: boolean;
}

export default function QuestionTemplate({
  currentStep,
  totalSteps,
  helperText,
  question,
  details,
  questionKey,
  choices,
  onSelect,
  selectedChoice,
  nextRoute,
  showSkip = true,
}: QuestionTemplateProps) {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();
  const slideAnimation = useSharedValue(0);
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingNavigation = useCallback(() => {
    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
      slideTimeoutRef.current = null;
    }
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingNavigation();
    };
  }, [clearPendingNavigation]);

  useFocusEffect(
    useCallback(() => {
      clearPendingNavigation();
      slideAnimation.value = 0;

      return () => {
        clearPendingNavigation();
      };
    }, [clearPendingNavigation, slideAnimation]),
  );
  
  const handleChoiceSelect = async (choiceId: string) => {
    triggerTap();
    onSelect(choiceId);
    clearPendingNavigation();
    
    // Sauvegarder la réponse
    try {
      const existingAnswers = await AsyncStorage.getItem('quizAnswers');
      const answers = existingAnswers ? JSON.parse(existingAnswers) : {};
      answers[questionKey] = choiceId;
      await AsyncStorage.setItem('quizAnswers', JSON.stringify(answers));
      
      // Sauvegarder aussi dans Firebase
      try {
        await saveUserData({ quizAnswers: answers });
        console.log(`✅ Quiz answer saved to Firebase: ${questionKey} = ${choiceId}`);
      } catch (error) {
        console.error('❌ Error saving quiz answer to Firebase:', error);
      }
    } catch (error) {
      console.error('Error saving quiz answer:', error);
    }
    
    // Animation de swipe vers la gauche
    slideTimeoutRef.current = setTimeout(() => {
      slideAnimation.value = withTiming(-1, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      });
      
      // Navigation après l'animation
      navigationTimeoutRef.current = setTimeout(() => {
        router.push(nextRoute);
      }, 400);
    }, 800);
  };

  const handleSkip = () => {
    triggerTap('light');
    clearPendingNavigation();
    router.push(nextRoute);
  };

  const handleBack = () => {
    triggerTap('light');
    clearPendingNavigation();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/personal-data');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnimation.value * 400 }],
    opacity: 1 + slideAnimation.value * 0.5,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </View>

        <View style={styles.headerSpacer} />
      </View>
      
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.questionSection}>
            {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
            <Text style={styles.questionText}>{question}</Text>
            {details?.length ? (
              <View style={styles.detailsList}>
                {details.map((line, index) => (
                  <Text key={`${questionKey}-detail-${index}`} style={styles.detailsText}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.choicesSection}>
            {choices.map((choice) => (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceButton,
                  selectedChoice === choice.id && styles.choiceButtonSelected
                ]}
                onPress={() => handleChoiceSelect(choice.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.choiceText,
                    selectedChoice === choice.id && styles.choiceTextSelected
                  ]}
                >
                  {choice.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {showSkip ? (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Passer le test</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 14,
  },
  headerSpacer: {
    width: 36,
  },
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionSection: {
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'flex-start',
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 38,
    maxWidth: 320,
  },
  detailsList: {
    marginTop: 14,
    gap: 10,
  },
  detailsText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
  },
  choicesSection: {
    gap: 14,
    alignItems: 'stretch',
    paddingBottom: 100,
  },
  choiceButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  choiceText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  bottomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
});
