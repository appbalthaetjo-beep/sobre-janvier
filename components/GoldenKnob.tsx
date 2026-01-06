import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const size = Math.min(width * 0.35, 140); // Taille réduite

interface GoldenKnobProps {
  children?: React.ReactNode;
}

export default function GoldenKnob({ children }: GoldenKnobProps) {
  const rotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    // Rotation lente continue
    rotation.value = withRepeat(
      withTiming(360, { 
        duration: 25000, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      }),
      -1,
      false
    );

    // Effet de pulsation pour le glow
    glowIntensity.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.bezier(0.42, 0, 0.58, 1) 
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowIntensity.value, [0, 1], [0.4, 0.8]);
    const scale = interpolate(glowIntensity.value, [0, 1], [1, 1.15]);
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Glow effect animé */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View style={styles.glow} />
      </Animated.View>

      {/* Knob principal */}
      <Animated.View style={[styles.knob, animatedStyle]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            {/* Gradient radial principal pour l'effet métallique */}
            <RadialGradient id="goldGradient" cx="35%" cy="25%">
              <Stop offset="0%" stopColor="#FFFBEB" />
              <Stop offset="20%" stopColor="#FEF3C7" />
              <Stop offset="45%" stopColor="#F59E0B" />
              <Stop offset="70%" stopColor="#D97706" />
              <Stop offset="85%" stopColor="#B45309" />
              <Stop offset="100%" stopColor="#78350F" />
            </RadialGradient>
            
            {/* Gradient pour l'effet conique */}
            <RadialGradient id="conicEffect" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
              <Stop offset="30%" stopColor="rgba(255, 255, 255, 0.2)" />
              <Stop offset="60%" stopColor="rgba(0, 0, 0, 0.1)" />
              <Stop offset="100%" stopColor="rgba(0, 0, 0, 0.3)" />
            </RadialGradient>

            {/* Gradient pour les reflets */}
            <LinearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
              <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
              <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
            </LinearGradient>
          </Defs>
          
          {/* Cercle principal avec gradient doré */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 3}
            fill="url(#goldGradient)"
            stroke="#451A03"
            strokeWidth={1.5}
          />
          
          {/* Effet conique pour la profondeur */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 8}
            fill="url(#conicEffect)"
            opacity={0.7}
          />
          
          {/* Reflets métalliques multiples */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 15}
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1}
          />
          
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 25}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.8}
          />
          
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 35}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={0.5}
          />

          {/* Reflet principal en haut à gauche */}
          <Circle
            cx={size / 2 - size / 6}
            cy={size / 2 - size / 6}
            r={size / 8}
            fill="url(#highlight)"
            opacity={0.6}
          />

          {/* Ombre interne pour la profondeur */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 5}
            fill="none"
            stroke="rgba(0, 0, 0, 0.2)"
            strokeWidth={2}
          />
        </Svg>
      </Animated.View>

      {/* Contenu au centre (optionnel) */}
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glowContainer: {
    position: 'absolute',
    width: size + 40,
    height: size + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: size + 20,
    height: size + 20,
    borderRadius: (size + 20) / 2,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  knob: {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  svg: {
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});