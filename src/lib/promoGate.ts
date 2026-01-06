// src/lib/promoGate.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_SHOWN = 'promo_last_shown_at';
const KEY_OPT_OUT = 'promo_opt_out';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function shouldShowPromoNow(): Promise<boolean> {
  // Vérifier d'abord si l'utilisateur a opté out
  const optedOut = await isOptedOut();
  if (optedOut) return false;
  
  const raw = await AsyncStorage.getItem(KEY_LAST_SHOWN);
  if (!raw) return true;
  const last = Number(raw);
  return Date.now() - last > ONE_DAY_MS;
}

export async function markPromoShown(): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_SHOWN, String(Date.now()));
}

// util debug optionnel
export async function resetPromoGate(): Promise<void> {
  await AsyncStorage.removeItem(KEY_LAST_SHOWN);
}

// Fonctions pour l'opt-out
export async function isOptedOut(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY_OPT_OUT)) === '1';
}

export async function optOut(): Promise<void> {
  await AsyncStorage.setItem(KEY_OPT_OUT, '1');
}

export async function resetOptOut(): Promise<void> {
  await AsyncStorage.removeItem(KEY_OPT_OUT);
}

// Fonction utilitaire pour obtenir le temps restant avant le prochain affichage
export async function getTimeUntilNextPromo(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_LAST_SHOWN);
  if (!raw) return 0;
  
  const last = Number(raw);
  const nextAvailable = last + ONE_DAY_MS;
  const now = Date.now();
  
  return Math.max(0, nextAvailable - now);
}

// Fonction pour vérifier si le promo peut être affiché maintenant
export async function canShowPromoNow(): Promise<{ canShow: boolean; timeRemaining?: number }> {
  const canShow = await shouldShowPromoNow();
  if (canShow) {
    return { canShow: true };
  }
  
  const timeRemaining = await getTimeUntilNextPromo();
  return { canShow: false, timeRemaining };
}
