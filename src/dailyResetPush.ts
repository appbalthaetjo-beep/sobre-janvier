import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { NativeModulesProxy } from 'expo-modules-core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getExpoPublicEnv } from '@/lib/publicEnv';

const PendingAction = NativeModulesProxy.PendingAction as
  | {
      getDailyResetDeviceKey?: () => string | null | undefined;
      setDailyResetDeviceKey?: (value: string) => boolean;
      getDailyResetBackendUrl?: () => string | null | undefined;
      setDailyResetBackendUrl?: (value: string) => boolean;
    }
  | undefined;

let didInitDailyResetPushContext = false;
let didWarnPendingActionUnavailable = false;
let didLogDerivedBackendUrl = false;
let didLogDeviceKey = false;

function buildEdgeFunctionUrl(): string | null {
  const supabaseUrl = getExpoPublicEnv('EXPO_PUBLIC_SUPABASE_URL')?.trim();
  if (!supabaseUrl) return null;
  // https://xxxx.supabase.co -> https://xxxx.functions.supabase.co/trigger-daily-reset
  const functionsBase = supabaseUrl.replace(/\.supabase\.co\/?$/, '.functions.supabase.co');
  return `${functionsBase}/trigger-daily-reset`;
}

async function ensureDeviceKeyInAppGroup(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }
  if (!PendingAction?.getDailyResetDeviceKey || !PendingAction?.setDailyResetDeviceKey) {
    if (!didWarnPendingActionUnavailable) {
      didWarnPendingActionUnavailable = true;
      console.log('[DailyResetPush] PendingAction deviceKey API unavailable');
    }
    return null;
  }

  const existing = PendingAction.getDailyResetDeviceKey?.();
  if (typeof existing === 'string' && existing.trim()) {
    if (!didLogDeviceKey) {
      didLogDeviceKey = true;
      console.log('[DailyResetPush] deviceKey present in App Group', { suffix: existing.trim().slice(-6) });
    }
    return existing.trim();
  }

  const deviceKey = Crypto.randomUUID();
  const ok = PendingAction.setDailyResetDeviceKey(deviceKey);
  if (!ok) {
    console.log('[DailyResetPush] Failed to persist deviceKey to App Group');
    return null;
  }
  if (!didLogDeviceKey) {
    didLogDeviceKey = true;
    console.log('[DailyResetPush] deviceKey created in App Group', { suffix: deviceKey.slice(-6) });
  }
  return deviceKey;
}

function ensureBackendUrlInAppGroup() {
  if (Platform.OS !== 'ios') {
    return;
  }
  if (!PendingAction?.setDailyResetBackendUrl) {
    return;
  }

  const url = buildEdgeFunctionUrl();
  if (!url) {
    console.log('[DailyResetPush] Missing EXPO_PUBLIC_SUPABASE_URL; cannot derive Edge Function URL');
    return;
  }
  if (!didLogDerivedBackendUrl) {
    didLogDerivedBackendUrl = true;
    console.log('[DailyResetPush] derived Edge Function URL', { url });
  }

  try {
    const current = PendingAction.getDailyResetBackendUrl?.();
    if (current === url) return;
  } catch {}

  const ok = PendingAction.setDailyResetBackendUrl(url);
  if (!ok) {
    console.log('[DailyResetPush] Failed to persist backend URL to App Group');
  }
}

async function getExpoPushTokenIfPermitted(): Promise<string | null> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    return null;
  }

  const projectId =
    (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId ??
    (Constants as any)?.manifest2?.extra?.eas?.projectId ??
    (Constants as any)?.manifest?.extra?.eas?.projectId ??
    undefined;

  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined as any);
  const value = token?.data?.trim();
  return value ? value : null;
}

export async function ensureDailyResetPushRegistered() {
  ensureBackendUrlInAppGroup();

  const deviceKey = await ensureDeviceKeyInAppGroup();
  if (!deviceKey) return { ok: false as const, reason: 'missing_device_key' as const };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? null;
  if (!userId) {
    console.log('[DailyResetPush] No signed-in user; skipping token registration');
    return { ok: false as const, reason: 'no_user' as const };
  }

  const expoPushToken = await getExpoPushTokenIfPermitted();
  if (!expoPushToken) {
    console.log('[DailyResetPush] Notifications not granted; skipping token registration');
    return { ok: false as const, reason: 'no_permission' as const };
  }

  const { error } = await supabase.from('user_devices').upsert(
    {
      user_id: userId,
      device_key: deviceKey,
      expo_push_token: expoPushToken,
    },
    { onConflict: 'device_key' },
  );

  if (error) {
    console.log('[DailyResetPush] Failed to upsert user_devices', error);
    return { ok: false as const, reason: 'db_error' as const };
  }

  console.log('[DailyResetPush] Registered push token for device', { userId, deviceKey });
  return { ok: true as const, deviceKey };
}

export async function initDailyResetPushContext() {
  if (didInitDailyResetPushContext) {
    return;
  }
  didInitDailyResetPushContext = true;

  try {
    ensureBackendUrlInAppGroup();
    await ensureDeviceKeyInAppGroup();
  } catch (error) {
    console.warn('[DailyResetPush] initDailyResetPushContext failed', error);
  }
}

export async function triggerDailyResetPushDebug() {
  if (Platform.OS !== 'ios') {
    return { ok: false as const, reason: 'not_ios' as const };
  }

  ensureBackendUrlInAppGroup();

  const deviceKey = await ensureDeviceKeyInAppGroup();
  if (!deviceKey) {
    return { ok: false as const, reason: 'missing_device_key' as const };
  }

  const backendUrl =
    PendingAction?.getDailyResetBackendUrl?.()?.trim() || buildEdgeFunctionUrl();
  if (!backendUrl) {
    return { ok: false as const, reason: 'missing_backend_url' as const };
  }

  let controller: AbortController | null = null;
  try {
    controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  } catch {}

  const timeout = setTimeout(() => controller?.abort(), 10_000);
  try {
    console.log('[DailyResetPush] debug trigger push', { backendUrl, deviceKeySuffix: deviceKey.slice(-6) });
    const resp = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceKey }),
      signal: controller?.signal,
    });
    const text = await resp.text();
    console.log('[DailyResetPush] debug trigger push response', { status: resp.status, body: text });
    return { ok: resp.ok as const, status: resp.status, body: text, backendUrl };
  } catch (error: any) {
    const message = String(error?.message ?? error);
    console.log('[DailyResetPush] debug trigger push failed', message);
    return { ok: false as const, reason: 'network_error' as const, error: message, backendUrl };
  } finally {
    clearTimeout(timeout);
  }
}
