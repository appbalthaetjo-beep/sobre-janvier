import React from 'react';
import { Platform, StyleProp, Text, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticsMode = 'none' | 'word' | 'char';
type HapticsImpact = 'light' | 'medium';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  haptics?: HapticsMode;
  hapticsImpact?: HapticsImpact;
  speedMsPerChar?: number;
  onDone?: () => void;
  onProgress?: (shown: string) => void;
};

export default function TypewriterText({
  text,
  style,
  haptics = 'none',
  hapticsImpact = 'light',
  speedMsPerChar = 22,
  onDone,
  onProgress,
}: Props) {
  const [shown, setShown] = React.useState('');
  const didDoneRef = React.useRef(false);
  const lastWordIndexRef = React.useRef(0);
  const lastCharIndexRef = React.useRef(0);

  React.useEffect(() => {
    didDoneRef.current = false;
    lastWordIndexRef.current = 0;
    lastCharIndexRef.current = 0;
    setShown('');

    let index = 0;
    const tick = () => {
      index += 1;
      const next = text.slice(0, index);
      setShown(next);
      onProgress?.(next);

      const impact =
        hapticsImpact === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;

      if (haptics === 'char' && Platform.OS !== 'web') {
        if (index > lastCharIndexRef.current) {
          lastCharIndexRef.current = index;
          void Haptics.impactAsync(impact);
        }
      }

      if (haptics === 'word') {
        const endedWithBoundary = next.endsWith(' ') || next.endsWith('\n') || index >= text.length;
        if (endedWithBoundary) {
          const words = next.trim().split(/\s+/).filter(Boolean);
          if (words.length > lastWordIndexRef.current) {
            lastWordIndexRef.current = words.length;
            if (Platform.OS !== 'web') void Haptics.impactAsync(impact);
          }
        }
      }

      if (index >= text.length && !didDoneRef.current) {
        didDoneRef.current = true;
        onDone?.();
      }
    };

    const interval = setInterval(tick, Math.max(10, speedMsPerChar));
    return () => clearInterval(interval);
  }, [haptics, hapticsImpact, onDone, onProgress, speedMsPerChar, text]);

  return <Text style={style}>{shown}</Text>;
}
