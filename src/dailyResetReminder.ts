import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'dailyResetReminderNotificationId';

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

async function cancelPreviouslyScheduledReminder() {
  try {
    const existingId = await AsyncStorage.getItem(STORAGE_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[DailyResetReminder] cancelled previous scheduled reminder', { existingId });
    }
  } catch (error) {
    console.log('[DailyResetReminder] failed to cancel previous reminder', error);
  }
}

async function shouldScheduleForToday(time: { hour: number; minute: number }): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const family = await import('expo-family-controls');
    const state = await family.getBlockState();
    const unlockedUntil = Number((state as any)?.dailyUnlockedUntil ?? 0);
    const now = new Date();
    const todayAt = new Date(now);
    todayAt.setHours(time.hour, time.minute, 0, 0);

    const reminderTimeStillInFuture = todayAt.getTime() > now.getTime();

    // We want the reminder to coincide with the Daily Reset time (when apps re-lock).
    // If the user already completed today's Daily Reset early, `dailyUnlockedUntil` will be
    // AFTER today's reset time (i.e. tomorrow at reset time). In that case, schedule tomorrow.
    const todayAtSec = todayAt.getTime() / 1000;
    const alreadyDoneForToday = unlockedUntil > todayAtSec;

    if (!reminderTimeStillInFuture) return false;
    if (alreadyDoneForToday) return false;
    return true;
  } catch {
    // If we can't read the state, still schedule (best-effort reminder).
    return true;
  }
}

export async function ensureDailyResetMorningReminderScheduled(options?: { requestPermission?: boolean }) {
  if (Platform.OS !== 'ios') return;

  const requestPermission = options?.requestPermission ?? false;
  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    if (!requestPermission) {
      console.log('[DailyResetReminder] notifications not granted; skipping schedule');
      return;
    }
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') {
      console.log('[DailyResetReminder] notifications permission denied; skipping schedule');
      return;
    }
  }

  let dailyResetTime = '08:00';
  try {
    const family = await import('expo-family-controls');
    const settings = await family.getScheduleSettings();
    if (typeof (settings as any)?.dailyResetTime === 'string') {
      dailyResetTime = (settings as any).dailyResetTime;
    }
  } catch {}

  const parsed = parseTime(dailyResetTime) ?? { hour: 8, minute: 0 };

  // Always keep only 1 scheduled reminder.
  await cancelPreviouslyScheduledReminder();

  const scheduleToday = await shouldScheduleForToday(parsed);
  const now = new Date();
  const todayAt = new Date(now);
  todayAt.setSeconds(0, 0);
  todayAt.setHours(parsed.hour, parsed.minute, 0, 0);
  const tomorrowAt = new Date(todayAt);
  tomorrowAt.setDate(tomorrowAt.getDate() + 1);

  // If we should schedule for today and it's still in the future, do it.
  // Otherwise schedule tomorrow at the same time.
  const next = scheduleToday && todayAt.getTime() > now.getTime() ? todayAt : tomorrowAt;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sobre',
      body: 'Fais ton Daily Reset pour garder tes apps sous contrôle aujourd’hui ✨',
      data: { url: 'sobre://daily-reset', type: 'daily-reset-reminder' },
    },
    trigger: { type: 'date', date: next },
  });

  await AsyncStorage.setItem(STORAGE_KEY, id);
  console.log('[DailyResetReminder] scheduled morning reminder', { id, at: next.toISOString(), time: parsed });
}
