import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function WebBlockingGuideScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocage web</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Contenu web en mise à jour</Text>
          <Text style={styles.bannerText}>
            Le blocage des sites pour adultes (Safari, Chrome, etc.) est en cours de mise à jour dans Sobre. En attendant,
            tu peux activer un blocage puissant directement dans les réglages de ton iPhone 👇 (cela ne devrait prendre
            que quelques jours)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bloquer les sites pour adultes avec Temps d’écran</Text>

          <View style={styles.steps}>
            <Text style={styles.step}>1. Ouvre l’app Réglages de ton iPhone.</Text>
            <Text style={styles.step}>2. Va dans Temps d’écran.</Text>
            <Text style={styles.step}>
              3. Appuie sur Contenu et confidentialité (active l’option si ce n’est pas déjà fait).
            </Text>
            <Text style={styles.step}>4. Appuie sur Restrictions de contenu.</Text>
            <Text style={styles.step}>5. Va dans Contenu web.</Text>
            <Text style={styles.step}>
              6. Choisis soit Limiter les sites web pour adultes, soit Sites web autorisés uniquement (et ajoute seulement
              les sites que tu souhaites garder).
            </Text>
            <Text style={styles.step}>
              7. Dans la section Ne jamais autoriser, ajoute les sites que tu veux bloquer (par exemple : sites porno,
              réseaux sociaux, etc.).
            </Text>
          </View>

          <Text style={styles.note}>
            Sobre ne peut pas encore bloquer directement les sites dans Safari, mais ces réglages système sont très
            efficaces pour te protéger au quotidien 💪
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 28,
  },
  banner: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 14,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  bannerText: {
    color: '#CFCFCF',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  steps: {
    gap: 10,
  },
  step: {
    color: '#E7E7E7',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    marginTop: 14,
    color: '#CFCFCF',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
  },
});
