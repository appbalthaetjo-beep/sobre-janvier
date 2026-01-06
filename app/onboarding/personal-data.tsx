import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Calendar } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { useFirestore } from '@/hooks/useFirestore';

export default function PersonalDataScreen() {
  const { saveUserData } = useFirestore();
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');

  const handleFinishQuiz = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre prénom');
      return;
    }

    if (!age || parseInt(age) < 13 || parseInt(age) > 120) {
      Alert.alert('Erreur', 'Veuillez entrer un âge valide (13-120 ans)');
      return;
    }

    // Sauvegarder les données personnelles
    const personalData = {
      firstName: firstName.trim(),
      age: parseInt(age)
    };
    
    // Sauvegarder localement
    await AsyncStorage.setItem('personalData', JSON.stringify(personalData));
    
    // Sauvegarder dans Firebase
    try {
      await saveUserData({ 
        personalData: personalData,
        profile: {
          name: firstName.trim(),
          age: parseInt(age)
        }
      });
      console.log('✅ Personal data saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving personal data to Firebase:', error);
    }
    
    // Passer à la page de chargement
    router.push('/onboarding/loading');
  };

  const canProceed = firstName.trim().length > 0 && age && parseInt(age) >= 13 && parseInt(age) <= 120;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ProgressBar currentStep={10} totalSteps={10} />
        
        <View style={styles.content}>
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>Un peu plus à propos de vous</Text>
          </View>

          <View style={styles.inputsSection}>
            <View style={styles.inputContainer}>
              <User size={20} color="#A3A3A3" />
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor="#666666"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={30}
              />
            </View>

            <View style={styles.inputContainer}>
              <Calendar size={20} color="#A3A3A3" />
              <TextInput
                style={styles.input}
                placeholder="Votre âge"
                placeholderTextColor="#666666"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={3}
                onSubmitEditing={handleFinishQuiz}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.push('/onboarding/loading')}
          >
            <Text style={styles.skipButtonText}>Passer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.finishButton,
              !canProceed && styles.finishButtonDisabled
            ]}
            onPress={handleFinishQuiz}
            disabled={!canProceed}
          >
            <Text style={[
              styles.finishButtonText,
              !canProceed && styles.finishButtonTextDisabled
            ]}>
              Terminer le quiz
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionSection: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  inputsSection: {
    gap: 20,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#333333',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  finishButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  finishButtonTextDisabled: {
    color: '#666666',
  },
});