# Système de Pop-up Promo V2 - Complet

## Vue d'ensemble

Le système de pop-up promo V2 inclut la localisation, des hooks de suivi (sans Firebase Analytics), l'option "Ne plus me proposer" et le fallback web pour les paiements.

## Nouvelles Fonctionnalités

### 🌍 **1. Localisation (i18n)**
- **Fichier** : `src/i18n/strings.ts`
- **Langues** : Français (par défaut) + Anglais (fallback)
- **Fonction** : `t(key, locale)` pour récupérer les libellés
- **Usage** : `t('promoTitle')` → "Promo de lancement" (FR) / "Launch promo" (EN)

### 📊 **2. Hooks de suivi (sans Firebase)**
- **Fichier** : `src/lib/analytics.ts`
- **Événements trackés** :
  - `promo_impression` : Affichage du pop-up (source: auto/manual)
  - `promo_cta_click` : Clic sur un CTA (cta: deal/standard)
  - `paywall_open` : Ouverture d'un paywall (offering: promo/default)
  - `purchase_success` : Achat réussi (offering, productId)
  - `purchase_cancel` : Annulation d'achat (offering)
  - `restore_success` : Restauration réussie
  - `promo_opt_out` : Désinscription des promos
  - `web_purchase_click` : Clic sur paiement web (offering)

### 🚫 **3. Option "Ne plus me proposer"**
- **Fichier** : `src/lib/promoGate.ts`
- **Fonctions** :
  - `isOptedOut()` : Vérifie si l'utilisateur a opté out
  - `optOut()` : Marque l'utilisateur comme opté out
  - `resetOptOut()` : Réinitialise l'opt-out (debug)
- **Comportement** : Si opté out, `shouldShowPromoNow()` retourne toujours `false`

### 🌐 **4. Fallback Web pour les Paiements**
- **Fichier** : `src/lib/revenuecat.ts`
- **Fonction** : `openWebPurchase(offering: 'promo' | 'default')`
- **Configuration** : Variables `WEB_PURCHASE_LINK_PROMO` et `WEB_PURCHASE_LINK_DEFAULT`
- **Usage** : Bouton "Payer sur le web" dans le pop-up

## Architecture Complète

### **Fichiers Principaux**

```
src/
├── i18n/
│   └── strings.ts              # Libellés FR/EN
├── lib/
│   ├── analytics.ts            # Hooks de suivi (sans Firebase)
│   ├── promoGate.ts            # Gestion 24h + opt-out
│   └── revenuecat.ts           # Paywalls + fallback web
├── components/
│   ├── PromoModal.tsx          # Pop-up avec toutes les fonctionnalités
│   └── PromoDebugPanel.tsx     # Panel de debug complet
└── hooks/
    └── usePromoCountdown.ts    # Timer 5 minutes
```

### **Composants Mis à Jour**

- **PromoModal** : Libellés localisés + tracking + opt-out + web
- **PaywallButton** : Libellés localisés
- **HomeScreen** : Libellés localisés + source tracking
- **PromoDebugPanel** : Affichage opt-out + bouton reset

## Règles d'Affichage (Mises à Jour)

### ✅ **Le pop-up s'affiche SI :**
1. L'utilisateur n'a **PAS** l'accès premium
2. L'utilisateur n'a **PAS** opté out
3. **24h se sont écoulées** depuis le dernier affichage
4. L'utilisateur ouvre l'app (délai de 2s)

### ❌ **Le pop-up ne s'affiche PAS SI :**
1. L'utilisateur a **déjà l'accès premium**
2. L'utilisateur a **opté out** ("Ne plus me proposer")
3. **Moins de 24h** se sont écoulées depuis le dernier affichage
4. L'utilisateur a déjà vu le pop-up dans cette session

## Interface Utilisateur

### **Pop-up Promo (PromoModal)**
```
┌─────────────────────────────┐
│ Promo de lancement          │
│ -22% Se termine dans 04:32  │
│                             │
│ Accès complet à SOBRE...    │
│                             │
│ [J'en profite]              │ ← CTA Principal
│ [Voir les prix]             │ ← CTA Secondaire
│ [Payer sur le web]          │ ← Fallback Web
│ [Restaurer l'achat]         │ ← Restauration
│ [Ne plus me proposer]       │ ← Opt-out
│ [Plus tard]                 │ ← Fermer
└─────────────────────────────┘
```

### **Comportement des CTA**

#### **Avant Expiration (Timer > 0) :**
- **"J'en profite"** → `promo_cta_click(deal)` → `showPromoPaywall()`
- **"Voir les prix"** → `promo_cta_click(standard)` → `showDefaultPaywall()`

#### **Après Expiration (Timer = 0) :**
- **"Voir les prix"** → `promo_cta_click(standard)` → `showDefaultPaywall()`
- **"Voir les prix"** → `promo_cta_click(standard)` → `showDefaultPaywall()`

## Configuration Requise

