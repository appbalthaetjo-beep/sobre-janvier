import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();
  const [userScore, setUserScore] = useState(0);
  const [averageScore] = useState(35);

  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDisplayScore = (score: number) => Math.min(Math.max(score, 0), 100);

  const userBarProgress = useSharedValue(0);
  const averageBarProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const calculateScore = async () => {
    try {
      const answersData = await AsyncStorage.getItem('quizAnswers');

      if (!answersData) {
        setUserScore(50);
        return;
      }

      const answers = JSON.parse(answersData);

      const scoreWeights = {
        gender: { masculin: 0, feminin: 0, 'non-binaire': 0 },
        frequency: { 'plus-fois-jour': 25, 'fois-jour': 20, 'fois-semaine': 15, 'moins-semaine': 5 },
        control: { frequemment: 25, occasionnellement: 15, rarement: 5 },
        escalation: { oui: 20, non: 0 },
        firstExposure: { '12-moins': 15, '13-16': 10, '17-24': 5, '25-plus': 0 },
        arousal: { frequemment: 20, occasionnellement: 12, rarement: 3 },
        emotional: { frequemment: 15, occasionnellement: 10, rarement: 2 },
        stress: { frequemment: 15, occasionnellement: 8, rarement: 2 },
        boredom: { frequemment: 10, occasionnellement: 6, rarement: 1 },
        money: { oui: 10, non: 0 },
      };

      let totalScore = 0;
      const maxPossibleScore = 145;

      Object.entries(answers).forEach(([category, answer]) => {
        if (scoreWeights[category] && scoreWeights[category][answer] !== undefined) {
          totalScore += scoreWeights[category][answer];
        }
      });

      const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
      const adjustedScore = Math.min(Math.max(percentageScore, 15), 100);
      setUserScore(adjustedScore);

      try {
        await saveUserData({
          quizScore: adjustedScore,
          quizCompletedAt: new Date().toISOString(),
          scoreDetails: {
            rawScore: totalScore,
            maxPossible: maxPossibleScore,
            percentage: percentageScore,
            adjustedScore,
          },
        });
      } catch (error) {
        console.error('Error saving quiz score to Firebase:', error);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
      setUserScore(40);
    }
  };

  useEffect(() => {
    calculateScore();
  }, []);

  useEffect(() => {
    if (getDisplayScore(userScore) > 0) {
      contentOpacity.value = withTiming(1, { duration: 600 });

      userBarProgress.value = withDelay(
        800,
        withTiming(userScore, {
          duration: 1500,
          easing: Easing.out(Easing.cubic),
        })
      );

      averageBarProgress.value = withDelay(
        1200,
        withTiming(averageScore, {
          duration: 1200,
          easing: Easing.out(Easing.cubic),
        })
      );

      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
      const totalDuration = 2300;
      const tick = 90;
      const start = Date.now();

      hapticIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        if (elapsed >= totalDuration) {
          if (hapticIntervalRef.current) {
            clearInterval(hapticIntervalRef.current);
            hapticIntervalRef.current = null;
          }
          triggerTap('medium');
          return;
        }
        triggerTap('light');
      }, tick);
    }

    return () => {
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    };
  }, [userScore]);

  const getScoreMessage = (score: number) => {
    if (score <= 30) return 'Votre usage semble modéré, mais restez vigilant.';
    if (score <= 60) return "Vos réponses montrent des signes d'habitude préoccupante.";
    return 'Vos réponses suggèrent une consommation problématique de pornographie.';
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return '#10B981';
    if (score <= 60) return '#F59E0B';
    return '#EF4444';
  };

  const handleCheckSymptoms = () => {
    triggerTap('medium');
    router.push('/onboarding/symptoms');
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const userBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(userBarProgress.value, [0, 100], [0, 100])}%`,
  }));

  const averageBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(averageBarProgress.value, [0, 100], [0, 100])}%`,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Résultats du quiz</Text>
          <Text style={styles.headerSubtitle}>
            Voici une estimation basée sur tes réponses. Contacte un professionnel pour un diagnostic complet.
          </Text>
        </View>

        <Animated.View style={[styles.card, contentStyle]}>
          <Text style={styles.cardTitle}>Comparaison avec la moyenne</Text>

          <View style={styles.progressRow}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Votre score</Text>
              <Text style={[styles.progressValue, { color: '#EF4444' }]}>{getDisplayScore(userScore)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFillUser, userBarStyle]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Moyenne générale</Text>
              <Text style={[styles.progressValue, { color: '#34D399' }]}>{averageScore}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFillAvg, averageBarStyle]} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.calloutCard}>
          <Text style={styles.calloutTitle}>Prendre conscience, c'est déjà un grand pas</Text>
          <Text style={styles.calloutText}>
            Reconnaître un problème demande du courage. SOBRE est là pour vous accompagner vers une vie plus libre.
          </Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={[styles.score, { color: getScoreColor(getDisplayScore(userScore)) }]}>{getDisplayScore(userScore)}%</Text>
          <Text style={styles.scoreMessage}>{getScoreMessage(getDisplayScore(userScore))}</Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            * Ce résultat est seulement indicatif et ne constitue pas un diagnostic médical professionnel.
          </Text>
        </View>

        <TouchableOpacity style={styles.symptomButton} onPress={handleCheckSymptoms} activeOpacity={0.9}>
          <Text style={styles.symptomButtonText}>Voir les symptômes et protections</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  progressRow: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  progressValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFillUser: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 999,
  },
  progressBarFillAvg: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 999,
  },
  calloutCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
  calloutText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  scoreCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    alignItems: 'center',
    gap: 8,
  },
  score: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  scoreMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerNote: {
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  symptomButton: {
    marginTop: 12,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  symptomButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
