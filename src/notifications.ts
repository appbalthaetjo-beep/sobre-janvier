import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";

// Show banners while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function initNotificationDeepLinks() {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url as string | undefined;
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  });

  // Best effort: if the app is launched by tapping a notification, handle it too.
  Notifications.getLastNotificationResponseAsync()
    .then((initial) => {
      const url = initial?.notification?.request?.content?.data?.url as string | undefined;
      if (url) {
        Linking.openURL(url).catch(() => {});
      }
    })
    .catch(() => {});

  return () => sub.remove();
}

