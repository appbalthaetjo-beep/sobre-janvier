import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  interpolate,
  Easing 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const size = Math.min(width * 0.6, 240);
const strokeWidth = 8;
const radius = (size - strokeWidth) / 2;
const circumference = radius * 2 * Math.PI;

interface CircularKnobProps {
  progress: number; // 0 to 1
  children: React.ReactNode;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularKnob({ progress, children }: CircularKnobProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 1],
      [circumference, 0]
    );

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      {/* Background glow effect */}
      <View style={[styles.glowContainer, { width: size + 32, height: size + 32 }]}>
        <View style={[styles.glow, { width: size + 16, height: size + 16 }]} />
      </View>
      
      {/* SVG Circle */}
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#EC4899" />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    borderRadius: 1000,
    backgroundColor: '#4F46E5',
    opacity: 0.1,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});