// src/hooks/usePromoCountdown.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_EXPIRES_AT = 'promo_expires_at';
const DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function usePromoCountdown() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const itv = useRef<NodeJS.Timer | null>(null);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(KEY_EXPIRES_AT);
    if (raw) setExpiresAt(Number(raw));
  }, []);

  const startIfNeeded = useCallback(async () => {
    const raw = await AsyncStorage.getItem(KEY_EXPIRES_AT);
    if (!raw) {
      const exp = Date.now() + DURATION_MS;
      await AsyncStorage.setItem(KEY_EXPIRES_AT, String(exp));
      setExpiresAt(exp);
    } else {
      setExpiresAt(Number(raw));
    }
  }, []);

  const reset = useCallback(async () => {
    const exp = Date.now() + DURATION_MS;
    await AsyncStorage.setItem(KEY_EXPIRES_AT, String(exp));
    setExpiresAt(exp);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (itv.current) clearInterval(itv.current);
    itv.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (itv.current) clearInterval(itv.current); };
  }, []);

  const msLeft = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const secondsLeft = Math.floor(msLeft / 1000);
  const expired = secondsLeft <= 0;

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const ss = Math.floor(secondsLeft % 60).toString().padStart(2, '0');

  return { secondsLeft, mm, ss, expired, startIfNeeded, reset };
}
