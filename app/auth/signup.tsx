import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { Image } from 'react-native';
import { setShouldShowOnboardingFlag } from '@/utils/onboardingFlag';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!name.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const { user, error } = await signUp(email, password);
    
    if (error) {
      setLoading(false);
      Alert.alert('Erreur d\'inscription', error);
    } else if (user) {
      try {
        // Mettre à jour le profil avec le nom
        if (USE_SUPABASE_AUTH) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: name.trim() },
          });
          if (updateError && __DEV__) {
            console.warn('[Auth] Supabase updateUser failed', updateError);
          }
        } else {
          await updateProfile(user, {
            displayName: name.trim(),
          });
        }

        // Sauvegarder les données utilisateur dans Firestore
        if (!USE_SUPABASE_AUTH) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { db } = require('@/lib/firebase');
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { doc, setDoc } = require('firebase/firestore');

          await setDoc(doc(db, 'users', user.uid), {
            name: name.trim(),
            email: email,
            createdAt: new Date(),
            onboardingCompleted: false,
            // Ajouter le code de parrainage s'il existe
            ...(await loadReferralCodeForNewUser())
          });
        }

        setLoading(false);
        await setShouldShowOnboardingFlag(true);
        router.replace('/onboarding');
      } catch (error: any) {
        setLoading(false);
        Alert.alert('Erreur', 'Problème lors de la création du profil: ' + error.message);
      }
    }
  };

  const loadReferralCodeForNewUser = async () => {
    try {
      const referralData = await AsyncStorage.getItem('referralCode');
      if (referralData) {
        const parsedData = JSON.parse(referralData);
        console.log('🎯 SIGNUP: Associating referral code to new user:', parsedData.code);
        return { 
          referralCode: {
            ...parsedData,
            userEmail: email // Associer l'email
          }
        };
      }
    } catch (error) {
      console.error('Error loading referral code for new user:', error);
    }
    return {};
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Commencez votre parcours vers la liberté</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color="#A3A3A3" />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#666666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#A3A3A3" />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#A3A3A3" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color="#A3A3A3" />
              ) : (
                <Eye size={20} color="#A3A3A3" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#A3A3A3" />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#666666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color="#A3A3A3" />
              ) : (
                <Eye size={20} color="#A3A3A3" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            "Le voyage de mille lieues commence par un seul pas"
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 140,
    height: 46,
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    letterSpacing: 4,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  signupButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  signupButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  footerLink: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  motivationContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  motivationText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});
