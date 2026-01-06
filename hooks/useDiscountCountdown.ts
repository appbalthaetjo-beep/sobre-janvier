import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'paywall_discount_expires_at';
const DURATION_MS = 15 * 60 * 1000;

export function useDiscountCountdown(active: boolean) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const ensureTimer = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) {
          setExpiresAt(parsed);
          return;
        }
      }

      const nextExpiration = Date.now() + DURATION_MS;
      await AsyncStorage.setItem(STORAGE_KEY, String(nextExpiration));
      setExpiresAt(nextExpiration);
    } catch (error) {
      console.error('Failed to ensure discount timer:', error);
    }
  }, []);

  const clearTimer = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear discount timer:', error);
    } finally {
      setExpiresAt(null);
    }
  }, []);

  useEffect(() => {
    if (active) {
      ensureTimer();
    }
  }, [active, ensureTimer]);

  useEffect(() => {
    if (!expiresAt || !active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [expiresAt, active]);

  const remainingMs = useMemo(() => {
    if (!expiresAt) return DURATION_MS;
    return Math.max(0, expiresAt - now);
  }, [expiresAt, now]);

  const remainingSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
  const expired = remainingMs <= 0;

  return {
    expired,
    remainingMs,
    minutes,
    seconds,
    ensureTimer,
    clearTimer,
  };
}
