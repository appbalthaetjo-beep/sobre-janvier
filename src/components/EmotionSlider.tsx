import React from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export type DailyResetMood = 'fragile' | 'neutre' | 'bien' | 'fort';

type Props = {
  value: DailyResetMood;
  onChange: (next: DailyResetMood) => void;
};

const MOODS: { mood: DailyResetMood; emoji: string; label: string; index: number }[] = [
  { mood: 'fragile', emoji: '😞', label: 'fragile', index: 0 },
  { mood: 'neutre', emoji: '😐', label: 'neutre', index: 1 },
  { mood: 'bien', emoji: '🙂', label: 'bien', index: 2 },
  { mood: 'fort', emoji: '💪', label: 'fort', index: 3 },
];

function moodToIndex(mood: DailyResetMood) {
  return MOODS.find((m) => m.mood === mood)?.index ?? 2;
}

function clampIndex(index: number) {
  return Math.max(0, Math.min(3, index));
}

function indexToMood(index: number): DailyResetMood {
  return MOODS[clampIndex(index)]?.mood ?? 'bien';
}

function indexToEmoji(index: number) {
  return MOODS[clampIndex(index)]?.emoji ?? '🙂';
}

function indexToLabel(index: number) {
  return MOODS[clampIndex(index)]?.label ?? 'bien';
}

export default function EmotionSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const dragX = React.useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = React.useState(() => moodToIndex(value));
  const lastIndexRef = React.useRef(activeIndex);
  const gestureStartXRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  React.useEffect(() => {
    if (trackWidth <= 0) return;
    if (isDraggingRef.current) return;
    const index = moodToIndex(value);
    setActiveIndex(index);
    lastIndexRef.current = index;
    dragX.setValue((trackWidth * index) / 3);
  }, [dragX, trackWidth, value]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    setTrackWidth(w);
    const index = isDraggingRef.current ? lastIndexRef.current : moodToIndex(value);
    if (!isDraggingRef.current) setActiveIndex(index);
    lastIndexRef.current = index;
    dragX.setValue((w * index) / 3);
  };

  const setFromX = React.useCallback(
    (x: number, finalize: boolean) => {
      if (trackWidth <= 0) return;
      const clamped = Math.max(0, Math.min(trackWidth, x));
      dragX.setValue(clamped);

      const rawIndex = clampIndex(Math.round((clamped / trackWidth) * 3));
      if (rawIndex !== lastIndexRef.current) {
        lastIndexRef.current = rawIndex;
        setActiveIndex(rawIndex);
        onChange(indexToMood(rawIndex));
        void Haptics.selectionAsync();
      }

      if (finalize) {
        const snapX = (trackWidth * lastIndexRef.current) / 3;
        Animated.spring(dragX, { toValue: snapX, speed: 18, bounciness: 6, useNativeDriver: false }).start();
      }
    },
    [dragX, onChange, trackWidth]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          dragX.stopAnimation((v) => {
            gestureStartXRef.current = v;
          });
        },
        onPanResponderMove: (_evt, gestureState) => {
          setFromX(gestureStartXRef.current + gestureState.dx, false);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          setFromX(gestureStartXRef.current + gestureState.dx, true);
          isDraggingRef.current = false;
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
        },
      }),
    [dragX, setFromX]
  );

  const emoji = indexToEmoji(activeIndex);
  const label = indexToLabel(activeIndex);

  const maxW = Math.max(1, trackWidth);
  const maxLeft = Math.max(0, trackWidth - THUMB);
  const thumbLeft = dragX.interpolate({
    inputRange: [0, maxW],
    outputRange: [0, maxLeft],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>

      <View style={styles.trackOuter} {...panResponder.panHandlers}>
        <View style={styles.trackInner} onLayout={onTrackLayout}>
          <View style={styles.track} />
          <Animated.View pointerEvents="none" style={[styles.trackFill, { width: dragX }]} />
          <Animated.View style={[styles.thumb, { left: thumbLeft }]} />
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const THUMB = 30;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 22,
  },
  trackOuter: {
    width: '100%',
    paddingHorizontal: 18,
  },
  trackInner: {
    width: '100%',
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  thumb: {
    position: 'absolute',
    top: -10,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  label: {
    marginTop: 14,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
});

