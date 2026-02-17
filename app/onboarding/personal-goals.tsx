import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';

interface Goal {
  id: string;
  emoji: string;
  title: string;
}

export default function PersonalGoalsScreen() {
  const { triggerTap } = useHaptics();
  const { saveUserData } = useFirestore();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const goals = useMemo<Goal[]>(
    () => [
      { id: 'stop_completely', emoji: '\u{1F3C1}', title: 'Arrêter complètement' },
      { id: 'improve_relationships', emoji: '\u2764\uFE0F', title: 'Améliorer mes relations' },
      { id: 'regain_energy', emoji: '\u{1F4AA}', title: 'Retrouver de l’énergie / de la motivation' },
      { id: 'mental_clarity', emoji: '\u{1F9E0}', title: 'Améliorer ma clarté mentale' },
      { id: 'present_interactions', emoji: '\u{1F4AC}', title: 'Être plus présent dans mes interactions' },
      { id: 'reduce_anxiety', emoji: '\u{1F60C}', title: 'Réduire l’anxiété / retrouver la paix intérieure' },
      { id: 'boost_self_esteem', emoji: '\u{1F525}', title: 'Booster mon estime de moi' },
      { id: 'work_focus', emoji: '\u{1F4BC}', title: 'Être plus concentré au travail / dans mes études' },
      { id: 'reconnect_values', emoji: '\u{1F496}', title: 'Me reconnecter à mes valeurs' },
    ],
    [],
  );

  const toggleGoal = (goalId: string) => {
    triggerTap('light');
    setSelectedGoals((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]));
  };

  const handleBack = () => {
    triggerTap('light');
    if (router.canGoBack()) router.back();
  };

  const handleContinue = async () => {
    triggerTap('medium');
    if (!selectedGoals.length) return;

    try {
      await AsyncStorage.setItem('userGoals', JSON.stringify(selectedGoals));
      try {
        await saveUserData({
          userGoals: selectedGoals,
          goals: selectedGoals,
        });
      } catch {
        // ignore
      }
    } finally {
      router.push('/onboarding/commitment-signature');
    }
  };

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

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>Définissons tes objectifs</Text>
          <Text style={styles.helperText}>Sélectionne tout ce qui s’applique.</Text>
        </View>

        <View style={styles.content}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.choiceButton, isSelected && styles.choiceButtonSelected]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <View style={styles.choiceRow}>
                  <Text style={styles.choiceEmoji}>{goal.emoji}</Text>
                  <Text style={styles.choiceText}>{goal.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={[styles.ctaWrapper, !selectedGoals.length && styles.ctaDisabled]}>
          <LinearGradient
            colors={['#F7E08A', '#D6A93A', '#B17A10']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={[styles.ctaText, !selectedGoals.length && styles.ctaTextDisabled]}>Continuer</Text>
          </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  questionSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
  },
  questionText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 24,
  },
  choiceButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceEmoji: {
    fontSize: 18,
    width: 22,
    textAlign: 'center',
  },
  choiceText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'left',
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  cta: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
  },
  ctaTextDisabled: {
    color: '#2B1B00',
  },
});

