import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Trophy, Star } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MilestonePopupProps {
  isVisible: boolean;
  milestone: {
    title: string;
    day: number;
    image: string;
  };
  onHide: () => void;
}

export default function MilestonePopup({ isVisible, milestone, onHide }: MilestonePopupProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);
  const starsScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      if (__DEV__) console.log('🎉 Milestone Popup:', milestone.title, 'at day', milestone.day);
      
      // Animation d'apparition séquentielle
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 150 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      
      // Étoiles apparaissent après
      starsScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 120 }));
      glowOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));

      // Auto-hide après 3 secondes
      const timer = setTimeout(() => {
        hidePopup();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const hidePopup = () => {
    scale.value = withTiming(0.8, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onHide)();
    });
    translateY.value = withTiming(-50, { duration: 300 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  const starsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starsScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, containerStyle]}>
        
        {/* Glow effect de fond */}
        <Animated.View style={[styles.glowBackground, glowStyle]} />
        
        {/* Étoiles décoratives */}
        <Animated.View style={[styles.starsContainer, starsStyle]}>
          <View style={[styles.star, { top: 10, left: 20 }]}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
          </View>
          <View style={[styles.star, { top: 30, right: 25 }]}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
          </View>
          <View style={[styles.star, { bottom: 40, left: 30 }]}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
          </View>
          <View style={[styles.star, { bottom: 15, right: 20 }]}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
          </View>
        </Animated.View>

        {/* Contenu principal */}
        <View style={styles.content}>
          
          {/* Icône trophée */}
          <View style={styles.iconContainer}>
            <Trophy size={32} color="#FFD700" />
          </View>

          {/* Titre principal */}
          <Text style={styles.title}>🎉 Nouveau cristal débloqué !</Text>
          
          {/* Nom du palier */}
          <Text style={styles.milestoneName}>{milestone.title}</Text>
          
          {/* Jour atteint */}
          <View style={styles.dayBadge}>
            <Text style={styles.dayText}>Jour {milestone.day}</Text>
          </View>

          {/* Message de félicitations */}
          <Text style={styles.congratsText}>
            Félicitations pour votre persévérance !
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: width - 48,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 44,
    opacity: 1,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  milestoneName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  congratsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
  },
});