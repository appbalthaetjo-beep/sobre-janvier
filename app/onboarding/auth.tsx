import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Apple } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { signInWithApple } from '@/lib/auth/supabaseAuth';

export default function OnboardingAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { signIn, signUp, requestPasswordReset } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        Alert.alert('Erreur', result.error);
      } else {
        // Rediriger vers la carte de sobriété
        router.replace('/onboarding/sobriety-card');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await requestPasswordReset(email);

    if (error) {
      Alert.alert('Erreur', error);
    } else {
      Alert.alert(
        'Email envoyé',
        'Un email de réinitialisation vient de vous être adressé. Vérifiez votre boîte de réception (et vos spams).'
      );
    }
  };

  const handleAppleLogin = async () => {
    if (appleLoading) {
      return;
    }

    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert('Connexion Apple', error);
      }
    } catch (error) {
      console.warn('Apple sign-in failed', error);
      Alert.alert('Connexion Apple', 'Une erreur est survenue lors de la connexion avec Apple.');
    } finally {
      setAppleLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header avec retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Logo et titre */}
        <View style={styles.logoSection}>
          <Image 
            source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Devenir sobre</Text>
          <Text style={styles.subtitle}>
            Libérez-vous de la pornographie et reprenez le contrôle de votre vie.
          </Text>
        </View>
        {/* Formulaire */}
        <View style={styles.form}>
          {isSignUp && (
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
          )}

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
              returnKeyType={isSignUp ? "next" : "done"}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color="#A3A3A3" />
              ) : (
                <Eye size={20} color="#A3A3A3" />
              )}
            </TouchableOpacity>
          </View>

          {!isSignUp && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {isSignUp && (
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
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#A3A3A3" />
                ) : (
                  <Eye size={20} color="#A3A3A3" />
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Chargement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.updateInfo}>
            {"Suite \u00e0 une mise \u00e0 jour, la reinscription est n\u00e9cessaire.\nLes abonnements premium seront restaur\u00e9s automatiquement."}
          </Text>
        </View>

        {/* Toggle entre connexion et inscription */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleLink}>
              {isSignUp ? 'Se connecter' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message motivationnel */}
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  logoImage: {
    width: 140,
    height: 46,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    paddingHorizontal: 32,
    gap: 16,
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
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  appleButton: {
    marginTop: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  updateInfo: {
    color: '#B3B3B3',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  toggleLink: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  motivationContainer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 32,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#777777',
  },
});



