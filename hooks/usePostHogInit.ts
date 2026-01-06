import { useEffect } from 'react';
import { initPostHog } from '../lib/posthog';

export function usePostHogInit() {
  useEffect(() => {
    void initPostHog();
  }, []);
}
