import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { NativeModulesProxy } from "expo-modules-core";

const PendingAction = NativeModulesProxy.PendingAction as
  | {
      consume(expected: string): boolean;
    }
  | undefined;

async function ensureNotifPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

async function fireDailyResetNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sobre",
      body: "Fais ton check-in Sobre pour déverrouiller tes apps aujourd’hui.",
      data: { url: "sobre://daily-reset" },
    },
    trigger: null,
  });
}

async function checkAndNotify() {
  if (!PendingAction?.consume) {
    return;
  }

  const didConsume = PendingAction.consume("daily-reset");
  if (!didConsume) {
    return;
  }

  await ensureNotifPermission();
  await fireDailyResetNotification();
}

export function useDailyResetPendingActionNotifier() {
  const runningRef = useRef(false);

  useEffect(() => {
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

    // And whenever the app becomes active or goes to background.
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active" || state === "background") {
        run();
      }
    });

    return () => sub.remove();
  }, []);
}

