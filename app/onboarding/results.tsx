import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, ChevronLeft } from 'lucide-react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CHART_HEIGHT = 290;
const BAR_WIDTH = 78;

const AVERAGE_SCORE = 35;

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function ResultsScreen() {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();

  const [userScore, setUserScore] = useState(0);

  const userBarProgress = useSharedValue(0);
  const averageBarProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreWeights = useMemo(
    () => ({
      gender: { masculin: 0, feminin: 0, 'non-binaire': 0 },
      frequency: {
        'plus-fois-jour': 25,
        'fois-jour': 20,
        'fois-semaine': 15,
        'moins-semaine': 5,
      },
      control: { frequemment: 25, occasionnellement: 15, rarement: 5 },
      escalation: { oui: 20, non: 0 },
      firstExposure: { '12-moins': 15, '13-16': 10, '17-24': 5, '25-plus': 0 },
      arousal: { frequemment: 20, occasionnellement: 12, rarement: 3 },
      stress: { frequemment: 15, occasionnellement: 8, rarement: 2 },
      boredom: { frequemment: 10, occasionnellement: 6, rarement: 1 },
      money: { oui: 10, non: 0 },
      post_masturbation_feeling: {
        disappointed: 12,
        guilty: 15,
        relieved: 6,
        euphoric: 3,
        prefer_not_to_say: 0,
      },
      porn_impact_scale: { 0: 18, 1: 12, 2: 7, 3: 3, 4: 0 },
      recent_effects: { yes: 12, no: 0 },
    }),
    [],
  );

  const maxPossibleScore = useMemo(() => {
    const maxes = Object.values(scoreWeights).map((mapping) => Math.max(...Object.values(mapping)));
    return maxes.reduce((sum, v) => sum + v, 0);
  }, [scoreWeights]);

  useEffect(() => {
    const calculateScore = async () => {
      try {
        const answersData = await AsyncStorage.getItem('quizAnswers');
        if (!answersData) {
          setUserScore(50);
          return;
        }

        const answers = JSON.parse(answersData) as Record<string, unknown>;

        let totalScore = 0;
        for (const [category, answer] of Object.entries(answers)) {
          const mapping = (scoreWeights as Record<string, Record<string, number>>)[category];
          if (!mapping) continue;
          const key = String(answer);
          if (mapping[key] !== undefined) totalScore += mapping[key];
        }

        const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
        const adjustedScore = clampPercent(Math.max(15, percentageScore));
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

    void calculateScore();
  }, [maxPossibleScore, saveUserData, scoreWeights]);

  useEffect(() => {
    const displayUserScore = clampPercent(userScore);
    if (displayUserScore <= 0) return;

    contentOpacity.value = withTiming(1, { duration: 500 });

    userBarProgress.value = withDelay(
      450,
      withTiming(displayUserScore, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    averageBarProgress.value = withDelay(
      650,
      withTiming(AVERAGE_SCORE, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );

    if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    const totalDuration = 1700;
    const tick = 110;
    const start = Date.now();
    hapticIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= totalDuration) {
        if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
        triggerTap('medium');
        return;
      }
      triggerTap('light');
    }, tick);

    return () => {
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    };
  }, [averageBarProgress, contentOpacity, triggerTap, userBarProgress, userScore]);

  const userBarStyle = useAnimatedStyle(() => ({
    height: interpolate(userBarProgress.value, [0, 100], [0, CHART_HEIGHT]),
  }));

  const averageBarStyle = useAnimatedStyle(() => ({
    height: interpolate(averageBarProgress.value, [0, 100], [0, CHART_HEIGHT]),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [10, 0]) }],
  }));

  const delta = clampPercent(userScore) - AVERAGE_SCORE;
  const deltaLabel = delta >= 0 ? `${Math.round(delta)}%` : `${Math.abs(Math.round(delta))}%`;
  const deltaText =
    delta >= 0
      ? `${deltaLabel} de dépendance en plus que la moyenne ↘`
      : `${deltaLabel} de dépendance en moins que la moyenne ↘`;

  const deltaColor = delta >= 0 ? '#DC2626' : '#16A34A';

  const handleCheckSymptoms = () => {
    triggerTap('medium');
    router.push('/onboarding/symptoms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerTap('light');
              if (router.canGoBack()) router.back();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="rgba(255,255,255,0.92)" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, contentStyle]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Analyse complète</Text>
            <CheckCircle2 size={20} color="#22C55E" />
          </View>
          <Text style={styles.lead}>On a quelque chose à te dire…</Text>
          <Text style={styles.message}>
            Tes réponses indiquent une dépendance claire à la pornographie en ligne*
          </Text>

          <View style={styles.chartWrap}>
            <View style={styles.chart}>
              <View style={styles.barColumn}>
                <View style={styles.barBase}>
                  <Animated.View style={[styles.userBar, userBarStyle]}>
                    <Text style={styles.barPercent}>{clampPercent(userScore)}%</Text>
                  </Animated.View>
                </View>
                <Text style={styles.barLabel}>Ton score</Text>
              </View>

              <View style={styles.barColumn}>
                <View style={styles.barBase}>
                  <Animated.View style={[styles.avgBar, averageBarStyle]}>
                    <Text style={styles.barPercentAlt}>{AVERAGE_SCORE}%</Text>
                  </Animated.View>
                </View>
                <Text style={styles.barLabel}>Moyenne</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaText}</Text>
          <Text style={styles.disclaimer}>
            * Ce résultat est indicatif et ne constitue pas un diagnostic médical.
          </Text>

          <TouchableOpacity style={styles.cta} onPress={handleCheckSymptoms} activeOpacity={0.9}>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Vérifier tes symptômes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  topRow: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    paddingTop: 24,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lead: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 14,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 26,
  },
  chartWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  chart: {
    width: Math.min(width - 44, 360),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 22,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barBase: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  userBar: {
    width: BAR_WIDTH,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    minHeight: 46,
  },
  avgBar: {
    width: BAR_WIDTH,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    minHeight: 46,
    backgroundColor: '#16A34A',
  },
  barPercent: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  barPercentAlt: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  barLabel: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.50)',
  },
  deltaText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginTop: 2,
    marginBottom: 14,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 18,
  },
  cta: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
