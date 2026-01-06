# Système de Pop-up Promo avec Compte à Rebours

## Vue d'ensemble

Le système de pop-up promo implémente une offre limitée avec compte à rebours de 5 minutes et un cap de fréquence de 24h par appareil.

## Architecture

### 1. **Hook Timer** (`src/hooks/usePromoCountdown.ts`)
- Timer persistant de 5 minutes avec AsyncStorage
- Format MM:SS pour l'affichage
- Gestion de l'expiration

### 2. **Gate de Fréquence** (`src/lib/promoGate.ts`)
- Cap de 24h par appareil
- Fonctions : `shouldShowPromoNow()`, `markPromoShown()`, `resetPromoGate()`

### 3. **Paywalls RevenueCat** (`src/lib/revenuecat.ts`)
- `showDefaultPaywall()` : Ouvre l'offering "default"
- `showPromoPaywall()` : Ouvre l'offering "promo"
- `userHasAccess()` : Vérifie l'accès premium

### 4. **Composant Modal** (`src/components/PromoModal.tsx`)
- Pop-up avec design cohérent
- Compte à rebours en temps réel
- 3 CTA : Promo, Standard, Restaurer

## Règles d'Affichage

### ✅ **Le pop-up s'affiche SI :**
1. L'utilisateur n'a PAS l'accès premium
2. 24h se sont écoulées depuis le dernier affichage
3. L'utilisateur ouvre l'app (délai de 2s)

### ❌ **Le pop-up ne s'affiche PAS SI :**
1. L'utilisateur a déjà l'accès premium
2. Moins de 24h se sont écoulées depuis le dernier affichage
3. L'utilisateur a déjà vu le pop-up dans cette session

## Comportement des Paywalls

### **Avant Expiration (Timer > 0) :**
- CTA Principal : "J'en profite" → `showPromoPaywall()`
- CTA Secondaire : "Voir les prix standard" → `showDefaultPaywall()`

### **Après Expiration (Timer = 0) :**
- CTA Principal : "Voir les prix" → `showDefaultPaywall()`
- CTA Secondaire : "Voir les prix standard" → `showDefaultPaywall()`

## Configuration RevenueCat

### **Offerings Requis :**
- `default` : Offering standard (prix normal)
- `promo` : Offering promo (prix d'intro -22%)

### **Entitlement :**
- ID : `"Accès à SOBRE."`
- Vérification via `userHasAccess()`

## Tests

### **Test Normal :**
1. Ouvrir l'app (non premium) → Pop-up après 2s
2. Fermer et rouvrir dans les 24h → Pas de pop-up
3. Attendre 24h → Pop-up réapparaît

### **Test Premium :**
1. Acheter un abonnement → Plus jamais de pop-up
2. Restaurer un achat → Plus jamais de pop-up

### **Test Debug :**
```typescript
// Ajouter dans votre écran (dev uniquement)
import PromoDebugPanel from '@/src/components/PromoDebugPanel';

// Dans le JSX
<PromoDebugPanel />
```

## Utilitaires de Debug

### **Fonctions Disponibles :**
- `resetPromoGate()` : Réinitialise le cap 24h
- `promoUtils.forceShowPromo()` : Force l'affichage
- `promoUtils.resetSessionFlag()` : Réinitialise la session

### **Panel Debug :**
- Timer en temps réel
- Statut du cap 24h
- Statut de l'accès premium
- Boutons de reset

## Notes Importantes

1. **Tout le monde peut ouvrir l'offering promo** (comme demandé)
2. **RevenueCat gère automatiquement l'éligibilité** aux prix d'intro
3. **Le compte à rebours est local** (UX uniquement)
4. **Le cap 24h est par appareil** (AsyncStorage)
5. **Compatible avec le système RevenueCat existant**

## Dépannage

### **Le pop-up ne s'affiche pas :**
1. Vérifier `userHasAccess()` → doit retourner `false`
2. Vérifier `shouldShowPromoNow()` → doit retourner `true`
3. Vérifier les clés API RevenueCat (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`, `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY` ou `EXPO_PUBLIC_REVENUECAT_API_KEY`)

### **Les paywalls ne s'ouvrent pas :**
1. Vérifier la configuration des offerings dans RevenueCat
2. Vérifier les clés API
3. Vérifier la configuration du plugin dans `app.json`

### **Le timer ne fonctionne pas :**
1. Vérifier AsyncStorage
2. Vérifier les permissions
3. Utiliser le panel de debug
