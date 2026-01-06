import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CircleHelp as HelpCircle, Heart, RotateCcw, Smile, Frown, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';

export default function RelapseScreen() {
  const { saveSobrietyData } = useFirestore();

  const handleResetCounter = async () => {
    try {
      // Charger les données actuelles pour préserver l'historique
      const currentDataStr = await AsyncStorage.getItem('sobrietyData');
      let currentData = null;
      
      if (currentDataStr) {
        currentData = JSON.parse(currentDataStr);
      }
      
      // Créer l'entrée de rechute
      const relapseEntry = {
        date: new Date().toISOString(),
        daysSoberAtRelapse: currentData?.daysSober || 0,
        reason: 'Rechute déclarée par l\'utilisateur'
      };
      
      // Reset des données mais CONSERVER l'historique et incrémenter le total
      const resetData = {
        startDate: new Date().toISOString(),
        originalSignupDate: currentData?.originalSignupDate || currentData?.startDate || new Date().toISOString(), // Préserver pour historique
        daysSober: 0,
        currentStreak: 0,
        longestStreak: Math.max(currentData?.longestStreak || 0, currentData?.daysSober || 0),
        totalRelapses: (currentData?.totalRelapses || 0) + 1,
        relapseHistory: [...(currentData?.relapseHistory || []), relapseEntry], // AJOUTER la rechute
      };

      // Sauvegarder dans Firebase et localement
      await saveSobrietyData(resetData);
      await AsyncStorage.setItem('sobrietyData', JSON.stringify(resetData));

      // Retourner immédiatement à la page d'accueil
      router.replace('/(tabs)');
      
    } catch (error) {
      Alert.alert("Erreur", "Impossible de réinitialiser le compteur.");
    }
  };

  const handleReasonsForChange = () => {
    router.push('/reasons');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>J'ai rechuté</Text>
        <TouchableOpacity style={styles.headerButton}>
          <HelpCircle size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Message d'introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introText}>
            Vous vous êtes laissé aller, mais chaque rechute est une occasion d'apprendre.
          </Text>
        </View>

        {/* Cycle de la rechute */}
        <View style={styles.cycleContainer}>
          <Text style={styles.cycleTitle}>Cycle de la rechute</Text>
          
          <View style={styles.cycleStep}>
            <View style={styles.stepIcon}>
              <Smile size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Plaisir immédiat</Text>
              <Text style={styles.stepDescription}>
                Dans l'instant, vous ressentez un soulagement puissant.
              </Text>
            </View>
          </View>

          <View style={styles.cycleStep}>
            <View style={styles.stepIcon}>
              <Frown size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Clarté post-orgasme</Text>
              <Text style={styles.stepDescription}>
                Peu après, l'euphorie laisse place au regret et à la tristesse.
              </Text>
            </View>
          </View>

          <View style={styles.cycleStep}>
            <View style={styles.stepIcon}>
              <RefreshCw size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Compensation</Text>
              <Text style={styles.stepDescription}>
                Vous recommencez pour faire disparaître le malaise, et le cercle se boucle.
              </Text>
            </View>
          </View>
        </View>

        {/* Raisons de mon changement */}
        <TouchableOpacity 
          style={styles.reasonsButton}
          onPress={handleReasonsForChange}
        >
          <Heart size={20} color="#FFFFFF" />
          <Text style={styles.reasonsButtonText}>Raisons de mon changement</Text>
        </TouchableOpacity>

        {/* Bouton Réinitialiser */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetCounter}
        >
          <RotateCcw size={20} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Réinitialiser le compteur</Text>
        </TouchableOpacity>

        {/* Message de motivation */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            Vous êtes plus fort que cette rechute. L'équipe de SOBRE croit en vous.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  introContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  introText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  cycleContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cycleTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  cycleStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    backgroundColor: '#333333',
    borderRadius: 20,
    padding: 8,
    marginRight: 16,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  reasonsButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reasonsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  motivationContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  motivationText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
});