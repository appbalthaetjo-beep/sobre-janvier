import { useEffect } from 'react';
import { setupMetaAppEvents } from '@/src/lib/metaAppEvents';

export function useMetaAppEvents() {
  useEffect(() => {
    let isMounted = true;
    let teardown: (() => void) | undefined;

    const start = async () => {
      // Do not show the ATT prompt on app launch; request later during onboarding.
      const cleanup = await setupMetaAppEvents();

      if (!isMounted) {
        cleanup?.();
        return;
      }

      teardown = cleanup;
    };

    start().catch((error) => {
      console.warn('[MetaEvents] hook setup failed', error);
    });

    return () => {
      isMounted = false;
      teardown?.();
    };
  }, []);
}
