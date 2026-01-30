import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DailyCheckinRedirect() {
  useEffect(() => {
    router.replace('/blocking/daily-checkin');
  }, []);

  return null;
}
