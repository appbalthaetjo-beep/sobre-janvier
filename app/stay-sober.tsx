import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone, Users, Headphones, Gamepad2 } from 'lucide-react-native';
import ClarioChat from '@/components/ClarioChat';

export default function StaySoberScreen() {
  const [showClarioChat, setShowClarioChat] = useState(false);

  const callEmergency = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  if (showClarioChat) {
    return <ClarioChat onClose={() => setShowClarioChat(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Reste sobre</Text>
          <View style={styles.spacer} />
        </View>

        {/* Citation forte */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "La pornographie détruit ta capacité à aimer authentiquement et à être aimé en retour. 
            Tu vaux mieux que ça."
          </Text>
        </View>

        {/* Message d'encouragement */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementTitle}>🛡️ Tu es en sécurité ici</Text>
          <Text style={styles.encouragementText}>
            Cette envie va passer. Chaque seconde de résistance renforce ton cerveau et ta volonté. 
            Tu n'es pas seul dans ce combat.
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Actions immédiates</Text>
          
          {/* Parler à Clario */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.clarioButton]}
            onPress={() => setShowClarioChat(true)}
          >
            <View style={styles.actionIcon}>
              <MessageSquare size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Parler à Clario</Text>
              <Text style={styles.actionSubtitle}>Assistant IA de soutien émotionnel 24h/7j</Text>
            </View>
          </TouchableOpacity>

          {/* Ligne d'écoute addiction */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => callEmergency('0800-23-13-13')}
          >
            <View style={styles.actionIcon}>
              <Phone size={24} color="#EF4444" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Appeler Ligne d'écoute addiction</Text>
              <Text style={styles.actionSubtitle}>0800-23-13-13 • Support spécialisé gratuit</Text>
            </View>
          </TouchableOpacity>

          {/* SOS Amitié */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => callEmergency('09-72-39-40-50')}
          >
            <View style={styles.actionIcon}>
              <Headphones size={24} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Appeler SOS Amitié</Text>
              <Text style={styles.actionSubtitle}>09-72-39-40-50 • Écoute et soutien</Text>
            </View>
          </TouchableOpacity>

          {/* Chat anonyme */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              router.back();
              router.push('/(tabs)/community');
            }}
          >
            <View style={styles.actionIcon}>
              <Users size={24} color="#F59E0B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Chat anonyme</Text>
              <Text style={styles.actionSubtitle}>Parlez avec la communauté de soutien</Text>
            </View>
          </TouchableOpacity>

          {/* Mode Pause - Détourner l'addiction */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.gameButton]}
            onPress={() => router.push('/pause-mode')}
          >
            <View style={styles.actionIcon}>
              <Gamepad2 size={24} color="#DC2626" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Détourner l'addiction</Text>
              <Text style={styles.actionSubtitle}>3 mini-jeux pour reprendre le contrôle • 90 secondes</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rappels motivationnels */}
        <View style={styles.remindersContainer}>
          <Text style={styles.remindersTitle}>Rappelle-toi :</Text>
          <View style={styles.remindersList}>
            <Text style={styles.reminderItem}>
              💪 Tu as déjà résisté à 100% de tes envies précédentes
            </Text>
            <Text style={styles.reminderItem}>
              🧠 Ton cerveau se reconstruit à chaque seconde de résistance
            </Text>
            <Text style={styles.reminderItem}>
              🏆 Chaque victoire te rend plus fort pour la prochaine fois
            </Text>
            <Text style={styles.reminderItem}>
              ❤️ Tu mérites une vie libre et authentique
            </Text>
            <Text style={styles.reminderItem}>
              🌅 Ton futur toi te remerciera pour cette résistance
            </Text>
          </View>
        </View>

        {/* Statistique encourageante */}
        <View style={styles.statContainer}>
          <Text style={styles.statTitle}>⏱️ FAIT SCIENTIFIQUE</Text>
          <Text style={styles.statText}>
            Il faut seulement 90 secondes pour qu'une pulsion disparaisse naturellement. 
            Tu peux tenir 90 secondes.
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
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  spacer: {
    width: 40, // Même largeur que le bouton back pour centrer le titre
  },
  quoteContainer: {
    backgroundColor: '#2A1A1A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quoteText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  encouragementContainer: {
    backgroundColor: '#1A2A1A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  encouragementTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clarioButton: {
    backgroundColor: '#2A2A4A',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
  },
  disabledButton: {
    backgroundColor: '#0F0F0F',
    borderColor: '#1A1A1A',
    opacity: 0.6,
  },
  gameButton: {
    backgroundColor: '#2A1A1A',
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  disabledText: {
    color: '#666666',
  },
  remindersContainer: {
    backgroundColor: '#1A1A2A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  remindersTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    lineHeight: 24,
  },
  statContainer: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
});