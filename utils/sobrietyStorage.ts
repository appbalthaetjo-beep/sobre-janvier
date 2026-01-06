import AsyncStorage from '@react-native-async-storage/async-storage';

import { getOrCreatePublicUserId } from './publicUser';

const BASE_DATA_KEY = 'sobrietyData';
const BASE_START_KEY = 'sobrietyStartDate';
const MIGRATION_FLAG_BASE = 'migration_v1_done';

type SobrietyData = Record<string, any>;

function buildKey(base: string, publicUserId: string) {
  return `${base}:${publicUserId}`;
}

async function migrationAlreadyDone(publicUserId: string) {
  const flagKey = buildKey(MIGRATION_FLAG_BASE, publicUserId);
  const flag = await AsyncStorage.getItem(flagKey);
  return flag === 'true';
}

async function markMigrationDone(publicUserId: string) {
  const flagKey = buildKey(MIGRATION_FLAG_BASE, publicUserId);
  await AsyncStorage.setItem(flagKey, 'true');
}

export async function migrateLegacySobrietyData(publicUserId: string) {
  const done = await migrationAlreadyDone(publicUserId);
  if (done) return;

  const namespacedDataKey = buildKey(BASE_DATA_KEY, publicUserId);
  const namespacedStartKey = buildKey(BASE_START_KEY, publicUserId);

  const existingNamespacedData = await AsyncStorage.getItem(namespacedDataKey);
  const existingNamespacedStart = await AsyncStorage.getItem(namespacedStartKey);

  const legacyData = await AsyncStorage.getItem(BASE_DATA_KEY);
  const legacyStart = await AsyncStorage.getItem(BASE_START_KEY);

  if (!existingNamespacedData && legacyData) {
    await AsyncStorage.setItem(namespacedDataKey, legacyData);
  }

  if (!existingNamespacedStart && legacyStart) {
    await AsyncStorage.setItem(namespacedStartKey, legacyStart);
  }

  await markMigrationDone(publicUserId);
}

export async function readSobrietyDataForCurrentUser(): Promise<{
  publicUserId: string;
  data: SobrietyData | null;
  startDate: string | null;
}> {
  const { publicUserId } = await getOrCreatePublicUserId();
  await migrateLegacySobrietyData(publicUserId);

  const dataKey = buildKey(BASE_DATA_KEY, publicUserId);
  const startKey = buildKey(BASE_START_KEY, publicUserId);

  const dataStr = await AsyncStorage.getItem(dataKey);
  const startDate = (await AsyncStorage.getItem(startKey)) ?? null;

  let parsed: SobrietyData | null = null;
  if (dataStr) {
    try {
      parsed = JSON.parse(dataStr);
    } catch {
      parsed = null;
    }
  }

  return { publicUserId, data: parsed, startDate };
}

export async function writeSobrietyDataForCurrentUser(data: SobrietyData) {
  const { publicUserId } = await getOrCreatePublicUserId();
  const dataKey = buildKey(BASE_DATA_KEY, publicUserId);
  await AsyncStorage.setItem(dataKey, JSON.stringify(data));
}

export async function writeSobrietyStartDateForCurrentUser(startDate: string) {
  const { publicUserId } = await getOrCreatePublicUserId();
  const startKey = buildKey(BASE_START_KEY, publicUserId);
  await AsyncStorage.setItem(startKey, startDate);
}

export async function writeSobrietyBundleForCurrentUser(data: SobrietyData) {
  await writeSobrietyDataForCurrentUser(data);
  if (data?.startDate) {
    await writeSobrietyStartDateForCurrentUser(String(data.startDate));
  }
}

export async function getSobrietyKeys(publicUserId: string) {
  return {
    dataKey: buildKey(BASE_DATA_KEY, publicUserId),
    startKey: buildKey(BASE_START_KEY, publicUserId),
    migrationFlagKey: buildKey(MIGRATION_FLAG_BASE, publicUserId),
  };
}

export async function getMigrationState() {
  const { publicUserId } = await getOrCreatePublicUserId();
  const done = await migrationAlreadyDone(publicUserId);
  return { publicUserId, migrationDone: done };
}
