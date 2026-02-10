import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";

// Show banners while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureLocalNotificationPermission() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status === "granted") {
      console.log("[Notifications] permission already granted");
      return true;
    }

    console.log("[Notifications] requesting permission");
    const requested = await Notifications.requestPermissionsAsync();
    console.log("[Notifications] permission request result", { status: requested.status });
    return requested.status === "granted";
  } catch (error) {
    console.warn("[Notifications] failed to ensure permission", error);
    return false;
  }
}

export function initNotificationDeepLinks() {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url as string | undefined;
    if (url) {
      console.log('[Notifications] deep link from notification tap', { url });
      Linking.openURL(url).catch(() => {});
    }
  });

  // Best effort: if the app is launched by tapping a notification, handle it too.
  Notifications.getLastNotificationResponseAsync()
    .then((initial) => {
      const url = initial?.notification?.request?.content?.data?.url as string | undefined;
      if (url) {
        console.log('[Notifications] deep link from initial notification response', { url });
        Linking.openURL(url).catch(() => {});
      }
    })
    .catch(() => {});

  return () => sub.remove();
}
