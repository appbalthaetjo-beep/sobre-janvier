# Système de Protection Premium

## Vue d'ensemble

Le système de protection premium empêche l'accès aux fonctionnalités PRO pour les utilisateurs non abonnés et fournit des outils de gestion d'abonnement.

## Composants Principaux

### **1. PremiumGate** (`src/components/PremiumGate.tsx`)
- **Rôle** : Guard global qui protège les écrans PRO
- **Fonctionnement** : Vérifie l'accès premium et affiche un écran de paywall si nécessaire
- **Usage** : Wrapper autour des écrans premium

### **2. Gestion d'Abonnement** (`src/lib/revenuecat.ts`)
- **Fonction** : `openManageSubscription()`
- **Rôle** : Ouvre la page de gestion d'abonnement Apple/Google
- **Usage** : Bouton dans les paramètres pour les utilisateurs premium

### **3. Écran de Test Sandbox** (`src/screens/BillingDebugScreen.tsx`)
- **Rôle** : Interface de test pour vérifier les prix et l'éligibilité
- **Fonctionnalités** : Affichage des prix, test des paywalls, gestion des achats
- **Usage** : Debug en mode développement

## Architecture

### **Fichiers Principaux**

```
src/
├── components/
│   └── PremiumGate.tsx          # Guard premium global
├── lib/
│   └── revenuecat.ts           # Gestion d'abonnement
├── screens/
│   └── BillingDebugScreen.tsx  # Écran de test sandbox
└── docs/
    └── PREMIUM_GUARD_SYSTEM.md # Cette documentation

app/
├── debug/
│   └── billing.tsx             # Route de debug
├── (tabs)/
│   └── progress.tsx            # Écran protégé (exemple)
└── settings.tsx                # Boutons de gestion
```

## Utilisation

### **1. Protection d'un Écran PRO**

```typescript
// app/(tabs)/progress.tsx
import PremiumGate from '@/src/components/PremiumGate';

export default function ProgressScreen() {
  return (
    <PremiumGate>
      {/* Contenu premium ici */}
      <SafeAreaView>
        {/* Votre écran premium */}
      </SafeAreaView>
    </PremiumGate>
  );
}
```

### **2. Bouton de Gestion d'Abonnement**

```typescript
// Dans les paramètres (pour utilisateurs premium)
import { openManageSubscription } from '@/src/lib/revenuecat';

<Pressable onPress={openManageSubscription}>
  <Text>Gérer mon abonnement</Text>
</Pressable>
```

### **3. Accès à l'Écran de Debug**

```typescript
// Route: /debug/billing
// Accessible via les paramètres en mode développement
router.push('/debug/billing');
```

## Comportement du PremiumGate

### **Si l'utilisateur a l'accès premium :**
- ✅ Affiche le contenu protégé normalement
- ✅ Aucune restriction

### **Si l'utilisateur n'a PAS l'accès premium :**
- ❌ Masque le contenu premium
- ✅ Affiche un écran de paywall avec :
  - Message explicatif
  - Bouton "Voir les offres" → `showDefaultPaywall()`
  - Design cohérent avec l'app

## Écran de Test Sandbox

### **Fonctionnalités Disponibles :**

#### **Informations des Prix**
- Prix annuel normal
- Prix d'intro (si éligible)
- Prix mensuel
- Informations client (entitlements, abonnements)

#### **Actions de Test**
- **Ouvrir Paywall PROMO** → `showPromoPaywall()`
- **Ouvrir Paywall STANDARD** → `showDefaultPaywall()`
- **Restaurer les Achats** → `restorePurchases()`
- **Gérer Mon Abonnement** → `openManageSubscription()`
- **Actualiser** → Recharge les informations

#### **Détails Techniques**
- Entitlements actifs (JSON)
- Abonnements actifs (JSON)
- Informations de debug

### **Accès à l'Écran de Debug**

#### **En Mode Développement :**
1. Aller dans **Paramètres**
2. Cliquer sur **"Debug Billing (Sandbox)"**
3. Tester les fonctionnalités

#### **En Mode Production :**
- L'écran n'est pas accessible (bouton masqué)

## Configuration Requise

