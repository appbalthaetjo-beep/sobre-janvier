import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type MilestoneNotification = {
  title: string;
  body: string;
};

const MILESTONE_NOTIFICATIONS: Record<number, MilestoneNotification> = {
  1: { title: '💎 Jour 1 — Allumage', body: 'Tu as lancé la flamme. Un jour à la fois.' },
  // 3 intentionally skipped (no notification).
  7: { title: '💎 Jour 7 — Cristal poli', body: '1 semaine : tu prouves que tu peux tenir.' },
  14: { title: '💎 Jour 14 — Clarté', body: 'Ton esprit s’éclaircit. Garde ce cap.' },
  21: { title: '💎 Jour 21 — Momentum', body: 'Tu crées de l’élan. Ne lâche rien.' },
  30: { title: '💎 Jour 30 — Brillance', body: '30 jours : phase de désintox franchie. Respect.' },
  45: { title: '💎 Jour 45 — Maîtrise', body: 'Tu reprends le contrôle sur tes impulsions.' },
  60: { title: '💎 Jour 60 — Résilience', body: 'Tu deviens solide, même quand c’est dur.' },
  75: { title: '💎 Jour 75 — Force', body: 'Ta discipline est une identité maintenant.' },
  90: { title: '💎 Jour 90 — Cristal légendaire', body: 'Tu as fait ce que peu de gens font. Bravo.' },
};

export async function maybeNotifyMilestone(day: number) {
  if (Platform.OS !== 'ios') return;

  const payload = MILESTONE_NOTIFICATIONS[day];
  if (!payload) return;

  try {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: { type: 'milestone', day },
      },
      // Small delay to avoid racing with UI updates.
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.log('[MilestoneNotifications] schedule failed', { day, error });
  }
}

