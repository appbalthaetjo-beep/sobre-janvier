import React from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

interface Method306090Props {
  daysElapsed: number;
}

export default function Method306090({ daysElapsed }: Method306090Props) {
  const progressAnimation = useSharedValue(0);
  const cursorAnimation = useSharedValue(0);

  // Calculer la phase actuelle (0, 1, 2 ou 3+)
  const getCurrentPhase = () => {
    if (daysElapsed < 30) return 1;
    if (daysElapsed < 60) return 2;
    if (daysElapsed < 90) return 3;
    return 4; // Phase 4 - Maintien
  };

  // Calculer le jour dans la phase actuelle (1-based pour affichage)
  const getDayInPhase = () => {
    const phase = getCurrentPhase();
    let dayInPhase = 0;
    
    switch (phase) {
      case 1:
        dayInPhase = daysElapsed + 1; // Affichage : jour 1-30
        break;
      case 2:
        dayInPhase = (daysElapsed - 30) + 1; // Affichage : jour 1-30 de phase 2
        break;
      case 3:
        dayInPhase = (daysElapsed - 60) + 1; // Affichage : jour 1-30 de phase 3
        break;
      case 4:
        // Phase 4: cycle de 30 jours (maintien)
        dayInPhase = ((daysElapsed - 90) % 30) + 1;
        break;
    }
    return Math.max(1, dayInPhase);
  };

  // Calculer la progression DANS le segment actuel (0-100%)
  const getSegmentProgress = () => {
    const phase = getCurrentPhase();
    
    switch (phase) {
      case 1:
        // Phase 1: 0-29 jours → progression = daysInt/30 * 100
        return Math.min((daysElapsed / 30) * 100, 100);
      case 2:
        // Phase 2: 30-59 jours → progression = (daysInt-30)/30 * 100
        return Math.min(((daysElapsed - 30) / 30) * 100, 100);
      case 3:
        // Phase 3: 60-89 jours → progression = (daysInt-60)/30 * 100
        return Math.min(((daysElapsed - 60) / 30) * 100, 100);
      case 4:
        // Phase 4: Maintien - cycle de 30 jours
        const cycleProgress = (daysElapsed - 90) % 30;
        return Math.min((cycleProgress / 30) * 100, 100);
      default:
        return 0;
    }
  };

  // Calculer la progression globale pour l'animation (0-100% sur les 90 jours)
  const getGlobalProgress = () => {
    return Math.min((daysElapsed / 90) * 100, 100);
  };

  // Obtenir les données de la phase actuelle
  const getPhaseData = () => {
    const phase = getCurrentPhase();
    const dayInPhase = getDayInPhase();
    
    switch (phase) {
      case 1:
        return {
          title: "Phase 1 — Désintoxication",
          progress: `Jour ${dayInPhase} sur 30`,
          description: "Libération physique et mentale",
          phaseProgress: getSegmentProgress()
        };
      case 2:
        return {
          title: "Phase 2 — Rééquilibrage", 
          progress: `Jour ${dayInPhase} sur 30`,
          description: "Habitudes saines et équilibre émotionnel",
          phaseProgress: getSegmentProgress()
        };
      case 3:
        return {
          title: "Phase 3 — Consolidation",
          progress: `Jour ${dayInPhase} sur 30`,
          description: "Liberté durable et maîtrise totale",
          phaseProgress: getSegmentProgress()
        };
      case 4:
        return {
          title: "Phase 4 — Maintien",
          progress: `Jour ${dayInPhase} sur 30`,
          description: "Cycle de maintien de la liberté",
          phaseProgress: getSegmentProgress()
        };
      default:
        return {
          title: "Phase 1 — Désintoxication",
          progress: "0 jours écoulés sur 30",
          description: "Libération physique et mentale",
          phaseProgress: 0
        };
    }
  };

  const phaseData = getPhaseData();
  const globalProgress = getGlobalProgress();
  const currentPhase = getCurrentPhase();
  const segmentProgress = getSegmentProgress();

  // Animation de la barre de progression globale
  useEffect(() => {
    progressAnimation.value = withTiming(globalProgress, {
      duration: 2000,
      easing: Easing.out(Easing.cubic),
    });
  }, [globalProgress]);

  // Animation du curseur dans le segment actif
  useEffect(() => {
    cursorAnimation.value = withTiming(segmentProgress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [segmentProgress]);

  // Haptic feedback au franchissement de paliers
  useEffect(() => {
    const isExactMilestone = daysElapsed === 30 || daysElapsed === 60 || daysElapsed === 90;
    
    if (isExactMilestone && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [daysElapsed]);

  // Couleurs pour chaque segment selon l'état
  const getSegmentStyle = (segmentIndex: number) => {
    const segmentStart = segmentIndex * 30;
    const segmentEnd = (segmentIndex + 1) * 30;
    
    if (daysElapsed >= segmentEnd) {
      // Segment complété = or désaturé
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.6)',
      };
    } else if (daysElapsed >= segmentStart && daysElapsed < segmentEnd) {
      // Segment actif = or lumineux avec glow
      return {
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
      };
    } else {
      // Segment à venir = gris vide
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      };
    }
  };

  const cursorTarget = useDerivedValue(() => {
    const currentSegment = Math.floor(daysElapsed / 30);

    if (currentSegment >= 3) {
      return 100;
    }

    const segmentStart = currentSegment * 30;
    const progressInSegment = ((daysElapsed - segmentStart) / 30) * 100;
    const segmentPosition = (currentSegment / 3) * 100;
    const segmentWidth = 100 / 3;
    const cursorInSegment = (progressInSegment / 100) * segmentWidth;

    return Math.min(segmentPosition + cursorInSegment, 100);
  }, [daysElapsed]);

  const cursorPositionStyle = useAnimatedStyle(() => {
    const position = interpolate(
      cursorAnimation.value,
      [0, 100],
      [0, cursorTarget.value]
    );
    
    return {
      left: `${position}%`,
    };
  }, []);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/(tabs)/progress')}
      activeOpacity={0.9}
    >
      {/* En-tête du module */}
      <View style={styles.methodHeader}>
        <Text style={styles.methodTitle}>MÉTHODE 30-60-90</Text>
        <Text style={styles.currentPhase}>{phaseData.title}</Text>
      </View>

      {/* Barre de progression segmentée */}
      <View style={styles.progressContainer}>
        <View style={styles.segmentedBar}>
          {/* 3 segments pour les 3 phases principales */}
          {[0, 1, 2].map((segmentIndex) => (
            <View 
              key={segmentIndex}
              style={[
                styles.segment,
                getSegmentStyle(segmentIndex)
              ]}
            />
          ))}
        </View>

        {/* Curseur rond positionné précisément */}
        {currentPhase <= 3 && (
          <Animated.View style={[styles.cursor, cursorPositionStyle]}>
            <View style={styles.cursorDot} />
          </Animated.View>
        )}

        {/* Marqueurs de phase - positionnés proportionnellement */}
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

      {/* Informations sous la barre */}
      <View style={styles.bottomInfo}>
        <Text style={styles.progressText}>{phaseData.progress}</Text>
        <Text style={styles.phaseNameText}>{phaseData.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
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
    top: -4, // Centrer sur la barre
    width: 20,
    height: 20,
    marginLeft: -10, // Centrer le curseur
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
    transform: [{ translateX: -15 }], // Centrer le marqueur
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
