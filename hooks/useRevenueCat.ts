import { useEffect, useState } from 'react';
import { initRevenueCat, onCustomerInfoChange, isProActive, ENTITLEMENT_ID } from '../src/lib/revenuecat';
import { linkRevenueCatUser } from '@/lib/auth/revenuecatAuth';

export function useRevenueCat(userId?: string | null) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const canonicalUserId = String(userId || '').trim();
  const [resolvedUserId, setResolvedUserId] = useState<string>(canonicalUserId);
  const effectiveIsLoading = isLoading || resolvedUserId !== canonicalUserId;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initializeRevenueCat = async () => {
      try {
        setIsLoading(true);
        if (!canonicalUserId) {
          setHasAccess(false);
          return;
        }

        const ready = await initRevenueCat(canonicalUserId); // init RC
        if (ready) {
          await linkRevenueCatUser(canonicalUserId, 'use_revenuecat_hook');
        }

        if (!isMounted) {
          return;
        }

        if (!ready) {
          setHasAccess(false);
          return;
        }

        setHasAccess(await isProActive()); // état initial

        unsubscribe = onCustomerInfoChange((active) => {
          if (isMounted) {
            setHasAccess(active); // se met à jour après achat/restauration
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de RevenueCat:', error);
      } finally {
        if (isMounted) {
          setResolvedUserId(canonicalUserId);
          setIsLoading(false);
        }
      }
    };

    initializeRevenueCat();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [canonicalUserId]);

  return {
    hasAccess,
    isLoading: effectiveIsLoading,
    ENTITLEMENT_ID
  };
}
