import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DailyCheckinRedirect() {
  useEffect(() => {
    router.replace('/daily-reset');
  }, []);

  return null;
}
