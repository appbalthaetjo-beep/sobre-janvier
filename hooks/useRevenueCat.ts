import { useEffect, useState } from 'react';
import { initRevenueCat, onCustomerInfoChange, isProActive, ENTITLEMENT_ID } from '../src/lib/revenuecat';

export function useRevenueCat() {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initializeRevenueCat = async () => {
      try {
        setIsLoading(true);
        await initRevenueCat(); // init RC

        if (!isMounted) {
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
  }, []);

  return {
    hasAccess,
    isLoading,
    ENTITLEMENT_ID
  };
}
