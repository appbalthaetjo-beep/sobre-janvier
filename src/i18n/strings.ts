export const STR = {
  fr: {
    premiumTitle: "Accès complet à SOBRE.",
    promoTitle: "Accès Premium à SOBRE",
    ctaPromo: "Voir les prix",
    ctaStandard: "Voir les prix",
    restore: "Restaurer l'achat",
    dontShowAgain: "Ne plus me proposer",
    payOnWeb: "Payer sur le web",
    later: "Plus tard",
    seeAllOffers: "Voir toutes les offres",
  },
  en: {
    premiumTitle: "Full access to SOBRE.",
    promoTitle: "Premium Access to SOBRE",
    ctaPromo: "See prices",
    ctaStandard: "See prices",
    restore: "Restore purchase",
    dontShowAgain: "Don't show again",
    payOnWeb: "Pay on the web",
    later: "Later",
    seeAllOffers: "See all offers",
  },
} as const;

export type TranslationKey = keyof typeof STR['fr'];

export function t(key: TranslationKey, locale = 'fr') {
  const lang = locale.startsWith('fr') ? 'fr' : 'en';
  return STR[lang][key] as string;
}
