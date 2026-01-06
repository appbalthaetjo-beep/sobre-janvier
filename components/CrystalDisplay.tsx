import React, { useEffect } from 'react';
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

interface CrystalDisplayProps {
  daysElapsed: number;
  children?: React.ReactNode;
}

export default function CrystalDisplay({ daysElapsed, children }: CrystalDisplayProps) {
  const pulseAnimation = useSharedValue(0);

  const milestones = [
    { day: 1, title: "Allumage", image: "https://i.imgur.com/I0CDkDl.png" },
    { day: 3, title: "Stabilité", image: "https://i.imgur.com/cniGCsd.png" },
    { day: 7, title: "Cristal poli", image: "https://i.imgur.com/LNMqJ98.png" },
    { day: 14, title: "Clarté", image: "https://i.imgur.com/MKLuVcH.png" },
    { day: 21, title: "Momentum", image: "https://i.imgur.com/Vl6qAgW.png" },
    { day: 30, title: "Brillance", image: "https://i.imgur.com/MY22kz8.png" },
    { day: 45, title: "Maîtrise", image: "https://i.imgur.com/umTTlbn.png" },
    { day: 60, title: "Résilience", image: "https://i.imgur.com/nDgOpzY.png" },
    { day: 75, title: "Force", image: "https://i.imgur.com/GeKdi4a.png" },
    { day: 90, title: "Cristal légendaire", image: "https://i.imgur.com/hPEjBe0.png" }
  ];

  // Trouver le cristal actuel basé sur les jours
  const getCurrentCrystal = () => {
    
    // LOGIQUE UNIFIÉE DES PALIERS
    // Jour 0 = pas encore de cristal, utiliser le premier par défaut
    if (daysElapsed < 1) {
      return milestones[0]; // Allumage par défaut
    }
    
    // Trouver le dernier palier atteint
    let currentCrystal = milestones[0]; // Par défaut
    
    for (const milestone of milestones) {
      if (daysElapsed >= milestone.day) { // >= pour inclure le jour exact
        currentCrystal = milestone;
      } else {
        break; // Arrêter dès qu'on trouve un palier non atteint
      }
    }
    return currentCrystal;
  };

  const currentCrystal = getCurrentCrystal();

  // Taille uniforme pour tous les cristaux (comme le premier)
  const crystalSize = width * 0.6;
  const haloSize = crystalSize * 2.4;

  useEffect(() => {
    // Pulsation douce continue du halo doré
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
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.08]);
    const glowOpacity = interpolate(pulseAnimation.value, [0, 1], [0.5, 0.8]);
    
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
          width={haloSize} 
          height={haloSize} 
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

      {/* Cristal principal - image spécifique basée sur les jours */}
      <View style={[styles.crystal, { width: crystalSize, height: crystalSize }]}>
        <Image 
          source={{ uri: currentCrystal.image }}
          style={[styles.crystalImage, { width: crystalSize, height: crystalSize }]}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowSvg: {
    position: 'absolute',
  },
  crystal: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 20,
  },
  crystalImage: {
    zIndex: 25,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
});