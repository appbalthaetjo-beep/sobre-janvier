import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { showDefaultPaywall, showPromoPaywall, isRevenueCatEnabled } from '@/src/lib/revenuecat';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useAuth } from '@/hooks/useAuth';

type SimplePaywallSystemProps = {
  enforce?: boolean;
};

const INITIAL_PROMO_DELAY_MS = 3000;
const DEFAULT_RETRY_DELAY_MS = 150;
const PROMO_AUTO_ENABLED = false; // Flip to true to restore automatic promo paywall scheduling

export default function SimplePaywallSystem({ enforce = true }: SimplePaywallSystemProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: rcLoading } = useRevenueCat();
  const revenueCatEnabled = isRevenueCatEnabled();
  const guardEnabled = enforce && revenueCatEnabled;

  const [isBlocking, setIsBlocking] = useState(false);

  const hasAccessRef = useRef(hasAccess);
  const rcLoadingRef = useRef(rcLoading);
  const isPresentingDefaultRef = useRef(false);
  const hasPresentedDefaultRef = useRef(false);
  const promoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promoScheduledRef = useRef(false);

  useEffect(() => {
    hasAccessRef.current = hasAccess;
    if (hasAccess) {
      setIsBlocking(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    rcLoadingRef.current = rcLoading;
  }, [rcLoading]);

  const clearPromoTimeout = useCallback(() => {
    if (promoTimeoutRef.current) {
      clearTimeout(promoTimeoutRef.current);
      promoTimeoutRef.current = null;
    }
    promoScheduledRef.current = false;
  }, []);

  useEffect(() => {
    if (!guardEnabled) {
      clearPromoTimeout();
      setIsBlocking(false);
      hasPresentedDefaultRef.current = false;
      isPresentingDefaultRef.current = false;
    }
  }, [guardEnabled, clearPromoTimeout]);

  const schedulePromo = useCallback(() => {
    if (promoScheduledRef.current || !guardEnabled || !PROMO_AUTO_ENABLED) {
      return;
    }

    promoScheduledRef.current = true;
    promoTimeoutRef.current = setTimeout(async () => {
      promoTimeoutRef.current = null;
      promoScheduledRef.current = false;

      if (hasAccessRef.current || rcLoadingRef.current) {
        return;
      }

      try {
        await showPromoPaywall();
      } catch (error) {
        console.warn('[PaywallSystem] Promo paywall presentation failed', error);
      } finally {
        if (!hasAccessRef.current) {
          schedulePromo();
        }
      }
    }, INITIAL_PROMO_DELAY_MS);
  }, [guardEnabled]);

  const presentDefaultPaywall = useCallback(() => {
    if (
      !guardEnabled ||
      isPresentingDefaultRef.current ||
      !user ||
      authLoading ||
      rcLoadingRef.current ||
      hasAccessRef.current
    ) {
      return;
    }

    isPresentingDefaultRef.current = true;
    setIsBlocking(true);

    (async () => {
      let result: PAYWALL_RESULT | undefined;

      try {
        schedulePromo();
        result = await showDefaultPaywall();
      } catch (error) {
        console.warn('[PaywallSystem] Default paywall presentation failed', error);
        result = PAYWALL_RESULT.ERROR;
      } finally {
        isPresentingDefaultRef.current = false;

        if (hasAccessRef.current) {
          clearPromoTimeout();
          setIsBlocking(false);
          return;
        }

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          clearPromoTimeout();
          setIsBlocking(false);
          return;
        }

        setTimeout(() => {
          presentDefaultPaywall();
        }, DEFAULT_RETRY_DELAY_MS);
      }
    })();
  }, [authLoading, clearPromoTimeout, guardEnabled, schedulePromo, user]);

  useEffect(() => {
    if (!user) {
      clearPromoTimeout();
      hasPresentedDefaultRef.current = false;
      isPresentingDefaultRef.current = false;
      setIsBlocking(false);
      return;
    }

    if (!guardEnabled || authLoading || rcLoading || hasAccess) {
      clearPromoTimeout();
      if (hasAccess) {
        hasPresentedDefaultRef.current = false;
        isPresentingDefaultRef.current = false;
      }
      setIsBlocking(false);
      return;
    }

    if (!hasPresentedDefaultRef.current) {
      hasPresentedDefaultRef.current = true;
      presentDefaultPaywall();
    }
  }, [
    user,
    guardEnabled,
    authLoading,
    rcLoading,
    hasAccess,
    presentDefaultPaywall,
    clearPromoTimeout,
  ]);

  useEffect(() => {
    return () => {
      clearPromoTimeout();
    };
  }, [clearPromoTimeout]);

  const handleForceDefault = useCallback(() => {
    if (!guardEnabled) {
      return;
    }

    presentDefaultPaywall();
  }, [presentDefaultPaywall, guardEnabled]);

  const handlePromoPress = useCallback(async () => {
    if (!guardEnabled) {
      return;
    }

    try {
      await showPromoPaywall();
    } catch (error) {
      console.warn('[PaywallSystem] Promo paywall CTA failed', error);
    }
  }, [guardEnabled]);

  if (!guardEnabled || !isBlocking) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Acces premium requis</Text>
        <Text style={styles.subtitle}>
          Souscrivez a une offre pour continuer a profiter de SOBRE.
        </Text>

        <Pressable style={[styles.button, styles.primaryButton]} onPress={handleForceDefault}>
          <Text style={styles.buttonText}>Voir les offres</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.secondaryButton]} onPress={handlePromoPress}>
          <Text style={styles.buttonSecondaryText}>Profiter de la promo</Text>
        </Pressable>

        <ActivityIndicator color="#FFD700" style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#C7C7C7',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
  },
  secondaryButton: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#030303',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  buttonSecondaryText: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  spinner: {
    marginTop: 24,
  },
});
