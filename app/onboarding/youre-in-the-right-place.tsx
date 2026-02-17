import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

export default function YoureInTheRightPlaceScreen() {
  const { triggerTap } = useHaptics();

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/question-4');
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
            onPress={() => {
              triggerTap('light');
              if (router.canGoBack()) router.back();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color="rgba(0,0,0,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cards}>
            <View style={[styles.card, styles.cardTiltOne]}>
              <Text style={styles.cardTitle}>🧠 Comprendre vos déclencheurs</Text>
              <Text style={styles.cardBody}>
                On va identifier ce qui vous pousse vers la pornographie, pour casser le cycle à la racine.
              </Text>
            </View>

            <View style={[styles.card, styles.cardTiltTwo]}>
              <Text style={styles.cardTitle}>⚡ Retrouver le contrôle</Text>
              <Text style={styles.cardBody}>
                Des outils simples et concrets pour réduire les envies et reprendre la main, jour après jour.
              </Text>
            </View>

            <View style={[styles.card, styles.cardFaded, styles.cardTiltThree]}>
              <Text style={styles.cardKicker}>Votre objectif</Text>
              <Text style={styles.cardGoal}>Vivre sans porno, avec intégrité</Text>
              <Text style={styles.cardStat}>Beaucoup commencent exactement ici.</Text>
            </View>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.title}>Vous êtes au bon endroit</Text>
            <Text style={styles.subtitle}>
              Des milliers de personnes ont commencé avec les mêmes difficultés. Le diagnostic qui suit va clarifier votre
              situation et vous montrer la prochaine étape.
            </Text>

            <TouchableOpacity activeOpacity={0.9} onPress={handleContinue} style={styles.ctaWrapper}>
              <LinearGradient
                colors={['#FFFBF0', '#FFEFA3', '#FFDF70']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Continuer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingHorizontal: 18,
    paddingBottom: 26,
  },
  cards: {
    gap: 14,
    marginTop: 6,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  cardFaded: {
    opacity: 0.9,
  },
  cardTiltOne: {
    transform: [{ rotate: '-1.2deg' }, { translateX: -6 }],
  },
  cardTiltTwo: {
    transform: [{ rotate: '1.1deg' }, { translateX: 8 }],
  },
  cardTiltThree: {
    transform: [{ rotate: '-0.8deg' }, { translateX: -2 }],
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.88)',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 20,
  },
  cardKicker: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(0,0,0,0.45)',
    marginBottom: 6,
  },
  cardGoal: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.88)',
    marginBottom: 10,
  },
  cardStat: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: 'rgba(0,0,0,0.45)',
  },
  bottom: {
    marginTop: 18,
    paddingTop: 10,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Inter-Bold',
    color: 'rgba(0,0,0,0.88)',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(0,0,0,0.60)',
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 360,
  },
  ctaWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cta: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
});
