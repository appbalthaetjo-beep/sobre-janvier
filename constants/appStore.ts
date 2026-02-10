import { getExpoPublicEnv } from '@/lib/publicEnv';

export const APP_STORE_ID = getExpoPublicEnv('EXPO_PUBLIC_APPLE_APP_ID') || '6751785162';
