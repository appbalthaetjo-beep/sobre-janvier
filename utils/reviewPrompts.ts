import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { requestFeedback } from '@/utils/feedback';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { APP_STORE_ID } from '@/constants/appStore';
import { getCurrentUser } from '@/lib/auth/supabaseAuth';

type ReviewTrigger = 'milestone7' | 'missions2';

interface ReviewState {
  lastRequestAt?: string | null;
  milestone7Requested?: boolean;
  missions2Requested?: boolean;
  hundredPercentDays?: string[];
}

const STORAGE_PREFIX = 'reviewPromptState_v1';
const COOLDOWN_DAYS = 30;
const APPLE_ID = APP_STORE_ID;

async function getActiveUid(): Promise<string | null> {
  if (USE_SUPABASE_AUTH) {
    const user = await getCurrentUser();
    return user?.id ?? null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { auth } = require('@/lib/firebase');
    return auth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

function logReviewEvent(event: string, detail?: string) {
  const suffix = detail ? `:${detail}` : '';
  console.log(`review:${event}${suffix}`);
}

function getStorageKey(uid: string) {
  return `${STORAGE_PREFIX}_${uid}`;
}

async function loadState(uid: string): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(uid));
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ReviewState;
  } catch (error) {
    console.warn('[ReviewPrompt] Failed to load state', error);
    return {};
  }
}

async function saveState(uid: string, state: ReviewState) {
  try {
    await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(state));
  } catch (error) {
    console.warn('[ReviewPrompt] Failed to save state', error);
  }
}

function isUnderCooldown(state: ReviewState): boolean {
  if (!state.lastRequestAt) {
    return false;
  }

  const last = new Date(state.lastRequestAt).getTime();
  if (Number.isNaN(last)) {
    return false;
  }

  const now = Date.now();
  const diffInDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffInDays < COOLDOWN_DAYS;
}

function getAndroidPackage(): string {
  return (
    Constants?.expoConfig?.android?.package ??
    Constants?.manifest2?.extra?.expoClient?.androidPackage ??
    'com.balthazar.sobre'
  );
}

async function openReviewFallback(platformHint: 'ios' | 'android'): Promise<'ios' | 'android' | 'web' | null> {
  try {
    if (platformHint === 'ios') {
      if (!APPLE_ID) {
        console.warn('[ReviewPrompt] Missing EXPO_PUBLIC_APPLE_APP_ID');
        const genericUrl = 'https://apps.apple.com';
        await Linking.openURL(genericUrl);
        return 'web';
      }
      const iosReviewUrl = `https://apps.apple.com/app/id${APPLE_ID}?action=write-review`;
      await Linking.openURL(iosReviewUrl);
      return 'ios';
    }

    const packageName = getAndroidPackage();
    const marketUrl = `market://details?id=${packageName}&reviewId=0`;
    try {
      await Linking.openURL(marketUrl);
      return 'android';
    } catch (error) {
      const androidReviewUrl = `https://play.google.com/store/apps/details?id=${packageName}&reviewId=0`;
      await Linking.openURL(androidReviewUrl);
      return 'web';
    }
  } catch (error) {
    console.warn('[ReviewPrompt] Failed to open store review page', error);
    return null;
  }
}

async function requestStoreReview(uid: string, trigger: ReviewTrigger, state: ReviewState) {
  if (Platform.OS === 'web') {
    return state;
  }

  const updateScenarioFlag = (nextState: ReviewState) => {
    if (trigger === 'milestone7') {
      nextState.milestone7Requested = true;
    } else if (trigger === 'missions2') {
      nextState.missions2Requested = true;
    }
  };

  const nowIso = new Date().toISOString();

  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) {
      const fallbackPlatform = await openReviewFallback(Platform.OS === 'ios' ? 'ios' : 'android');
      if (fallbackPlatform) {
        logReviewEvent('fallback:opened', fallbackPlatform);
        requestFeedback({ context: trigger });
      }
      const updated = { ...state, lastRequestAt: nowIso };
      updateScenarioFlag(updated);
      return updated;
    }

    await StoreReview.requestReview();
    const updated = { ...state, lastRequestAt: nowIso };
    updateScenarioFlag(updated);
    return updated;
  } catch (error) {
    console.warn('[ReviewPrompt] requestReview failed', error);
    const fallbackPlatform = await openReviewFallback(Platform.OS === 'ios' ? 'ios' : 'android');
    if (fallbackPlatform) {
      logReviewEvent('fallback:opened', fallbackPlatform);
      requestFeedback({ context: trigger });
    }
    const updated = { ...state, lastRequestAt: nowIso };
    updateScenarioFlag(updated);
    return updated;
  }
}

function toLocalDayKey(dateIso: string): string {
  const date = dateIso ? new Date(dateIso) : new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function maybeRequestReviewForUser(uid: string, trigger: ReviewTrigger) {
  let state = await loadState(uid);

  if (trigger === 'milestone7' && state.milestone7Requested) {
    return;
  }
  if (trigger === 'missions2' && state.missions2Requested) {
    return;
  }

  if (isUnderCooldown(state)) {
    const updated = { ...state };
    if (trigger === 'milestone7') {
      updated.milestone7Requested = true;
    } else if (trigger === 'missions2') {
      updated.missions2Requested = true;
    }
    await saveState(uid, updated);
    return;
  }

  logReviewEvent(trigger === 'milestone7' ? 'day7:requested' : 'twoFullDays:requested');
  state = await requestStoreReview(uid, trigger, state);
  await saveState(uid, state);
}

export async function scheduleDay7Prompt() {
  const uid = await getActiveUid();
  if (!uid) {
    return;
  }

  if (AppState.currentState !== 'active') {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        maybeRequestReviewForUser(uid, 'milestone7');
        subscription.remove();
      }
    });
    return;
  }

  await maybeRequestReviewForUser(uid, 'milestone7');
}

export async function recordFullDayAndMaybePrompt(dateIso: string) {
  const uid = await getActiveUid();
  if (!uid) {
    return;
  }

  const dayKey = toLocalDayKey(dateIso);
  let state = await loadState(uid);

  const days = Array.isArray(state.hundredPercentDays) ? [...state.hundredPercentDays] : [];
  if (!days.includes(dayKey)) {
    days.push(dayKey);
  }

  const uniqueDays = Array.from(new Set(days)).sort();
  state.hundredPercentDays = uniqueDays.slice(-10);

  await saveState(uid, state);

  if (state.missions2Requested || uniqueDays.length < 2) {
    return;
  }

  if (isUnderCooldown(state)) {
    return;
  }

  logReviewEvent('twoFullDays:requested');
  await maybeRequestReviewForUser(uid, 'missions2');
}

export async function resetReviewStateForDebug() {
  if (__DEV__) {
    const uid = await getActiveUid();
    if (uid) {
      await AsyncStorage.removeItem(getStorageKey(uid));
    }
  }
}

export function getAppMetadata() {
  const version =
    Constants?.expoConfig?.version ??
    Constants?.manifest2?.extra?.expoClient?.version ??
    'unknown';

  return {
    appVersion: version,
    platform: Platform.OS,
  };
}




