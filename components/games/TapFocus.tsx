import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Circle {
  id: number;
  x: number;
  y: number;
  size: number;
  lifetime: number;
  created: number;
}

interface TapFocusProps {
  onComplete: () => void;
}

export default function TapFocus({ onComplete }: TapFocusProps) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState<'easy' | 'medium' | 'hard'>('easy');
  
  const gameAreaHeight = height * 0.6;
  const gameAreaWidth = width - 80;
  const circleIdCounter = useRef(0);
  const gameTimer = useRef<NodeJS.Timeout>();
  const spawnTimer = useRef<NodeJS.Timeout>();

  const phaseConfig = {
    easy: { size: 80, spawnInterval: 2000, lifetime: 4000, maxCircles: 1 },
    medium: { size: 60, spawnInterval: 1500, lifetime: 3000, maxCircles: 1 },
    hard: { size: 40, spawnInterval: 1000, lifetime: 2500, maxCircles: 2 }
  };

  const getRandomPosition = (circleSize: number) => {
    const margin = circleSize / 2 + 10;
    return {
      x: Math.random() * (gameAreaWidth - circleSize) + margin,
      y: Math.random() * (gameAreaHeight - circleSize) + margin
    };
  };

  const spawnCircle = () => {
    const config = phaseConfig[phase];
    const position = getRandomPosition(config.size);
    
    const newCircle: Circle = {
      id: circleIdCounter.current++,
      x: position.x,
      y: position.y,
      size: config.size,
      lifetime: config.lifetime,
      created: Date.now()
    };

    setCircles(prev => {
      const filtered = prev.filter(c => Date.now() - c.created < c.lifetime);
      if (filtered.length < config.maxCircles) {
        return [...filtered, newCircle];
      }
      return filtered;
    });
  };

  const removeCircle = (id: number) => {
    setCircles(prev => prev.filter(c => c.id !== id));
  };

  const handleCircleTap = (id: number) => {
    setScore(prev => prev + 10);
    removeCircle(id);
  };

  const updatePhase = () => {
    if (timeLeft > 20) {
      setPhase('easy');
    } else if (timeLeft > 10) {
      setPhase('medium');
    } else {
      setPhase('hard');
    }
  };

  useEffect(() => {
    updatePhase();
  }, [timeLeft]);

  useEffect(() => {
    // Timer principal du jeu
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => onComplete(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, []);

  useEffect(() => {
    // Timer de spawn des cercles
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    
    spawnTimer.current = setInterval(() => {
      spawnCircle();
    }, phaseConfig[phase].spawnInterval);

    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [phase]);

  useEffect(() => {
    // Nettoyage automatique des cercles expirés
    const cleanupInterval = setInterval(() => {
      setCircles(prev => prev.filter(c => Date.now() - c.created < c.lifetime));
    }, 100);

    return () => clearInterval(cleanupInterval);
  }, []);

  const getPhaseColor = () => {
    switch (phase) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TapFocus</Text>
        <Text style={styles.subtitle}>Concentration et réaction</Text>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{timeLeft}s</Text>
            <Text style={styles.statLabel}>Temps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getPhaseColor() }]}>
              {getPhaseText()}
            </Text>
            <Text style={styles.statLabel}>Niveau</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>
      </View>

      <View style={[styles.gameArea, { height: gameAreaHeight }]}>
        {circles.map((circle) => (
          <AnimatedCircle
            key={circle.id}
            circle={circle}
            onTap={() => handleCircleTap(circle.id)}
            onExpire={() => removeCircle(circle.id)}
          />
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Tapez sur les cercles avant qu'ils ne disparaissent !
        </Text>
        <Text style={styles.instructionSubtext}>
          La difficulté augmente toutes les 10 secondes
        </Text>
      </View>
    </View>
  );
}

interface AnimatedCircleProps {
  circle: Circle;
  onTap: () => void;
  onExpire: () => void;
}

function AnimatedCircle({ circle, onTap, onExpire }: AnimatedCircleProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Animation d'apparition
    scale.value = withTiming(1, { duration: 200 });
    
    // Animation de disparition
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onExpire)();
      });
    }, circle.lifetime - 300);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          left: circle.x - circle.size / 2,
          top: circle.y - circle.size / 2,
          width: circle.size,
          height: circle.size,
          borderRadius: circle.size / 2,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.circleButton}
        onPress={onTap}
        activeOpacity={0.8}
      >
        <Text style={styles.circleText}>TAP</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  gameArea: {
    marginHorizontal: 40,
    marginVertical: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333333',
    position: 'relative',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  circleButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  instructions: {
    padding: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
});