### **1. RevenueCat**
```typescript
// Dans src/lib/revenuecat.ts
const RC_IOS_API_KEY = 'VOTRE_CLE_IOS';
const RC_ANDROID_API_KEY = 'VOTRE_CLE_ANDROID';
export const ENTITLEMENT_ID = 'Accès à SOBRE.';
```

### **2. Offerings**
- `default` : Offering standard
- `promo` : Offering promo (optionnel)

### **3. Entitlements**
- ID : `"Accès à SOBRE."` (configurable)
- Vérification via `isProActive()`

## Tests

### **Test de Protection Premium**

#### **Utilisateur Non Premium :**
1. Ouvrir un écran protégé (ex: Progression)
2. ✅ Voir l'écran de paywall
3. Cliquer "Voir les offres"
4. ✅ Paywall standard s'ouvre

#### **Utilisateur Premium :**
1. Acheter un abonnement
2. Ouvrir un écran protégé
3. ✅ Voir le contenu premium normalement

### **Test de Gestion d'Abonnement**

#### **Utilisateur Premium :**
1. Aller dans **Paramètres**
2. ✅ Voir "Gérer mon abonnement"
3. Cliquer dessus
4. ✅ Page Apple/Google s'ouvre

#### **Utilisateur Non Premium :**
1. Aller dans **Paramètres**
2. ❌ Ne pas voir "Gérer mon abonnement"

### **Test de l'Écran de Debug**

#### **En Mode Développement :**
1. Aller dans **Paramètres**
2. ✅ Voir "Debug Billing (Sandbox)"
3. Cliquer dessus
4. ✅ Écran de debug s'ouvre
5. Tester les boutons
6. ✅ Vérifier les prix et fonctionnalités

#### **En Mode Production :**
1. Aller dans **Paramètres**
2. ❌ Ne pas voir "Debug Billing (Sandbox)"

## Intégration dans d'Autres Écrans

### **Écrans à Protéger (Exemples) :**
- **Progression** : Statistiques avancées, calendrier détaillé
- **Bibliothèque** : Contenu premium, modules avancés
- **Communauté** : Fonctionnalités sociales premium
- **Profil** : Statistiques détaillées, export de données

### **Code d'Intégration :**
```typescript
// Pour chaque écran PRO
import PremiumGate from '@/src/components/PremiumGate';

export default function MonEcranPRO() {
  return (
    <PremiumGate>
      {/* Votre contenu premium */}
    </PremiumGate>
  );
}
```

## Dépannage

### **Le PremiumGate ne fonctionne pas :**
1. Vérifier l'import : `import PremiumGate from '@/src/components/PremiumGate'`
2. Vérifier la configuration RevenueCat
3. Vérifier l'ENTITLEMENT_ID
4. Tester avec l'écran de debug

### **Le bouton de gestion ne s'affiche pas :**
1. Vérifier que l'utilisateur a l'accès premium
2. Vérifier `hasAccess` dans useRevenueCat
3. Vérifier l'import : `import { openManageSubscription }`

### **L'écran de debug ne s'ouvre pas :**
1. Vérifier que vous êtes en mode développement (`__DEV__`)
2. Vérifier la route : `/debug/billing`
3. Vérifier l'ajout dans `app/_layout.tsx`

### **Les prix ne s'affichent pas dans le debug :**
1. Vérifier la configuration des offerings dans RevenueCat
2. Vérifier les clés API
3. Vérifier la connexion réseau
4. Tester en mode sandbox

## Notes Importantes

1. **PremiumGate est un wrapper** : Il entoure le contenu, ne le remplace pas
2. **Vérification en temps réel** : L'accès est vérifié à chaque ouverture
3. **Design cohérent** : L'écran de paywall suit le design de l'app
4. **Gestion d'erreurs** : Toutes les fonctions gèrent les erreurs gracieusement
5. **Mode debug** : L'écran de test n'est accessible qu'en développement
6. **Performance** : Vérification rapide via `isProActive()`

## Évolutions Futures

### **Fonctionnalités Possibles :**
- **Cache d'accès** : Mise en cache de l'état premium
- **Notifications** : Alertes d'expiration d'abonnement
- **Essai gratuit** : Gestion des périodes d'essai
- **Offres personnalisées** : Paywalls adaptatifs
- **Analytics** : Tracking des conversions

Le système de protection premium est maintenant **complet** et **opérationnel** ! 🚀
