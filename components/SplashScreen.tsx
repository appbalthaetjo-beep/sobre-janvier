import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  runOnJS,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animations pour chaque mot
  const logoOpacity = useSharedValue(0);
  const word1Opacity = useSharedValue(0); // "Une"
  const word2Opacity = useSharedValue(0); // "pause"
  const word3Opacity = useSharedValue(0); // "pour"
  const word4Opacity = useSharedValue(0); // "réfléchir."
  const word5Opacity = useSharedValue(0); // "Un"
  const word6Opacity = useSharedValue(0); // "pas"
  const word7Opacity = useSharedValue(0); // "de"
  const word8Opacity = useSharedValue(0); // "plus"
  const word9Opacity = useSharedValue(0); // "vers"
  const word10Opacity = useSharedValue(0); // "la"
  const word11Opacity = useSharedValue(0); // "liberté."
  
  useEffect(() => {
    // Animation séquentielle plus lente et élégante
    const animationDuration = 300;
    const wordDelay = 250; // Plus lent : 250ms entre chaque mot

    // Logo apparaît en premier
    logoOpacity.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    });

    // Mots apparaissent progressivement avec délais plus lents
    word1Opacity.value = withDelay(1000, withTiming(1, { duration: animationDuration }));
    word2Opacity.value = withDelay(1000 + wordDelay, withTiming(1, { duration: animationDuration }));
    word3Opacity.value = withDelay(1000 + wordDelay * 2, withTiming(1, { duration: animationDuration }));
    word4Opacity.value = withDelay(1000 + wordDelay * 3, withTiming(1, { duration: animationDuration }));
    word5Opacity.value = withDelay(1000 + wordDelay * 4, withTiming(1, { duration: animationDuration }));
    word6Opacity.value = withDelay(1000 + wordDelay * 5, withTiming(1, { duration: animationDuration }));
    word7Opacity.value = withDelay(1000 + wordDelay * 6, withTiming(1, { duration: animationDuration }));
    word8Opacity.value = withDelay(1000 + wordDelay * 7, withTiming(1, { duration: animationDuration }));
    word9Opacity.value = withDelay(1000 + wordDelay * 8, withTiming(1, { duration: animationDuration }));
    word10Opacity.value = withDelay(1000 + wordDelay * 9, withTiming(1, { duration: animationDuration }));
    word11Opacity.value = withDelay(1000 + wordDelay * 10, withTiming(1, { duration: animationDuration }));

    // Fin automatique après 4 secondes
    const totalDuration = 4000;
    const timer = setTimeout(() => {
      onFinish();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, []);

  // Styles animés pour chaque mot
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const word1Style = useAnimatedStyle(() => ({ opacity: word1Opacity.value }));
  const word2Style = useAnimatedStyle(() => ({ opacity: word2Opacity.value }));
  const word3Style = useAnimatedStyle(() => ({ opacity: word3Opacity.value }));
  const word4Style = useAnimatedStyle(() => ({ opacity: word4Opacity.value }));
  const word5Style = useAnimatedStyle(() => ({ opacity: word5Opacity.value }));
  const word6Style = useAnimatedStyle(() => ({ opacity: word6Opacity.value }));
  const word7Style = useAnimatedStyle(() => ({ opacity: word7Opacity.value }));
  const word8Style = useAnimatedStyle(() => ({ opacity: word8Opacity.value }));
  const word9Style = useAnimatedStyle(() => ({ opacity: word9Opacity.value }));
  const word10Style = useAnimatedStyle(() => ({ opacity: word10Opacity.value }));
  const word11Style = useAnimatedStyle(() => ({ opacity: word11Opacity.value }));
  return (
    <View style={styles.container}>
      {/* Logo centré */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image 
          source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Phrase avec animation mot par mot */}
      <View style={styles.textContainer}>
        <View style={styles.textLine}>
          <Animated.Text style={[styles.word, word1Style]}>«</Animated.Text>
          <Animated.Text style={[styles.word, word1Style]}> Une</Animated.Text>
          <Animated.Text style={[styles.word, word2Style]}> pause</Animated.Text>
          <Animated.Text style={[styles.word, word3Style]}> pour</Animated.Text>
          <Animated.Text style={[styles.word, word4Style]}> réfléchir.</Animated.Text>
        </View>
        
        <View style={styles.textLine}>
          <Animated.Text style={[styles.word, word5Style]}>Un</Animated.Text>
          <Animated.Text style={[styles.word, word6Style]}> pas</Animated.Text>
          <Animated.Text style={[styles.word, word7Style]}> de</Animated.Text>
          <Animated.Text style={[styles.word, word8Style]}> plus</Animated.Text>
          <Animated.Text style={[styles.word, word9Style]}> vers</Animated.Text>
          <Animated.Text style={[styles.word, word10Style]}> la</Animated.Text>
          <Animated.Text style={[styles.word, word11Style]}> liberté.</Animated.Text>
          <Animated.Text style={[styles.word, word11Style]}> »</Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 160,
    height: 53,
  },
  textContainer: {
    alignItems: 'center',
  },
  textLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
  },
  word: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
});