### **1. RevenueCat**
```typescript
// Dans src/lib/revenuecat.ts
const RC_IOS_API_KEY = 'VOTRE_CLE_IOS';
const RC_ANDROID_API_KEY = 'VOTRE_CLE_ANDROID';
export const ENTITLEMENT_ID = 'Accès à SOBRE.';

// Web Purchase Links
export const WEB_PURCHASE_LINK_PROMO = 'https://votre-lien-promo.com';
export const WEB_PURCHASE_LINK_DEFAULT = 'https://votre-lien-default.com';
```

### **2. Tracking (optionnel)**
- Firebase Analytics supprimee. Les evenements promo passent par `src/lib/analytics.ts`.
- Raccordez `logEvent` a Supabase ou un autre backend si vous souhaitez conserver des metriques.

### **3. Offerings RevenueCat**
- `default` : Offering standard (prix normal)
- `promo` : Offering promo (prix d'intro -22%)

## Tests et Debug

### **Panel de Debug**
```typescript
// Ajouter dans votre écran (dev uniquement)
import PromoDebugPanel from '@/src/components/PromoDebugPanel';

// Dans le JSX
<PromoDebugPanel />
```

### **Informations Affichées**
- Timer en temps réel (MM:SS)
- Statut d'expiration
- Accès premium (Oui/Non)
- Opt-out (Oui/Non)
- Statut du cap 24h
- Boutons de reset

### **Fonctions de Debug**
- `resetPromoGate()` : Réinitialise le cap 24h
- `resetOptOut()` : Réinitialise l'opt-out
- `promoUtils.forceShowPromo()` : Force l'affichage
- `promoUtils.resetSessionFlag()` : Réinitialise la session

## Evenements (hooks de tracking)

### **Impression**
```typescript
promoEvents.impression('auto');  // Affichage automatique
promoEvents.impression('manual'); // Ouverture manuelle
```

### **Clics CTA**
```typescript
promoEvents.ctaClick('deal');     // "J'en profite"
promoEvents.ctaClick('standard'); // "Voir les prix"
```

### **Paywalls**
```typescript
promoEvents.paywallOpen('promo');   // Paywall promo
promoEvents.paywallOpen('default'); // Paywall standard
```

### **Achats**
```typescript
promoEvents.purchaseSuccess('promo', 'product_id');
promoEvents.purchaseCancel('default');
promoEvents.restoreSuccess();
```

### **Opt-out**
```typescript
promoEvents.optOut(); // Utilisateur a opté out
```

## Localisation

### **Ajouter une Nouvelle Langue**
```typescript
// Dans src/i18n/strings.ts
export const STR = {
  fr: { /* libellés français */ },
  en: { /* libellés anglais */ },
  es: { /* libellés espagnols */ }, // Nouvelle langue
} as const;

// Mettre à jour la fonction t()
export function t(key: keyof typeof STR['fr'], locale = 'fr') {
  const lang = locale.startsWith('fr') ? 'fr' : 
               locale.startsWith('en') ? 'en' : 
               locale.startsWith('es') ? 'es' : 'fr';
  return STR[lang][key];
}
```

### **Ajouter un Nouveau Libellé**
```typescript
// Dans src/i18n/strings.ts
export const STR = {
  fr: {
    // ... libellés existants
    newLabel: "Nouveau libellé",
  },
  en: {
    // ... libellés existants
    newLabel: "New label",
  },
} as const;

// Usage
const text = t('newLabel');
```

## Dépannage

### **Le pop-up ne s'affiche pas :**
1. Vérifier `userHasAccess()` → doit retourner `false`
2. Vérifier `isOptedOut()` → doit retourner `false`
3. Vérifier `shouldShowPromoNow()` → doit retourner `true`
4. Vérifier les clés API RevenueCat (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`, `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY` ou `EXPO_PUBLIC_REVENUECAT_API_KEY`)

### **Les libellés ne s'affichent pas :**
1. Vérifier l'import : `import { t } from '@/src/i18n/strings'`
2. Vérifier la clé dans `STR.fr` et `STR.en`
3. Vérifier l'usage : `t('clé')`

### **Le tracking ne fonctionne pas :**
1. Verifier l'import : `import { promoEvents } from '@/src/lib/analytics'`
2. Connecter `logEvent` a votre backend (Supabase, etc.) si vous voulez garder des metriques
3. Verifier les logs en mode dev

### **Le fallback web ne fonctionne pas :**
1. Vérifier les URLs dans `WEB_PURCHASE_LINK_PROMO` et `WEB_PURCHASE_LINK_DEFAULT`
2. Vérifier que les URLs ne sont pas les placeholders
3. Tester l'ouverture des liens manuellement

## Notes Importantes

1. **Tout le monde peut ouvrir l'offering promo** (comme demandé)
2. **RevenueCat gère automatiquement l'éligibilité** aux prix d'intro
3. **Le compte à rebours est local** (UX uniquement)
4. **Le cap 24h est par appareil** (AsyncStorage)
5. **L'opt-out est permanent** jusqu'à reset manuel
6. **Le tracking est optionnel** (gestion d'erreurs intégrée)
7. **Le fallback web est optionnel** (URLs configurables)

Le système est maintenant **complet**, **localisé**, **tracké** et **robuste** ! 🚀








