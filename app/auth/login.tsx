import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Apple } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { signInWithApple } from '@/lib/auth/supabaseAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const { signIn, requestPasswordReset } = useAuth();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const available = await AppleAuthentication.isAvailableAsync();
        if (isMounted) {
          setAppleAvailable(available);
        }
      } catch (error) {
        console.error('Apple availability check failed', error);
        if (isMounted) {
          setAppleAvailable(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Erreur de connexion', error);
    } else {
      router.replace('/(tabs)');
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
    if (appleLoading) return;
    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();

      if (error) {
        throw new Error(error);
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Apple sign-in failed', error);
      Alert.alert('Connexion Apple', 'Une erreur est survenue lors de la connexion avec Apple.');
    } finally {
      setAppleLoading(false);
    }
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
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        <View style={styles.form}>
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#A3A3A3" /> : <Eye size={20} color="#A3A3A3" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <Text style={styles.migrationNotice}>
            Suite à une mise à jour, la création d'un compte est nécessaire.
            {'\n'}
            Vos progrès sont conservés et votre abonnement premium sera restauré automatiquement.
          </Text>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.footerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Reprendre le contrôle de sa vie commence par une décision. Vous avez déjà fait le plus difficile.
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
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  appleButton: {
    marginTop: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    height: 48,
    width: '100%',
  },
  appleButtonDisabled: {
    opacity: 0.7,
  },
  appleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  migrationNotice: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E5E5E5',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
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
  welcomeContainer: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});

