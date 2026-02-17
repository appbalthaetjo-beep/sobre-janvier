import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirestore } from '@/hooks/useFirestore';

export default function PersonalDataScreen() {
  const { saveUserData } = useFirestore();
  const [firstName, setFirstName] = useState('');

  const canProceed = firstName.trim().length > 0;

  const handleContinue = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre prénom.');
      return;
    }

    const personalData = { firstName: firstName.trim() };

    await AsyncStorage.setItem('personalData', JSON.stringify(personalData));

    try {
      await saveUserData({
        personalData,
        profile: {
          name: personalData.firstName,
        },
      });
      console.log('✅ Personal data saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving personal data to Firebase:', error);
    }

    router.push('/onboarding/consider-this');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.kicker}>Ton nom est important.</Text>
          <Text style={styles.title}>Comment dois-je t&apos;appeler ?</Text>

          <TextInput
            style={styles.input}
            placeholder="Ton prénom"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={30}
            onSubmitEditing={handleContinue}
          />

          <TouchableOpacity
            style={[styles.continueButton, !canProceed && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canProceed}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.continueGradient}
            >
              <Text style={[styles.continueButtonText, !canProceed && styles.continueButtonTextDisabled]}>
                Continuer
              </Text>
            </LinearGradient>
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
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 18,
  },
  input: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.35,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  continueButtonTextDisabled: {
    color: '#000000',
  },
});
