import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';

interface Symptom {
  id: string;
  label: string;
}

interface SymptomCategory {
  title: string;
  symptoms: Symptom[];
}

export default function SymptomsScreen() {
  const { triggerTap } = useHaptics();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const symptomCategories = useMemo<SymptomCategory[]>(
    () => [
      {
        title: 'Mental',
        symptoms: [
          { id: 'demotivated', label: '\u{1F4A4} Se sentir démotivé' },
          { id: 'lack_ambition', label: '\u{1F3AF} Manque d’ambition pour poursuivre des objectifs' },
          { id: 'concentration', label: '\u{1F3AF} Difficulté à se concentrer' },
          { id: 'memory', label: '\u{1F9E0} Mauvaise mémoire / “brouillard mental”' },
          { id: 'anxiety', label: '\u{1F630} Anxiété générale' },
        ],
      },
      {
        title: 'Physique',
        symptoms: [
          { id: 'fatigue', label: '\u{1F62E}\u200D\u{1F4A8} Fatigue et léthargie' },
          { id: 'low_libido', label: '\u{1F493} Faible désir sexuel' },
          { id: 'weak_erections', label: '\u{1F346} Érections faibles sans pornographie' },
        ],
      },
      {
        title: 'Social',
        symptoms: [
          { id: 'low_confidence', label: '\u{1F494} Faible confiance en soi' },
          { id: 'unattractive', label: '\u{1FA9E} Se sentir peu attirant ou indigne d’amour' },
          { id: 'unsatisfying_sex', label: '\u{1F9E9} Rapports sexuels insatisfaisants ou sans plaisir' },
          { id: 'reduced_socializing', label: '\u{1F4AC} Désir réduit de socialiser' },
          { id: 'isolated', label: '\u{1F614} Se sentir isolé des autres' },
        ],
      },
      {
        title: 'Foi',
        symptoms: [{ id: 'distant_from_god', label: '\u{1F64F} Se sentir éloigné de Dieu' }],
      },
    ],
    [],
  );

  const toggleSymptom = (symptomId: string) => {
    triggerTap('light');
    setSelectedSymptoms((prev) => (prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId]));
  };

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-3');
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>As-tu remarqué certains de ces symptômes récemment ?</Text>
          <Text style={styles.helperText}>Sélectionne tout ce qui te parle.</Text>
        </View>

        <View style={styles.content}>
          {symptomCategories.map((category) => (
            <View key={category.title} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.title}</Text>

              {category.symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.choiceButton, isSelected && styles.choiceButtonSelected]}
                    onPress={() => toggleSymptom(symptom.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.choiceText}>{symptom.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={styles.ctaWrapper}>
          <LinearGradient
            colors={['#F7E08A', '#D6A93A', '#B17A10']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Continuer</Text>
          </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  questionSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
  },
  questionText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 24,
  },
  categorySection: {
    marginBottom: 18,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 12,
  },
  choiceButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  choiceText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  cta: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
  },
});
