import { useEffect } from 'react';

declare global {
  interface GlobalFramework {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // When the JS bundle runs inside Hermes (TestFlight/production), `window`
    // isn't defined like it is on web. Using `globalThis` ensures we safely
    // reach the callback without triggering a ReferenceError that crashes the app.
    const globalScope = globalThis as typeof globalThis & GlobalFramework & { window?: GlobalFramework };
    const target = globalScope.window ?? globalScope;
    target.frameworkReady?.();
  }, []);
}
