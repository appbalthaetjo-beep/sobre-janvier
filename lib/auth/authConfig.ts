import { getExpoPublicEnv } from '../publicEnv';

const rawFlag = getExpoPublicEnv('EXPO_PUBLIC_USE_SUPABASE_AUTH');

export const USE_SUPABASE_AUTH = rawFlag ? rawFlag === 'true' : true;
