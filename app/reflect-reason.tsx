import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ReflectReasonScreen() {
  const { reasonText } = useLocalSearchParams();
  const reasonString = Array.isArray(reasonText) ? reasonText[0] : reasonText || '';
  
  // Animation pour l'effet de respiration
  const breatheAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  useEffect(() => {
    // Animation de respiration continue
    breatheAnimation.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.bezier(0.42, 0, 0.58, 1) 
      }),
      -1,
      true
    );

    // Animation de lueur douce
    glowAnimation.value = withRepeat(
      withTiming(1, { 
        duration: 3000, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      }),
      -1,
      true
    );
  }, []);

  const breatheStyle = useAnimatedStyle(() => {
    const scale = interpolate(breatheAnimation.value, [0, 1], [1, 1.08]);
    return {
      transform: [{ scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.2, 0.6]);
    const glowScale = interpolate(glowAnimation.value, [0, 1], [1, 1.15]);
    return {
      opacity,
      transform: [{ scale: glowScale }],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header minimal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Zone de réflexion */}
      <View style={styles.reflectionContainer}>
        {/* Cercle de respiration avec la raison au centre */}
        <View style={styles.breathingCircleContainer}>
          {/* Lueur externe animée */}
          <Animated.View style={[styles.outerGlow, glowStyle]} />
          
          {/* Cercle principal animé */}
          <Animated.View style={[styles.breathingCircle, breatheStyle]}>
            {/* Cercle de fond pour meilleur contraste */}
            <View style={styles.textBackground} />
            
            {/* Texte de la raison */}
            <View style={styles.reasonTextContainer}>
              <Text style={styles.reasonText}>{reasonString}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Bouton terminer */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => router.back()}
        >
          <Text style={styles.finishButtonText}>Terminer la réflexion</Text>
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 12,
    width: 50,
  },
  reflectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  breathingCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  breathingCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    borderWidth: 4,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  textBackground: {
    position: 'absolute',
    width: '85%',
    height: '85%',
    borderRadius: (width * 0.6) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  reasonTextContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    maxWidth: '90%',
  },
  reasonText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    paddingTop: 20,
  },
  finishButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  finishButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
});