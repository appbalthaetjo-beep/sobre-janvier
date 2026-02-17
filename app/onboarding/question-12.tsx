import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';

const GRADIENT_COLORS = ['#FFEFA3', '#FFD44D', '#FFBF00'] as const;

type ScaleValue = 0 | 1 | 2 | 3 | 4;

const EMOJIS: Record<ScaleValue, string> = {
  0: '😣',
  1: '😕',
  2: '😐',
  3: '🙂',
  4: '😄',
};

const TRACK_SIDE_PADDING = 14;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 14;
const SPRING_CONFIG = { damping: 16, stiffness: 220, mass: 0.7 };

export default function Question12Screen() {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();

  const [value, setValue] = useState<ScaleValue>(2);

  const trackMarks = useMemo(() => [0, 1, 2, 3, 4] as const, []);

  const thumbX = useSharedValue(0);
  const startX = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const currentIndex = useSharedValue<ScaleValue>(value);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    trackWidth.value = width;

    const available = Math.max(0, width - TRACK_SIDE_PADDING * 2);
    const initialX = TRACK_SIDE_PADDING + (available * value) / 4 - THUMB_SIZE / 2;

    thumbX.value = initialX;
    startX.value = initialX;
    currentIndex.value = value;
  };

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        startX.value = thumbX.value;
      })
      .onUpdate((event) => {
        const min = TRACK_SIDE_PADDING - THUMB_SIZE / 2;
        const max = Math.max(min, trackWidth.value - TRACK_SIDE_PADDING - THUMB_SIZE / 2);
        const next = Math.max(min, Math.min(max, startX.value + event.translationX));
        thumbX.value = next;

        const available = Math.max(1, trackWidth.value - TRACK_SIDE_PADDING * 2);
        const center = next + THUMB_SIZE / 2;
        const raw = ((center - TRACK_SIDE_PADDING) / available) * 4;
        const idx = Math.max(0, Math.min(4, Math.round(raw))) as ScaleValue;

        if (idx !== currentIndex.value) {
          currentIndex.value = idx;
          runOnJS(setValue)(idx);
        }
      })
      .onEnd(() => {
        const available = Math.max(1, trackWidth.value - TRACK_SIDE_PADDING * 2);
        const center = thumbX.value + THUMB_SIZE / 2;
        const raw = ((center - TRACK_SIDE_PADDING) / available) * 4;
        const idx = Math.max(0, Math.min(4, Math.round(raw))) as ScaleValue;

        const targetX = TRACK_SIDE_PADDING + (available * idx) / 4 - THUMB_SIZE / 2;
        currentIndex.value = idx;
        thumbX.value = withSpring(targetX, SPRING_CONFIG);
        runOnJS(setValue)(idx);
      });
  }, [currentIndex, startX, thumbX, trackWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const handleBack = () => {
    triggerTap('light');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/question-11');
  };

  const handleContinue = useCallback(async () => {
    triggerTap('medium');

    try {
      const existingAnswers = await AsyncStorage.getItem('quizAnswers');
      const answers = existingAnswers ? JSON.parse(existingAnswers) : {};
      answers.porn_impact_scale = value;
      await AsyncStorage.setItem('quizAnswers', JSON.stringify(answers));

      try {
        await saveUserData({ quizAnswers: answers });
        console.log(`✅ Quiz answer saved to Firebase: porn_impact_scale = ${value}`);
      } catch (error) {
        console.error('❌ Error saving quiz answer to Firebase:', error);
      }
    } catch (error) {
      console.error('Error saving quiz answer:', error);
    }

    router.push('/onboarding/question-13');
  }, [saveUserData, triggerTap, value]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <ProgressBar currentStep={12} totalSteps={13} />
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>
          Quel impact la pornographie a-t-elle sur ta vie ?
        </Text>

        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{EMOJIS[value]}</Text>

          <View style={styles.sliderWrap}>
            <LinearGradient
              colors={[...GRADIENT_COLORS]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.track}
              onLayout={onTrackLayout}
            >
              <View style={styles.marks}>
                {trackMarks.map((mark) => (
                  <View key={mark} style={styles.mark} />
                ))}
              </View>
            </LinearGradient>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.thumbOverlay}>
                <Animated.View style={[styles.thumb, thumbStyle]} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.labels}>
              <Text style={styles.labelText}>Nuisible</Text>
              <Text style={styles.labelText}>Bénéfique</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleContinue} style={styles.nextButton}>
          <Text style={styles.nextText}>Suivant →</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 14,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  question: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 38,
    maxWidth: 340,
    marginTop: 6,
  },
  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 22,
  },
  sliderWrap: {
    width: '100%',
    alignSelf: 'stretch',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  marks: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  mark: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  thumbOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
  labelText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 22,
  },
  nextButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
