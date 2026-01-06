import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function LoadingScreen() {
  const router = useRouter();
  const [loadingText, setLoadingText] = useState('Calcul en cours...');
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const progress = useSharedValue(0);

  const circleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${progress.value * 360 * 2}deg` }], // Rotation plus rapide pour effet visuel
    };
  });

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: 314 - 314 * progress.value,
  }));

  useAnimatedReaction(
    () => Math.min(Math.round(progress.value * 100), 100),
    (value, previous) => {
      if (value !== previous) {
        runOnJS(setDisplayPercentage)(value);
      }
    }
  );

  useEffect(() => {
    const steps = [
      'Calcul en cours...',
      'Analyse des déclencheurs de rechute...',
      'Analyse des habitudes...',
      'Finalisation des résultats...'
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
        currentStep++;
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
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Cercle de progression */}
        <View style={styles.progressContainer}>
          <Animated.View style={circleAnimatedStyle}>
            <Svg width={120} height={120} style={styles.progressCircle}>
              <>
                {/* Cercle de fond */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#333333"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Cercle de progression */}
                <AnimatedCircle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#FFD700"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={314}
                  animatedProps={animatedCircleProps}
                  strokeLinecap="round"
                />
              </>
            </Svg>
          </Animated.View>
          
          {/* Pourcentage au centre - fixe */}
          <View style={styles.percentageContainer}>
            <Text style={styles.percentage}>{displayPercentage}%</Text>
          </View>
        </View>

        {/* Texte de chargement - fixe */}
        <Text style={styles.loadingText}>{loadingText}</Text>
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
    paddingHorizontal: 20,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 40,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});
