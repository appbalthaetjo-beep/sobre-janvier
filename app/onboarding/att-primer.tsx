import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { requestMetaTrackingPermission } from '@/src/lib/metaAppEvents';

export default function AttPrimerScreen() {
  const { triggerTap } = useHaptics();

  const handleContinue = async () => {
    triggerTap('medium');
    await requestMetaTrackingPermission().catch(() => {});
    router.push('/onboarding/symptoms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={[styles.particle, { top: '10%', left: '15%' }]} />
        <View style={[styles.particle, { top: '25%', right: '20%' }]} />
        <View style={[styles.particle, { top: '40%', left: '10%' }]} />
        <View style={[styles.particle, { top: '60%', right: '15%' }]} />
        <View style={[styles.particle, { top: '80%', left: '25%' }]} />
        <View style={[styles.particle, { top: '15%', left: '60%' }]} />
        <View style={[styles.particle, { top: '70%', right: '40%' }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>

        <Text style={styles.title}>Active ton bouclier.</Text>

        <Text style={styles.body}>
          Aide-nous à mieux te protéger. En autorisant le suivi personnalisé, tu permets à l'application d'identifier tes moments de vulnérabilité et de t'envoyer le bon soutien au moment précis où tu en as besoin.
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
  },
  body: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
