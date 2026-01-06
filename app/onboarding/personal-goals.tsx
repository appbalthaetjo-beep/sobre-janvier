import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';

interface Goal {
  id: string;
  emoji: string;
  title: string;
}

export default function PersonalGoalsScreen() {
  const { saveUserData } = useFirestore();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { triggerTap } = useHaptics();

  const goals: Goal[] = [
    { id: 'stop_completely', emoji: '🏁', title: 'Arrêter complètement' },
    { id: 'improve_relationships', emoji: '❤️', title: 'Améliorer mes relations' },
    { id: 'regain_energy', emoji: '💪', title: 'Retrouver de l\'énergie / de la motivation' },
    { id: 'mental_clarity', emoji: '🧠', title: 'Améliorer ma clarté mentale' },
    { id: 'present_interactions', emoji: '💬', title: 'Être plus présent dans mes interactions' },
    { id: 'reduce_anxiety', emoji: '😌', title: 'Réduire l\'anxiété / retrouver la paix intérieure' },
    { id: 'boost_self_esteem', emoji: '🔥', title: 'Booster mon estime de moi' },
    { id: 'work_focus', emoji: '💼', title: 'Être plus concentré dans mon travail / études' },
    { id: 'reconnect_values', emoji: '💖', title: 'Me reconnecter à mes valeurs' },
  ];

  const toggleGoal = (goalId: string) => {
    triggerTap('light');
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    triggerTap('medium');
    if (selectedGoals.length === 0) return;

    try {
      // Sauvegarder les objectifs sélectionnés
      await AsyncStorage.setItem('userGoals', JSON.stringify(selectedGoals));
      
      // Sauvegarder aussi dans Firebase
      await saveUserData({ 
        userGoals: selectedGoals,
        goals: selectedGoals // Double sauvegarde pour compatibilité
      });
      console.log('✅ User goals saved to Firebase:', selectedGoals);
      
      router.push('/onboarding/referral-code');
    } catch (error) {
      console.error('Error saving goals:', error);
      router.push('/onboarding/referral-code');
    }
  };

  const handleBack = () => {
    triggerTap('light');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Définissez vos objectifs</Text>
          <Text style={styles.subtitle}>Que voulez-vous accomplir ?</Text>
          <Text style={styles.instruction}>
            Quels sont vos objectifs ? (Sélectionnez tous ceux qui s'appliquent)
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.goalsContainer}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <View style={styles.goalContent}>
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <Text style={[
                    styles.goalTitle,
                    isSelected && styles.goalTitleSelected
                  ]}>
                    {goal.title}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Check size={16} color="#000000" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.backButtonBottom} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedGoals.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={[
            styles.nextButtonText,
            selectedGoals.length === 0 && styles.nextButtonTextDisabled
          ]}>
            Suivant
          </Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  goalsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalCardSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 22,
  },
  goalTitleSelected: {
    color: '#FFD700',
  },
  checkMark: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  backButtonBottom: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  nextButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  nextButtonTextDisabled: {
    color: '#666666',
  },
});
