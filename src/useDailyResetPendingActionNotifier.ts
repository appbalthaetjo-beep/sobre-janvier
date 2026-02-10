import { useEffect, useRef } from "react";
import { NativeModulesProxy } from "expo-modules-core";
import { router } from "expo-router";
import { Platform } from "react-native";

const PendingAction = NativeModulesProxy.PendingAction as
  | {
      consume(expected: string): boolean;
      consumeIfRecent?: (expected: string, maxAgeSeconds: number) => boolean;
    }
  | undefined;

let didRunPendingActionCheck = false;
let didWarnPendingActionMissing = false;
let didWarnFamilyControlsMissing = false;
let didLogConsumeIfRecentAvailability = false;

const MAX_PENDING_ACTION_AGE_SECONDS = 15;

async function checkAndNotify() {
  if (Platform.OS !== "ios") {
    return;
  }

  if (!PendingAction?.consume) {
    if (!didWarnPendingActionMissing) {
      didWarnPendingActionMissing = true;
      console.log("[DailyReset] PendingAction module unavailable; skipping");
    }
    return;
  }

  const hasConsumeIfRecent = typeof PendingAction.consumeIfRecent === "function";
  if (!didLogConsumeIfRecentAvailability) {
    didLogConsumeIfRecentAvailability = true;
    console.log("[DailyReset] PendingAction.consumeIfRecent available", { available: hasConsumeIfRecent });
  }

  if (!hasConsumeIfRecent) {
    const didClear = PendingAction.consume("daily-reset");
    if (didClear) {
      console.log("[DailyReset] pending action cleared (daily-reset) without recency check");
    }
    return;
  }

  const didConsume = PendingAction.consumeIfRecent!(
    "daily-reset",
    MAX_PENDING_ACTION_AGE_SECONDS
  );
  if (!didConsume) return;

  console.log("[DailyReset] pending action consumed (daily-reset)");

  // Only navigate if Family Controls native module is available; otherwise we risk crashing
  // and getting stuck in an error-boundary remount loop.
  const familyControls = (NativeModulesProxy as any)?.ExpoFamilyControls;
  if (!familyControls) {
    if (!didWarnFamilyControlsMissing) {
      didWarnFamilyControlsMissing = true;
      console.log("[DailyReset] ExpoFamilyControls module unavailable; not navigating to /daily-reset");
    }
    return;
  }

  // Daily Reset flow: when the Shield triggers the pending action, open the Daily Reset screen.
  router.replace("/daily-reset");
}

export function useDailyResetPendingActionNotifier() {
  const runningRef = useRef(false);

  useEffect(() => {
    if (didRunPendingActionCheck) {
      return;
    }
    didRunPendingActionCheck = true;

    const run = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      Promise.resolve()
        .then(() => checkAndNotify())
        .finally(() => {
          runningRef.current = false;
        });
    };

    // Once on launch.
    run();
  }, []);
}
