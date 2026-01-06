import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';
import { useDailyMissions } from '@/hooks/useDailyMissions';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Mission {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
}

interface MissionCardProps {
  mission: Mission;
  onComplete: (missionId: string) => void;
  onUncheck?: (missionId: string) => void;
  isDevMode?: boolean;
  animationDelay: number;
}

function MissionCard({ mission, onComplete, onUncheck, isDevMode, animationDelay }: MissionCardProps) {
  const scaleAnimation = useSharedValue(0.8);
  const opacityAnimation = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacityAnimation.value = withTiming(1, { duration: 600 });
      scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, animationDelay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
    transform: [{ scale: scaleAnimation.value }],
  }));

  const handlePress = () => {
    if (!mission.completed) {
      onComplete(mission.id);
    } else if (isDevMode && onUncheck) {
      // MODE DEV : Permettre de décocher
      onUncheck(mission.id);
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.missionCard,
          mission.completed && styles.missionCardCompleted,
          isDevMode && mission.completed && styles.missionCardDevMode
        ]}
        onPress={handlePress}
        disabled={!isDevMode && mission.completed}
        activeOpacity={0.8}
      >
        {/* Emoji à gauche */}
        <View style={styles.missionEmoji}>
          <Text style={styles.emojiText}>{mission.emoji}</Text>
        </View>

        {/* Titre au centre - peut revenir à la ligne */}
        <View style={styles.missionContent}>
          <Text style={[
            styles.missionTitle,
            mission.completed && styles.missionTitleCompleted
          ]}>
            {mission.title}
          </Text>
        </View>

        {/* Cercle de validation à droite */}
        <View style={styles.validationCircle}>
          {mission.completed ? (
            <View style={styles.completedCircle}>
              <Check size={16} color="#000000" strokeWidth={3} />
              {isDevMode && (
                <View style={styles.devModeIndicator}>
                  <Text style={styles.devModeText}>DEV</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.incompleteCircle} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BenefitsToast({ 
  isVisible, 
  benefits,
  onClose 
}: { 
  isVisible: boolean;
  benefits: Array<{benefitKey: string; bonusAmount: number}>;
  onClose: () => void;
}) {
  const slideAnimation = useSharedValue(-100);
  const opacityAnimation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      slideAnimation.value = withSpring(0, { damping: 15, stiffness: 100 });
      opacityAnimation.value = withTiming(1, { duration: 300 });
      
      // Auto-hide après 3 secondes
      const timer = setTimeout(() => {
        slideAnimation.value = withTiming(-100, { duration: 300 });
        opacityAnimation.value = withTiming(0, { duration: 300 });
        setTimeout(onClose, 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
    opacity: opacityAnimation.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>🎉 Bénéfices renforcés</Text>
        
        {/* Grille des bénéfices */}
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Text style={styles.benefitName}>{benefit.benefitKey}</Text>
              <Text style={styles.benefitPercentage}>+{benefit.bonusAmount}%</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.toastCTA}
          onPress={() => {
            onClose();
            router.push('/(tabs)/progress');
          }}
        >
          <Text style={styles.toastCTAText}>Voir ma progression</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function DailyMissions() {
  const { 
    missions, 
    loading, 
    completedCount, 
    totalMissions, 
    completeMission,
    uncheckMission,
    lastCompletedMission,
    clearLastCompletedMission,
    isDevMode
  } = useDailyMissions();

  const [showToast, setShowToast] = useState(false);
  const [toastBenefits, setToastBenefits] = useState<Array<{benefitKey: string; bonusAmount: number}>>([]);

  // Écouter les missions complétées pour afficher le toast
  useEffect(() => {
    if (lastCompletedMission) {
      setToastBenefits(lastCompletedMission.bonuses);
      setShowToast(true);
    }
  }, [lastCompletedMission]);

  const handleToastClose = () => {
    setShowToast(false);
    clearLastCompletedMission();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des missions...</Text>
      </View>
    );
  }

  const progressPercentage = (completedCount / totalMissions) * 100;

  return (
    <View style={styles.container}>
      {/* En-tête avec progression */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Missions du jour</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{totalMissions}</Text>
        </View>
      </View>

      {/* Barre de progression globale */}
      <View style={styles.globalProgressContainer}>
        <View style={styles.globalProgressBg}>
          <View 
            style={[
              styles.globalProgressFill,
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Liste des missions */}
      <View style={styles.missionsContainer}>
        {missions.map((mission, index) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onComplete={completeMission}
            onUncheck={uncheckMission}
            isDevMode={isDevMode}
            animationDelay={index * 150}
          />
        ))}
      </View>

      {/* Message de félicitations si toutes complétées */}
      {completedCount === totalMissions && (
        <View style={styles.congratulationsContainer}>
          <Text style={styles.congratulationsText}>
            🎉 Toutes les missions terminées ! Excellent travail !{isDevMode ? ' (MODE DEV)' : ''}
          </Text>
        </View>
      )}

      {/* Toast de bénéfices renforcés */}
      <BenefitsToast
        isVisible={showToast}
        benefits={toastBenefits}
        onClose={handleToastClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 32,
    position: 'relative',
  },
  loadingContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  progressBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  globalProgressContainer: {
    marginBottom: 20,
  },
  globalProgressBg: {
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  globalProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  missionsContainer: {
    gap: 12,
  },
  missionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 70,
  },
  missionCardCompleted: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  missionEmoji: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emojiText: {
    fontSize: 24,
  },
  missionContent: {
    flex: 1,
    paddingRight: 12,
  },
  missionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 22,
    flexWrap: 'wrap', // Permet le retour à la ligne
  },
  missionTitleCompleted: {
    color: '#FFD700',
  },
  validationCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCircle: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  incompleteCircle: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 16,
    width: 32,
    height: 32,
  },
  missionCardDevMode: {
    borderColor: '#F59E0B', // Orange pour indiquer le mode DEV
  },
  devModeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  devModeText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  congratulationsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  congratulationsText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 24,
  },
  toastContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Backdrop blur effect
    backdropFilter: 'blur(20px)',
  },
  toastTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
    fontWeight: '700',
  },
  toastSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  benefitsGrid: {
    alignSelf: 'stretch',
    marginBottom: 24,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Gradient effect simulation
    position: 'relative',
  },
  benefitName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  benefitPercentage: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 72,
    textAlign: 'center',
    letterSpacing: -0.1,
    fontWeight: '700',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastCTA: {
    backgroundColor: 'rgba(55, 55, 55, 0.8)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toastCTAText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.1,
    fontWeight: '600',
  },
});