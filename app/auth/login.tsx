import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Mail } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNoPremiumMessage, setShowNoPremiumMessage] = useState(false);
  const { showNoPremium, expectedAppUserId } = useLocalSearchParams<{
    showNoPremium?: string;
    expectedAppUserId?: string;
  }>();
  const { user, requestMagicLinkSignIn } = useAuth();

  useEffect(() => {
    if (showNoPremium === '1') {
      setShowNoPremiumMessage(true);
      router.replace('/auth/login');
    }
  }, [showNoPremium]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setShowNoPremiumMessage(false);
      };
    }, []),
  );

  const handleContinue = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Erreur', 'Veuillez renseigner votre adresse email.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide.');
      return;
    }

    setShowNoPremiumMessage(false);
    setLoading(true);
    const expectedUserIdFromRoute =
      typeof expectedAppUserId === 'string' ? expectedAppUserId.trim() : '';
    const expectedUserIdFromSession =
      user?.email?.toLowerCase() === normalizedEmail ? user?.uid ?? null : null;
    const expectedUserId =
      expectedUserIdFromRoute.length > 0 ? expectedUserIdFromRoute : expectedUserIdFromSession;

    const { error } = await requestMagicLinkSignIn(normalizedEmail, {
      expectedAppUserId: expectedUserId,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Lien de connexion', error);
      return;
    }

    Alert.alert(
      'Email envoye',
      "Un lien de connexion vient d'etre envoye. Ouvrez cet email sur ce telephone pour finaliser la connexion.",
    );
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
          <Text style={styles.title}>Se connecter</Text>
          {showNoPremiumMessage ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>{'Aucun acc\u00e8s premium trouv\u00e9 \u26A1'}</Text>
              <Text style={styles.noticeText}>
                Cet email n&apos;a pas d&apos;abonnement actif associ\u00e9.
              </Text>
            </View>
          ) : null}
          <Text style={styles.subtitle}>
            Entrez l'email utilise lors du paiement. Nous vous enverrons un lien magique.
          </Text>
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
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Envoi...' : 'Continuer'}</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Aucun mot de passe requis. Le lien ouvre directement votre session.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Besoin d'un compte classique ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.footerLink}>S'inscrire</Text>
          </TouchableOpacity>
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
    marginBottom: 44,
  },
  logoImage: {
    width: 140,
    height: 46,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  noticeBox: {
    width: '100%',
    backgroundColor: '#171717',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E5E5',
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 18,
    marginBottom: 24,
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
    marginTop: 4,
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
  helperText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
});
