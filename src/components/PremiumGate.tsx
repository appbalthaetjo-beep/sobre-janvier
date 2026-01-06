// src/components/PremiumGate.tsx
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { isProActive, showDefaultPaywall } from '../lib/revenuecat';
import { t } from '../i18n/strings';

export default function PremiumGate({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    (async () => {
      setHasAccess(await isProActive());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Vérification de l'accès...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Accès Premium Requis</Text>
          <Text style={styles.description}>
            Cette section est réservée aux membres SOBRE Premium.
          </Text>
          <Text style={styles.subDescription}>
            Débloquez toutes les fonctionnalités avancées pour maximiser votre récupération.
          </Text>
          
          <Pressable 
            onPress={showDefaultPaywall} 
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>{t('ctaStandard')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#BBBBBB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  subDescription: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
});
