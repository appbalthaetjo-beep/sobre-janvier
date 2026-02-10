import Constants from 'expo-constants';

type ExpoExtra = Record<string, unknown> & {
  publicEnv?: Record<string, string>;
};

function readExtra(): ExpoExtra | undefined {
  const expoConfigExtra = (Constants as any)?.expoConfig?.extra;
  if (expoConfigExtra && typeof expoConfigExtra === 'object') {
    return expoConfigExtra as ExpoExtra;
  }

  const manifestExtra = (Constants as any)?.manifest?.extra;
  if (manifestExtra && typeof manifestExtra === 'object') {
    return manifestExtra as ExpoExtra;
  }

  const manifest2Extra = (Constants as any)?.manifest2?.extra;
  if (manifest2Extra && typeof manifest2Extra === 'object') {
    return manifest2Extra as ExpoExtra;
  }

  return undefined;
}

export function getExpoPublicEnv(name: string): string | undefined {
  const fromProcessEnv = (process as any)?.env?.[name];
  if (typeof fromProcessEnv === 'string' && fromProcessEnv.trim()) {
    return fromProcessEnv;
  }

  const extra = readExtra();

  const fromExtraPublicEnv = extra?.publicEnv?.[name];
  if (typeof fromExtraPublicEnv === 'string' && fromExtraPublicEnv.trim()) {
    return fromExtraPublicEnv;
  }

  const fromExtraLegacy = (extra as any)?.[name];
  if (typeof fromExtraLegacy === 'string' && fromExtraLegacy.trim()) {
    return fromExtraLegacy;
  }

  return undefined;
}

