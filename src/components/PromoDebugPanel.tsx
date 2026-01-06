// src/components/PromoDebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usePromoCountdown } from '../hooks/usePromoCountdown';
import { promoUtils } from '../utils/promoUtils';
import { resetPromoGate, canShowPromoNow, isOptedOut, resetOptOut } from '../lib/promoGate';
import { userHasAccess } from '../lib/revenuecat';

/**
 * Panel de debug pour tester le système de promo
 * À utiliser uniquement en développement
 */
export default function PromoDebugPanel() {
  const { mm, ss, expired, reset } = usePromoCountdown();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [promoStatus, setPromoStatus] = useState<{ canShow: boolean; timeRemaining?: number } | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [optedOut, setOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    const updateTime = async () => {
      const remaining = await promoUtils.getTimeRemaining();
      setTimeRemaining(remaining);
      
      const status = await canShowPromoNow();
      setPromoStatus(status);
      
      const access = await userHasAccess();
      setHasAccess(access);
      
      const optOut = await isOptedOut();
      setOptedOut(optOut);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetTimer = async () => {
    await reset();
    Alert.alert('✅ Timer réinitialisé', 'Le timer de promo a été réinitialisé à 5 minutes');
  };

  const handleForceShow = async () => {
    await promoUtils.forceShowPromo();
    Alert.alert('✅ Pop-up forcé', 'Le pop-up promo s\'affichera au prochain chargement');
  };

  const handleResetSession = async () => {
    await promoUtils.resetSessionFlag();
    Alert.alert('✅ Session réinitialisée', 'Le pop-up peut s\'afficher à nouveau');
  };

  const handleResetPromoGate = async () => {
    await resetPromoGate();
    Alert.alert('✅ Promo Gate réinitialisé', 'Le cap de 24h a été réinitialisé');
  };

  const handleResetOptOut = async () => {
    await resetOptOut();
    Alert.alert('✅ Opt-out réinitialisé', 'L\'utilisateur peut recevoir les promos à nouveau');
  };

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔧 Debug Promo</Text>
        <Text style={styles.info}>Timer: {mm}:{ss} ({timeRemaining}s)</Text>
        <Text style={styles.info}>Expiré: {expired ? 'Oui' : 'Non'}</Text>
        <Text style={styles.info}>Accès Premium: {hasAccess ? 'Oui' : 'Non'}</Text>
        <Text style={styles.info}>Opt-out: {optedOut ? 'Oui' : 'Non'}</Text>
        <Text style={styles.info}>
          Promo 24h: {promoStatus?.canShow ? 'Disponible' : `Bloqué (${Math.floor((promoStatus?.timeRemaining || 0) / 1000 / 60)}min)`}
        </Text>
        
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={handleResetTimer}>
            <Text style={styles.buttonText}>Reset Timer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleForceShow}>
            <Text style={styles.buttonText}>Force Show</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleResetSession}>
            <Text style={styles.buttonText}>Reset Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleResetPromoGate}>
            <Text style={styles.buttonText}>Reset 24h</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleResetOptOut}>
            <Text style={styles.buttonText}>Reset Opt-out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  info: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});
