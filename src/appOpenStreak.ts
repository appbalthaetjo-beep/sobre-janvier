import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_OPEN_DAY = 'appOpenStreak:lastDay';
const KEY_STREAK_COUNT = 'appOpenStreak:count';

function getLocalDayKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayKey(date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDayKey(yesterday);
}

export async function getAppOpenStreak() {
  const raw = await AsyncStorage.getItem(KEY_STREAK_COUNT);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function bumpAppOpenStreak() {
  const today = getLocalDayKey();
  const yesterday = getYesterdayKey();

  const [lastDayRaw, countRaw] = await AsyncStorage.multiGet([KEY_LAST_OPEN_DAY, KEY_STREAK_COUNT]);
  const lastDay = lastDayRaw?.[1] ?? null;
  const prevCount = countRaw?.[1] ? Number(countRaw[1]) : 0;
  const safePrev = Number.isFinite(prevCount) && prevCount > 0 ? prevCount : 0;

  if (lastDay === today) {
    return { count: safePrev, didIncrement: false };
  }

  const nextCount = lastDay === yesterday ? safePrev + 1 : 1;
  await AsyncStorage.multiSet([
    [KEY_LAST_OPEN_DAY, today],
    [KEY_STREAK_COUNT, String(nextCount)],
  ]);

  return { count: nextCount, didIncrement: true };
}

