import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  totalSteps: 10;
  question: string;
  questionKey: string; // Clé unique pour identifier la question
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  selectedChoice?: string;
  nextRoute: string;
}

export default function QuestionTemplate({
  currentStep,
  totalSteps,
  question,
  questionKey,
  choices,
  onSelect,
  selectedChoice,
  nextRoute
}: QuestionTemplateProps) {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();
  const slideAnimation = useSharedValue(0);
  
  const handleChoiceSelect = async (choiceId: string) => {
    triggerTap();
    onSelect(choiceId);
    
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
    setTimeout(() => {
      slideAnimation.value = withTiming(-1, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      });
      
      // Navigation après l'animation
      setTimeout(() => {
        router.push(nextRoute);
      }, 400);
    }, 800);
  };

  const handleSkip = () => {
    triggerTap('light');
    router.push(nextRoute);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnimation.value * 400 }],
    opacity: 1 + slideAnimation.value * 0.5,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>{question}</Text>
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

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Passer le test</Text>
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
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionSection: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  choicesSection: {
    gap: 16,
    paddingBottom: 100,
  },
  choiceButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#333333',
  },
  choiceButtonSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  choiceText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#FFD700',
  },
  bottomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
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
