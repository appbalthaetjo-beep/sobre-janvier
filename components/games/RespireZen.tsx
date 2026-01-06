import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface RespireZenProps {
  onComplete: () => void;
}

export default function RespireZen({ onComplete }: RespireZenProps) {
  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);
  
  const currentPhase = useRef<'inspire' | 'hold' | 'expire'>('inspire');
  const [phaseText, setPhaseText] = useState('Inspire quand la balle monte');
  const [timeLeft, setTimeLeft] = useState(30);
  const gameTimer = useRef<NodeJS.Timeout>();
  const phaseTimer = useRef<NodeJS.Timeout>();

  // Définir les points du trapèze (en forme de montagne)
  const trapezePath = {
    // Point de départ (bas gauche)
    start: { x: width * 0.05, y: height * 0.8 },
    // Sommet gauche (haut gauche)
    leftPeak: { x: width * 0.35, y: height * 0.15 },
    // Sommet droit (haut droit) 
    rightPeak: { x: width * 0.65, y: height * 0.15 },
    // Point final (bas droit)
    end: { x: width * 0.95, y: height * 0.8 }
  };

  const phases = {
    inspire: { 
      duration: 4000, 
      text: 'Inspire quand la balle monte',
      from: trapezePath.start,
      to: trapezePath.leftPeak
    },
    hold: { 
      duration: 7000, 
      text: 'Retiens quand elle reste plate',
      from: trapezePath.leftPeak,
      to: trapezePath.rightPeak
    },
    expire: { 
      duration: 8000, 
      text: 'Expire quand elle descend',
      from: trapezePath.rightPeak,
      to: trapezePath.end
    }
  };

  const getRandomVariation = () => {
    return (Math.random() - 0.5) * 1000; // ±0.5s variation
  };

  const animatePhase = () => {
    const phase = phases[currentPhase.current];
    const randomDuration = phase.duration + getRandomVariation();
    
    // Légères variations de position
    const fromX = phase.from.x + (Math.random() - 0.5) * 20;
    const fromY = phase.from.y + (Math.random() - 0.5) * 10;
    const toX = phase.to.x + (Math.random() - 0.5) * 20;
    const toY = phase.to.y + (Math.random() - 0.5) * 10;

    // Position initiale
    ballX.value = fromX;
    ballY.value = fromY;

    // Animation vers la position finale
    ballX.value = withTiming(toX, {
      duration: randomDuration,
      easing: currentPhase.current === 'hold' ? 
        Easing.linear : Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    
    ballY.value = withTiming(toY, {
      duration: randomDuration,
      easing: currentPhase.current === 'hold' ? 
        Easing.linear : Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    // Mettre à jour le texte
    setPhaseText(phase.text);

    // Timer pour passer à la phase suivante
    phaseTimer.current = setTimeout(() => {
      nextPhase();
    }, randomDuration);
  };

  const nextPhase = () => {
    if (currentPhase.current === 'inspire') {
      currentPhase.current = 'hold';
    } else if (currentPhase.current === 'hold') {
      currentPhase.current = 'expire';
    } else {
      currentPhase.current = 'inspire';
    }
    
    animatePhase();
  };

  const startBreathingExercise = () => {
    // Position initiale de la balle
    ballX.value = trapezePath.start.x;
    ballY.value = trapezePath.start.y;
    
    // Démarrer l'animation
    animatePhase();
    
    // Timer principal du jeu
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startBreathingExercise();
    
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, []);

  const ballStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: ballX.value - 20, // Centrer la balle (rayon = 20)
    top: ballY.value - 20,
  }));

  // Points pour dessiner le trapèze en SVG
  const trapezeSvgPoints = `${trapezePath.start.x},${trapezePath.start.y} ${trapezePath.leftPeak.x},${trapezePath.leftPeak.y} ${trapezePath.rightPeak.x},${trapezePath.rightPeak.y} ${trapezePath.end.x},${trapezePath.end.y}`;

  return (
    <View style={styles.container}>
      {/* Instructions en haut */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>{phaseText}</Text>
      </View>

      {/* Zone de respiration avec tracé et balle */}
      <View style={styles.breathingArea}>
        {/* Tracé en trapèze (SVG) */}
        <Svg 
          width={width} 
          height={height * 0.8} 
          style={styles.svg}
        >
          <Polyline
            points={trapezeSvgPoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {/* Balle animée */}
        <Animated.View style={[styles.ball, ballStyle]} />
      </View>

      {/* Bouton Terminer l'exercice */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={() => setTimeout(() => onComplete(), 0)}
        >
          <Text style={styles.finishButtonText}>Terminer l'exercice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  instructionsContainer: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  breathingArea: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 20,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ball: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  finishButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});