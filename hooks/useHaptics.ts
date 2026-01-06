import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type TapStyle = 'light' | 'medium';

export function useHaptics() {
  const triggerTap = useCallback((style: TapStyle = 'light') => {
    if (Platform.OS === 'web') return;

    const impactStyle =
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;

    void Haptics.impactAsync(impactStyle);
  }, []);

  return { triggerTap };
}
