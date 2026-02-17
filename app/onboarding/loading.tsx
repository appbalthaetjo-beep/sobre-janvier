import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { requestMetaTrackingPermission } from '@/src/lib/metaAppEvents';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CIRCLE_SIZE = 176;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Apprentissage de tes déclencheurs...');
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const progress = useSharedValue(0);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE - CIRCUMFERENCE * progress.value,
  }));

  useAnimatedReaction(
    () => Math.min(Math.round(progress.value * 100), 100),
    (value, previous) => {
      if (value !== previous) {
        runOnJS(setDisplayPercentage)(value);
      }
    },
  );

  useEffect(() => {
    // Request iOS App Tracking Transparency permission during the "analysis" step,
    // not on app launch.
    requestMetaTrackingPermission().catch((error) => {
      console.warn('[MetaEvents] ATT request failed in loading screen', error);
    });

    const steps = [
      'Apprentissage de tes déclencheurs de rechute',
      'Analyse de tes habitudes',
      'Finalisation de ton diagnostic',
    ];

    let currentStep = 0;

    const progressInterval = setInterval(() => {
      progress.value = withTiming(Math.min(progress.value + 0.02, 1), {
        duration: 100,
        easing: Easing.linear,
      });
    }, 100);

    const textInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        setLoadingText(steps[currentStep]);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      router.push('/onboarding/results');
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(timeout);
    };
  }, [progress]);

  return (
    <LinearGradient
      colors={['#0B0B0B', '#000000']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/onboarding/question-13');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.progressCircle}>
              <Defs>
                <SvgLinearGradient id="sobreYellow" x1="0%" y1="50%" x2="100%" y2="50%">
                  <Stop offset="0%" stopColor="#FFEFA3" />
                  <Stop offset="50%" stopColor="#FFD44D" />
                  <Stop offset="100%" stopColor="#FFBF00" />
                </SvgLinearGradient>
              </Defs>

              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />

              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="url(#sobreYellow)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={animatedCircleProps}
                strokeLinecap="round"
              />
            </Svg>

            <View style={styles.percentageContainer}>
              <Text style={styles.percentage}>{displayPercentage}%</Text>
            </View>
          </View>

          <Text style={styles.title}>Calcul en cours</Text>
          <Text style={styles.subtitle}>{loadingText}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 26,
  },
  progressCircle: {
    transform: [{ rotate: '-90deg' }],
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 44,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});
