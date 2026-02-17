import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useHaptics } from '@/hooks/useHaptics';

export default function FreeTrialScreen() {
  const { triggerTap } = useHaptics();

  const handleBack = () => {
    triggerTap('light');
    if (router.canGoBack()) router.back();
  };

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/referral-code');
  };

  return (
    <LinearGradient
      colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color="rgba(0,0,0,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.visualArea}>
            <View style={styles.pillTop}>
              <Text style={styles.pillTopText}>🎁 Essai gratuit</Text>
            </View>
            <Image source={{ uri: 'https://i.imgur.com/7ZJ96b0.png' }} style={styles.heroImage} resizeMode="contain" />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>
              SOBRE est gratuit{'\n'}à essayer pour toi.
            </Text>
            <Text style={styles.subtitle}>
              On dépend du soutien de personnes comme toi pour continuer à développer un outil qui aide à arrêter la
              pornographie et à reprendre le contrôle.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaWrapper} onPress={handleContinue} activeOpacity={0.9}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Ça marche</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(0,0,0,0.75)" style={styles.ctaArrow} />
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  visualArea: {
    height: 440,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  heroImage: {
    width: '112%',
    height: '112%',
    maxWidth: 480,
    marginTop: 18,
  },
  pillTop: {
    position: 'absolute',
    top: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  pillTopText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(0,0,0,0.85)',
  },
  copy: {
    alignItems: 'flex-start',
    paddingTop: 0,
    marginTop: -8,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.88)',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(0,0,0,0.60)',
    lineHeight: 22,
    maxWidth: 360,
    marginBottom: 8,
  },
  ctaWrapper: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  cta: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.75)',
  },
  ctaArrow: {
    marginTop: 1,
  },
});
