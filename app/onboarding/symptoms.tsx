import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
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
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const { triggerTap } = useHaptics();

  const symptomCategories: SymptomCategory[] = [
    {
      title: 'Mental',
      symptoms: [
        { id: 'demotivated', label: 'Se sentir démotivé' },
        { id: 'lack_ambition', label: "Manque d'ambition pour poursuivre des objectifs" },
        { id: 'concentration', label: 'Difficulté à se concentrer' },
        { id: 'memory', label: 'Mauvaise mémoire ou "brouillard mental"' },
        { id: 'anxiety', label: 'Anxiété générale' },
      ],
    },
    {
      title: 'Physique',
      symptoms: [
        { id: 'fatigue', label: 'Fatigue et léthargie' },
        { id: 'low_libido', label: 'Faible désir sexuel' },
        { id: 'weak_erections', label: 'Érections faibles sans pornographie' },
      ],
    },
    {
      title: 'Social',
      symptoms: [
        { id: 'low_confidence', label: 'Faible confiance en soi' },
        { id: 'unattractive', label: "Se sentir peu attrayant ou indigne d'amour" },
        { id: 'unsatisfying_sex', label: 'Rapports sexuels insatisfaisants ou sans plaisir' },
        { id: 'reduced_socializing', label: 'Désir réduit de socialiser' },
        { id: 'isolated', label: 'Se sentir isolé des autres' },
      ],
    },
    {
      title: 'Foi',
      symptoms: [{ id: 'distant_from_god', label: 'Se sentir éloigné de Dieu' }],
    },
  ];

  const toggleSymptom = (symptomId: string) => {
    triggerTap('light');
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId]
    );
  };

  const handleContinue = () => {
    triggerTap('medium');
    // Sauvegarder les symptômes sélectionnés si nécessaire
    router.push('/onboarding/slide-1');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec bande rouge */}
        <View style={styles.header}>
          <View style={styles.redBanner}>
            <Text style={styles.bannerText}>
              L'utilisation excessive de pornographie peut avoir des impacts psychologiques négatifs.
            </Text>
          </View>

          <Text style={styles.title}>Symptômes</Text>
          <Text style={styles.subtitle}>Sélectionnez les symptômes ci-dessous :</Text>
        </View>

        {/* Catégories de symptômes */}
        <View style={styles.content}>
          {symptomCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.title}</Text>

              {category.symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom.id);

                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.symptomItem, isSelected && styles.symptomItemSelected]}
                    onPress={() => toggleSymptom(symptom.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={16} color="#000000" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                      {symptom.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.continueButtonText}>Redémarrer mon cerveau</Text>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  redBanner: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bannerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 16,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333333',
  },
  symptomItemSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  symptomText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    flex: 1,
    lineHeight: 22,
  },
  symptomTextSelected: {
    color: '#FFFFFF',
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
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  continueButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
