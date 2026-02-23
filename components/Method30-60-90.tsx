import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Method306090Props {
  daysElapsed: number;
}

export default function Method306090({ daysElapsed }: Method306090Props) {
  const progressAnimation = useSharedValue(0);
  const cursorAnimation = useSharedValue(0);

  const getCurrentPhase = () => {
    if (daysElapsed < 30) return 1;
    if (daysElapsed < 60) return 2;
    if (daysElapsed < 90) return 3;
    return 4;
  };

  const getDayInPhase = () => {
    const phase = getCurrentPhase();
    let dayInPhase = 0;

    switch (phase) {
      case 1:
        dayInPhase = daysElapsed + 1;
        break;
      case 2:
        dayInPhase = daysElapsed - 30 + 1;
        break;
      case 3:
        dayInPhase = daysElapsed - 60 + 1;
        break;
      case 4:
        dayInPhase = ((daysElapsed - 90) % 30) + 1;
        break;
    }
    return Math.max(1, dayInPhase);
  };

  const getSegmentProgress = () => {
    const phase = getCurrentPhase();

    switch (phase) {
      case 1:
        return Math.min((daysElapsed / 30) * 100, 100);
      case 2:
        return Math.min(((daysElapsed - 30) / 30) * 100, 100);
      case 3:
        return Math.min(((daysElapsed - 60) / 30) * 100, 100);
      case 4: {
        const cycleProgress = (daysElapsed - 90) % 30;
        return Math.min((cycleProgress / 30) * 100, 100);
      }
      default:
        return 0;
    }
  };

  const getGlobalProgress = () => Math.min((daysElapsed / 90) * 100, 100);

  const getPhaseData = () => {
    const phase = getCurrentPhase();
    const dayInPhase = getDayInPhase();

    switch (phase) {
      case 1:
        return {
          title: 'Phase 1 — Désintoxication',
          progress: `Jour ${dayInPhase} sur 30`,
          description: 'Libération physique et mentale',
          phaseProgress: getSegmentProgress(),
        };
      case 2:
        return {
          title: 'Phase 2 — Rééquilibrage',
          progress: `Jour ${dayInPhase} sur 30`,
          description: 'Habitudes saines et équilibre émotionnel',
          phaseProgress: getSegmentProgress(),
        };
      case 3:
        return {
          title: 'Phase 3 — Consolidation',
          progress: `Jour ${dayInPhase} sur 30`,
          description: 'Liberté durable et maîtrise totale',
          phaseProgress: getSegmentProgress(),
        };
      case 4:
        return {
          title: 'Phase 4 — Maintien',
          progress: `Jour ${dayInPhase} sur 30`,
          description: 'Cycle de maintien de la liberté',
          phaseProgress: getSegmentProgress(),
        };
      default:
        return {
          title: 'Phase 1 — Désintoxication',
          progress: '0 jours écoulés sur 30',
          description: 'Libération physique et mentale',
          phaseProgress: 0,
        };
    }
  };

  const phaseData = getPhaseData();
  const globalProgress = getGlobalProgress();
  const currentPhase = getCurrentPhase();
  const segmentProgress = getSegmentProgress();

  useEffect(() => {
    progressAnimation.value = withTiming(globalProgress, {
      duration: 2000,
      easing: Easing.out(Easing.cubic),
    });
  }, [globalProgress, progressAnimation]);

  useEffect(() => {
    cursorAnimation.value = withTiming(segmentProgress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [segmentProgress, cursorAnimation]);

  useEffect(() => {
    const isExactMilestone = daysElapsed === 30 || daysElapsed === 60 || daysElapsed === 90;
    if (isExactMilestone && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [daysElapsed]);

  const getSegmentStyle = (segmentIndex: number) => {
    const segmentStart = segmentIndex * 30;
    const segmentEnd = (segmentIndex + 1) * 30;

    if (daysElapsed >= segmentEnd) {
      return { backgroundColor: 'rgba(255, 215, 0, 0.6)' };
    }
    if (daysElapsed >= segmentStart && daysElapsed < segmentEnd) {
      return {
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    return { backgroundColor: 'rgba(255, 255, 255, 0.1)' };
  };

  const cursorTarget = useDerivedValue(() => {
    const currentSegment = Math.floor(daysElapsed / 30);
    if (currentSegment >= 3) return 100;

    const segmentStart = currentSegment * 30;
    const progressInSegment = ((daysElapsed - segmentStart) / 30) * 100;
    const segmentPosition = (currentSegment / 3) * 100;
    const segmentWidth = 100 / 3;
    const cursorInSegment = (progressInSegment / 100) * segmentWidth;

    return Math.min(segmentPosition + cursorInSegment, 100);
  }, [daysElapsed]);

  const cursorPositionStyle = useAnimatedStyle(() => {
    const position = interpolate(cursorAnimation.value, [0, 100], [0, cursorTarget.value]);
    return { left: `${position}%` };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/(tabs)/progress')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBorder}
      >
        <View style={styles.cardInner}>
          <View style={styles.methodHeader}>
            <Text style={styles.methodTitle}>MÉTHODE 30-60-90</Text>
            <Text style={styles.currentPhase}>{phaseData.title}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.segmentedBar}>
              {[0, 1, 2].map((segmentIndex) => (
                <View key={segmentIndex} style={[styles.segment, getSegmentStyle(segmentIndex)]} />
              ))}
            </View>

            {currentPhase <= 3 && (
              <Animated.View style={[styles.cursor, cursorPositionStyle]}>
                <View style={styles.cursorDot} />
              </Animated.View>
            )}

            <View style={styles.phaseMarkers}>
              <View style={[styles.marker, { left: '33.33%' }]}>
                <Text style={styles.markerText}>30j</Text>
              </View>
              <View style={[styles.marker, { left: '66.66%' }]}>
                <Text style={styles.markerText}>60j</Text>
              </View>
              <View style={[styles.marker, { left: '100%' }]}>
                <Text style={styles.markerText}>90j</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomInfo}>
            <Text style={styles.progressText}>{phaseData.progress}</Text>
            <Text style={styles.phaseNameText}>{phaseData.description}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  gradientBorder: {
    borderRadius: 19,
    padding: 1,
  },
  cardInner: {
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 18,
    padding: 20,
  },
  methodHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  currentPhase: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  segmentedBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
  },
  cursor: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  phaseMarkers: {
    position: 'relative',
    height: 20,
    marginTop: 8,
  },
  marker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -15 }],
  },
  markerText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  phaseNameText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#BBBBBB',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});
