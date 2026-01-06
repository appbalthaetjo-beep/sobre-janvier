// src/utils/promoUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_EXPIRES_AT = 'promo_expires_at';
const KEY_PROMO_SHOWN = 'promo_shown_this_session';

/**
 * Utilitaires pour gérer le système de promo
 */
export const promoUtils = {
  /**
   * Réinitialise le timer de promo (utile pour les tests)
   */
  async resetPromoTimer(): Promise<void> {
    await AsyncStorage.removeItem(KEY_EXPIRES_AT);
  },

  /**
   * Réinitialise le flag de session (utile pour les tests)
   */
  async resetSessionFlag(): Promise<void> {
    await AsyncStorage.removeItem(KEY_PROMO_SHOWN);
  },

  /**
   * Force l'affichage du pop-up promo au prochain chargement
   */
  async forceShowPromo(): Promise<void> {
    await AsyncStorage.removeItem(KEY_PROMO_SHOWN);
    await AsyncStorage.removeItem(KEY_EXPIRES_AT);
  },

  /**
   * Vérifie si le timer de promo est actif
   */
  async isPromoTimerActive(): Promise<boolean> {
    const expiresAt = await AsyncStorage.getItem(KEY_EXPIRES_AT);
    if (!expiresAt) return false;
    
    const now = Date.now();
    const expires = Number(expiresAt);
    return expires > now;
  },

  /**
   * Obtient le temps restant en secondes
   */
  async getTimeRemaining(): Promise<number> {
    const expiresAt = await AsyncStorage.getItem(KEY_EXPIRES_AT);
    if (!expiresAt) return 0;
    
    const now = Date.now();
    const expires = Number(expiresAt);
    return Math.max(0, Math.floor((expires - now) / 1000));
  }
};
