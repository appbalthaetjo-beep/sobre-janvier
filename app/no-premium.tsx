import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function NoPremiumScreen() {
  const handleStartDiagnostic = () => {
    router.replace('/onboarding/index');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Aucun accès premium trouvé ⚡</Text>
          <Text style={styles.body}>
            Cet email n&apos;a pas d&apos;abonnement actif associé. Passe le diagnostic pour commencer.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartDiagnostic}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFEFA3', '#FFD44D', '#FFBF00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Passer le diagnostic</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoImage: {
    width: 140,
    height: 46,
    marginBottom: 40,
  },
  copyBlock: {
    width: '100%',
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    color: '#D0D0D0',
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
    textAlign: 'center',
  },
});
