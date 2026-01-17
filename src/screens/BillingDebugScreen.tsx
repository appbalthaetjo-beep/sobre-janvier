import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import { showPromoPaywall, showDefaultPaywall, restorePurchases, openManageSubscription } from '../lib/revenuecat';
import { promoEvents } from '../lib/analytics';

export default function BillingDebugScreen() {
  const [info, setInfo] = useState<any>(null);
  const [annual, setAnnual] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      setLoading(true);
      
      // Vérifier si RevenueCat est activé
      const offeringsData = await Purchases.getOfferings();
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] billing debug entitlements.active', customerInfo?.entitlements?.active ?? {});
      console.log('[RevenueCat] billing debug activeSubscriptions', customerInfo?.activeSubscriptions ?? []);
      
      setOfferings(offeringsData);
      setInfo(customerInfo);
      
      // Récupérer les packages
      const current = offeringsData.current ?? offeringsData.all?.default;
      const promo = offeringsData.all?.promo;
      
      const annualPkg = current?.annual ?? 
        current?.availablePackages?.find((p: any) => p.identifier === '$rc_annual') ??
        current?.availablePackages?.find((p: any) => p.packageType === 'ANNUAL');
        
      const monthlyPkg = current?.monthly ?? 
        current?.availablePackages?.find((p: any) => p.identifier === '$rc_monthly') ??
        current?.availablePackages?.find((p: any) => p.packageType === 'MONTHLY');
      
      setAnnual(annualPkg?.product);
      setMonthly(monthlyPkg?.product);
      
    } catch (error) {
      console.error('Erreur lors du chargement des infos billing:', error);
      Alert.alert('Erreur', 'RevenueCat est désactivé ou non configuré. Impossible de charger les informations de facturation.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoPaywall = async () => {
    try {
      await promoEvents.paywallOpen('promo');
      await showPromoPaywall();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le paywall promo');
    }
  };

  const handleDefaultPaywall = async () => {
    try {
      await promoEvents.paywallOpen('default');
      await showDefaultPaywall();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le paywall standard');
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        await promoEvents.restoreSuccess();
        Alert.alert('✅ Restauré', 'Vos achats ont été restaurés avec succès !');
        loadBillingInfo(); // Recharger les infos
      } else {
        Alert.alert('Information', 'Aucun achat à restaurer');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de restaurer les achats');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openManageSubscription();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la gestion d\'abonnement');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des informations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🔧 DEBUG Billing (Sandbox)</Text>
        
        {/* Informations des prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix des Abonnements</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Annuel (normal):</Text>
            <Text style={styles.priceValue}>{annual?.priceString || 'N/A'}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Annuel (intro):</Text>
            <Text style={styles.priceValue}>
              {annual?.introPrice?.priceString || '—'}
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Mensuel:</Text>
            <Text style={styles.priceValue}>{monthly?.priceString || 'N/A'}</Text>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Client</Text>
          <Text style={styles.infoText}>
            Entitlements actifs: {Object.keys(info?.entitlements?.active || {}).length}
          </Text>
          <Text style={styles.infoText}>
            Abonnements actifs: {Object.keys(info?.activeSubscriptions || {}).length}
          </Text>
          <Text style={styles.infoText}>
            Dernière période: {info?.latestExpirationDate || 'N/A'}
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions de Test</Text>
          
          <Pressable 
            onPress={handlePromoPaywall} 
            style={[styles.actionButton, styles.promoButton]}
          >
            <Text style={styles.actionButtonText}>Ouvrir Paywall PROMO</Text>
          </Pressable>
          
          <Pressable 
            onPress={handleDefaultPaywall} 
            style={[styles.actionButton, styles.defaultButton]}
          >
            <Text style={styles.actionButtonText}>Ouvrir Paywall STANDARD</Text>
          </Pressable>
          
          <Pressable 
            onPress={handleRestore} 
            style={[styles.actionButton, styles.restoreButton]}
          >
            <Text style={styles.actionButtonText}>Restaurer les Achats</Text>
          </Pressable>
          
          <Pressable 
            onPress={handleManageSubscription} 
            style={[styles.actionButton, styles.manageButton]}
          >
            <Text style={styles.actionButtonText}>Gérer Mon Abonnement</Text>
          </Pressable>
          
          <Pressable 
            onPress={loadBillingInfo} 
            style={[styles.actionButton, styles.refreshButton]}
          >
            <Text style={styles.actionButtonText}>🔄 Actualiser</Text>
          </Pressable>
        </View>

        {/* Détails techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails Techniques</Text>
          <Text style={styles.debugText}>
            Entitlements: {JSON.stringify(info?.entitlements?.active ?? {}, null, 2)}
          </Text>
          <Text style={styles.debugText}>
            Active Subscriptions: {JSON.stringify(info?.activeSubscriptions ?? {}, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  infoText: {
    color: '#BBBBBB',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  actionButton: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  promoButton: {
    backgroundColor: '#FF6B6B',
  },
  defaultButton: {
    backgroundColor: '#FFD700',
  },
  restoreButton: {
    backgroundColor: '#6B7280',
  },
  manageButton: {
    backgroundColor: '#4A90E2',
  },
  refreshButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  debugText: {
    color: '#888888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 16,
  },
});

""
