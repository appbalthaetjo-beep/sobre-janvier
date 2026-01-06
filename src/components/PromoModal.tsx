// src/components/PromoModal.tsx
import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import {
  showDefaultPaywall,
  restorePurchases,
  openWebPurchase,
  isRevenueCatEnabled,
} from '../lib/revenuecat';
import { promoEvents } from '../lib/analytics';
import { optOut } from '../lib/promoGate';
import { t } from '../i18n/strings';

type Props = { 
  visible: boolean; 
  onClose: () => void; 
  source?: 'auto' | 'manual'; // Pour le tracking
};

export default function PromoModal({ visible, onClose, source = 'auto' }: Props) {
  const revenueCatEnabled = isRevenueCatEnabled();

  useEffect(() => { 
    if (visible) {
      // Log de l'impression
      promoEvents.impression(source);
    }
  }, [visible, source]);


  const handleStandardPress = async () => {
    try {
      await promoEvents.ctaClick('standard');
      await showDefaultPaywall();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le paywall');
    }
  };

  const handleRestorePress = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        await promoEvents.restoreSuccess();
        Alert.alert('✅ Restauré', 'Vos achats ont été restaurés avec succès !');
        onClose();
      } else {
        Alert.alert('Information', 'Aucun achat à restaurer');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de restaurer les achats');
    }
  };

  const handleOptOut = async () => {
    try {
      await optOut();
      await promoEvents.optOut();
      Alert.alert('✅ Confirmation', 'Vous ne recevrez plus cette offre.');
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder votre préférence');
    }
  };

  const handleWebPurchase = async () => {
    try {
      await openWebPurchase('promo');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Accès Premium à SOBRE</Text>
          <Text style={styles.description}>
            Découvre toutes les fonctionnalités premium de SOBRE pour t'accompagner dans ta récupération.
          </Text>

          <Pressable
            onPress={handleStandardPress}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {t('ctaStandard')}
            </Text>
          </Pressable>

          <Pressable onPress={handleWebPurchase} style={styles.webButton}>
            <Text style={styles.webButtonText}>{t('payOnWeb')}</Text>
          </Pressable>

          <Pressable onPress={handleRestorePress} style={styles.tertiaryButton}>
            <Text style={styles.tertiaryButtonText}>{t('restore')}</Text>
          </Pressable>

          <Pressable onPress={handleOptOut} style={styles.optOutButton}>
            <Text style={styles.optOutButtonText}>{t('dontShowAgain')}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>{t('later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#0b0b0c',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  countdown: {
    color: '#FFD700',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#D1D1D1',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  expiredButton: {
    backgroundColor: '#6B7280',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  expiredButtonText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#9AC8FF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  tertiaryButton: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  tertiaryButtonText: {
    color: '#9A9A9A',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#BDBDBD',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  webButton: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  webButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
  optOutButton: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  optOutButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
