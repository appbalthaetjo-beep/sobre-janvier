import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const NAVIGATION_HISTORY_KEY = "debug:navigationHistory";
const NAVIGATION_HISTORY_LIMIT = 40;
const NAVIGATION_DIAGNOSTICS_FLAG = process.env.EXPO_PUBLIC_ENABLE_NAVIGATION_DIAGNOSTICS;
const DEV_FLAG = (globalThis as { __DEV__?: boolean }).__DEV__;
const IS_DEV_BUILD = typeof DEV_FLAG === "boolean" ? DEV_FLAG : false;
const SHOULD_SHOW_NAVIGATION_ALERTS =
  NAVIGATION_DIAGNOSTICS_FLAG === "true"
    ? true
    : NAVIGATION_DIAGNOSTICS_FLAG === "false"
      ? false
      : IS_DEV_BUILD;

type NavigationEvent = {
  path: string;
  action: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

function pruneHistory(events: NavigationEvent[]): NavigationEvent[] {
  if (events.length <= NAVIGATION_HISTORY_LIMIT) {
    return events;
  }
  return events.slice(events.length - NAVIGATION_HISTORY_LIMIT);
}

export async function recordNavigationEvent(event: {
  path: string;
  action: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(NAVIGATION_HISTORY_KEY);
    let history: NavigationEvent[] = [];
    if (existing) {
      try {
        history = JSON.parse(existing) as NavigationEvent[];
      } catch (error) {
        console.error("[Diagnostics] Failed to parse navigation history", error);
      }
    }

    const entry: NavigationEvent = {
      path: event.path,
      action: event.action,
      timestamp: new Date().toISOString(),
      meta: event.meta,
    };

    const nextHistory = pruneHistory([...history, entry]);
    await AsyncStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(nextHistory));

    if (SHOULD_SHOW_NAVIGATION_ALERTS && event.action.startsWith("redirect")) {
      const metaSummary = event.meta ? JSON.stringify(event.meta) : "no meta";
      Alert.alert(
        "Diagnostic",
        `Redirect: ${event.action}\nvers ${event.path}\nmeta: ${metaSummary}`,
      );
    }
  } catch (error) {
    console.error("[Diagnostics] Failed to record navigation event", error);
  }
}

export async function readNavigationHistory(): Promise<NavigationEvent[]> {
  try {
    const existing = await AsyncStorage.getItem(NAVIGATION_HISTORY_KEY);
    if (!existing) {
      return [];
    }
    return JSON.parse(existing) as NavigationEvent[];
  } catch (error) {
    console.error("[Diagnostics] Failed to read navigation history", error);
    return [];
  }
}

export async function clearNavigationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_HISTORY_KEY);
  } catch (error) {
    console.error("[Diagnostics] Failed to clear navigation history", error);
  }
}
