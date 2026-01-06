import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { trackOnboardingScreen } from '../lib/posthog';

export function useTrackOnboardingScreen(step: number, screenName: string) {
  useFocusEffect(
    useCallback(() => {
      void trackOnboardingScreen({ step, screen_name: screenName });
    }, [screenName, step]),
  );
}
