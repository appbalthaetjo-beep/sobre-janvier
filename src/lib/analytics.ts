// Lightweight analytics shim (Firebase Analytics removed). Hook your own tracking here.

export async function logEvent(name: string, params: Record<string, any> = {}) {
  if (__DEV__) {
    console.log(`[Analytics] ${name}`, params);
  }
}

export const promoEvents = {
  impression: (source: 'auto' | 'manual') => logEvent('promo_impression', { source }),
  ctaClick: (cta: 'deal' | 'standard') => logEvent('promo_cta_click', { cta }),
  optOut: () => logEvent('promo_opt_out'),
  paywallOpen: (offering: 'promo' | 'default') => logEvent('paywall_open', { offering }),
  purchaseSuccess: (offering: 'promo' | 'default', productId?: string) =>
    logEvent('purchase_success', { offering, productId }),
  purchaseCancel: (offering: 'promo' | 'default') => logEvent('purchase_cancel', { offering }),
  restoreSuccess: () => logEvent('restore_success'),
  webPurchaseClick: (offering: 'promo' | 'default') => logEvent('web_purchase_click', { offering }),
};
