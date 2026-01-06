import React from 'react';
import { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const size = Math.min(width * 0.6, 200);

interface Crystal3DProps {
  children?: React.ReactNode;
}

export default function Crystal3D({ children }: Crystal3DProps) {
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    // Pulsation douce toutes les 3 secondes
    pulseAnimation.value = withRepeat(
      withTiming(1, { 
        duration: 3000, 
        easing: Easing.bezier(0.42, 0, 0.58, 1) 
      }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.05]);
    const glowOpacity = interpolate(pulseAnimation.value, [0, 1], [0.4, 0.7]);
    
    return {
      transform: [{ scale }],
      opacity: glowOpacity,
    };
  });

  return (
    <View style={styles.container}>
      {/* Halo lumineux en dégradé radial SVG - jaune doré premium */}
      <Animated.View style={[styles.glowContainer, pulseStyle]}>
        <Svg 
          width={size * 2.2} 
          height={size * 2.2} 
          style={styles.glowSvg}
        >
          <Defs>
            <RadialGradient 
              id="goldenRadialGlow" 
              cx="50%" 
              cy="50%" 
              r="50%"
            >
              {/* Centre lumineux doré premium */}
              <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
              <Stop offset="20%" stopColor="#FFC107" stopOpacity="0.35" />
              <Stop offset="40%" stopColor="#FF8F00" stopOpacity="0.25" />
              <Stop offset="60%" stopColor="#E65100" stopOpacity="0.15" />
              <Stop offset="80%" stopColor="#BF360C" stopOpacity="0.08" />
              {/* Transition vers transparent */}
              <Stop offset="100%" stopColor="#BF360C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          
          {/* Cercle avec dégradé radial doré */}
          <Circle
            cx="50%"
            cy="50%"
            r="50%"
            fill="url(#goldenRadialGlow)"
          />
        </Svg>
      </Animated.View>

      {/* Cristal principal - image spécifique */}
      <View style={styles.crystal}>
        <Image 
          source={{ uri: 'https://i.imgur.com/nDgOpzY.png' }}
          style={styles.crystalImage}
          resizeMode="contain"
        />
      </View>

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
    marginBottom: 0,
  },
  glowContainer: {
    position: 'absolute',
    width: size * 2.2,
    height: size * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowSvg: {
    position: 'absolute',
  },
  crystal: {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 20,
  },
  crystalImage: {
    width: size,
    height: size,
    zIndex: 25,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
});