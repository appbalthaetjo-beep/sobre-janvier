import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showDefaultPaywall, showPromoPaywall, restorePurchases, isRevenueCatEnabled } from '../src/features/paywall/actions';
import { t } from '../src/i18n/strings';

interface PaywallButtonProps {
  type?: 'default' | 'promo' | 'restore';
  title?: string;
  style?: any;
  textStyle?: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaywallButton({ 
  type = 'default', 
  title, 
  style, 
  textStyle,
  onSuccess,
  onError 
}: PaywallButtonProps): JSX.Element | null {
  const handlePress = async () => {
    try {
      switch (type) {
        case 'default':
          await showDefaultPaywall();
          onSuccess?.();
          break;
        case 'promo':
          await showPromoPaywall();
          onSuccess?.();
          break;
        case 'restore':
          const restored = await restorePurchases();
          if (restored) {
            Alert.alert('✅ Restauré', 'Vos achats ont été restaurés avec succès !');
            onSuccess?.();
          } else {
            Alert.alert('Information', 'Aucun achat à restaurer');
          }
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      onError?.(errorMessage);
      Alert.alert('Erreur', errorMessage);
    }
  };

  const getButtonTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'default':
        return t('ctaStandard');
      case 'promo':
        return t('ctaPromo');
      case 'restore':
        return t('restore');
      default:
        return t('ctaStandard');
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'promo':
        return ['#FF6B6B', '#FF8E53']; // Rouge-orange pour la promo
      case 'restore':
        return ['#6B7280', '#4B5563']; // Gris pour restaurer
      default:
        return ['#10B981', '#059669']; // Vert pour le paywall standard
    }
  };

  if (!isRevenueCatEnabled()) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.buttonText, textStyle]}>
          {getButtonTitle()}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
