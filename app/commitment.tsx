import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Send, Users, Calendar, Target, MessageSquare, CircleCheck as CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useFirestore } from '@/hooks/useFirestore';
import { formatDateFrench } from '@/utils/date';

interface Commitment {
  date: string;
  message: string;
  contactName?: string;
  completed: boolean;
}

export default function CommitmentScreen() {
  const { saveUserData, loadUserData } = useFirestore();
  const [todaysCommitment, setTodaysCommitment] = useState<Commitment | null>(null);
  const [commitmentStreak, setCommitmentStreak] = useState(0);
  const [userName, setUserName] = useState('');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [hasShownCongrats, setHasShownCongrats] = useState(false);

  const commitmentMessage = "Salut ! Je m'engage aujourd'hui à rester sobre et à ne pas regarder de contenu explicite. Je compte sur ton soutien pour tenir cette promesse que je me fais à moi-même. 💪";

  useEffect(() => {
    loadCommitmentData();
    loadUserProfile();
    
    // Vérifier toutes les minutes si l'engagement est terminé
    const checkInterval = setInterval(() => {
      checkCommitmentCompletion();
    }, 60000); // Vérifier chaque minute
    
    // Vérifier aussi immédiatement
    checkCommitmentCompletion();
    
    return () => clearInterval(checkInterval);
  }, []);

  const checkCommitmentCompletion = async () => {
    if (!todaysCommitment || !todaysCommitment.completed || hasShownCongrats) return;
    
    try {
      // Vérifier si 24h se sont écoulées depuis l'engagement
      const commitmentDateTime = new Date(`${todaysCommitment.date}T00:00:00`);
      const now = new Date();
      const hoursElapsed = (now.getTime() - commitmentDateTime.getTime()) / (1000 * 3600);
      
      // Si plus de 24h et pas encore félicité
      if (hoursElapsed >= 24) {
        const congratsKey = `congrats_${todaysCommitment.date}`;
        const alreadyShown = await AsyncStorage.getItem(congratsKey);
        
        if (!alreadyShown) {
          setShowCongratulations(true);
          setHasShownCongrats(true);
          await AsyncStorage.setItem(congratsKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error checking commitment completion:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const personalData = await AsyncStorage.getItem('personalData');
      if (personalData) {
        const { firstName } = JSON.parse(personalData);
        setUserName(firstName || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadCommitmentData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Charger depuis Firebase d'abord
      const { data: firestoreData } = await loadUserData();
      
      let commitments = [];
      if (firestoreData && firestoreData.commitments) {
        commitments = firestoreData.commitments;
      } else {
        // Fallback vers AsyncStorage
        const commitmentsData = await AsyncStorage.getItem('userCommitments');
        if (commitmentsData) {
          commitments = JSON.parse(commitmentsData);
        }
      }
      
      // Chercher l'engagement d'aujourd'hui
      const todayCommitment = commitments.find((c: Commitment) => c.date === today);
      setTodaysCommitment(todayCommitment || null);
      
      // Calculer la série d'engagements
      calculateCommitmentStreak(commitments);
      
    } catch (error) {
      console.error('Error loading commitment data:', error);
    }
  };

  const calculateCommitmentStreak = (commitments: Commitment[]) => {
    // Trier les engagements par date (plus récent en premier)
    const sortedCommitments = commitments
      .filter((c: Commitment) => c.completed)
      .sort((a: Commitment, b: Commitment) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (const commitment of sortedCommitments) {
      const commitmentDate = new Date(commitment.date);
      const daysDiff = Math.floor((today.getTime() - commitmentDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    setCommitmentStreak(streak);
  };

  const createCommitment = async (messageIndex: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (todaysCommitment) {
      Alert.alert('Engagement déjà pris', 'Vous avez déjà pris un engagement aujourd\'hui !');
      return;
    }

    const newCommitment: Commitment = {
      date: today,
      message: commitmentMessage,
      completed: false
    };

    try {
      // Charger les engagements existants
      const { data: userData } = await loadUserData();
      const existingCommitments = userData?.commitments || [];
      
      // Ajouter le nouvel engagement
      const updatedCommitments = [...existingCommitments, newCommitment];
      
      // Sauvegarder dans Firebase
      await saveUserData({ commitments: updatedCommitments });
      
      // Aussi sauvegarder localement
      await AsyncStorage.setItem('userCommitments', JSON.stringify(updatedCommitments));
      
      setTodaysCommitment(newCommitment);
      
      // Partager immédiatement
      shareCommitment(newCommitment.message);
      
    } catch (error) {
      console.error('Error creating commitment:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'engagement.');
    }
  };

  const shareCommitment = async (message: string) => {
    const appPromotion = `\n\n---\n💪 Je me reconstruis avec l'app SOBRE - Application gratuite pour arrêter le contenu explicite (disponible sur App Store et Android)`;
    
    const fullMessage = message + appPromotion;

    try {
      const result = await Share.share({
        message: fullMessage,
        title: 'Mon engagement de sobriété'
      });

      if (result.action === Share.sharedAction) {
        // Marquer l'engagement comme complété
        await markCommitmentCompleted();
        Alert.alert('✅ Engagement envoyé !', 'Votre engagement a été partagé avec succès. Tenir cette promesse renforcera votre détermination.');
      }
    } catch (error) {
      console.error('Error sharing commitment:', error);
      
      if (Platform.OS === 'web') {
        // Sur web, proposer de copier le message
        Alert.alert(
          'Partage non disponible',
          'Le partage direct n\'est pas disponible sur cette plateforme. Voulez-vous copier le message pour le partager manuellement ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Copier', 
              onPress: async () => {
                await Clipboard.setStringAsync(fullMessage);
                Alert.alert('✅ Copié !', 'Le message a été copié dans votre presse-papiers.');
                await markCommitmentCompleted();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de partager l\'engagement.');
      }
    }
  };

  const markCommitmentCompleted = async () => {
    if (!todaysCommitment) return;

    try {
      const { data: userData } = await loadUserData();
      const existingCommitments = userData?.commitments || [];
      
      // Mettre à jour l'engagement d'aujourd'hui
      const updatedCommitments = existingCommitments.map((c: Commitment) =>
        c.date === todaysCommitment.date ? { ...c, completed: true } : c
      );
      
      // Sauvegarder dans Firebase
      await saveUserData({ commitments: updatedCommitments });
      
      // Aussi sauvegarder localement
      await AsyncStorage.setItem('userCommitments', JSON.stringify(updatedCommitments));
      
      setTodaysCommitment({ ...todaysCommitment, completed: true });
      
      // Recalculer la série
      calculateCommitmentStreak(updatedCommitments);
      
    } catch (error) {
      console.error('Error marking commitment completed:', error);
    }
  };

  const formatDate = () => {
    return formatDateFrench(new Date(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getEncouragementMessage = () => {
    if (commitmentStreak === 0) {
      return "Premier engagement ! Commencez votre série de promesses tenues.";
    } else if (commitmentStreak < 7) {
      return `${commitmentStreak} jours d'engagements tenus ! Continuez sur cette voie.`;
    } else if (commitmentStreak < 30) {
      return `${commitmentStreak} jours de parole tenue ! Votre détermination est inspirante.`;
    } else {
      return `${commitmentStreak} jours d'engagements ! Vous êtes un modèle de constance.`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Engagement envers un proche</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>La force du témoin</Text>
          <Text style={styles.introText}>
            S'engager devant quelqu'un qu'on respecte renforce notre détermination. 
            Votre proche devient votre témoin et votre soutien.
          </Text>
        </View>

        {/* Statistiques d'engagement */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={20} color="#FFD700" />
            <Text style={styles.statNumber}>{commitmentStreak}</Text>
            <Text style={styles.statLabel}>Engagements tenus</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={20} color="#FFD700" />
            <Text style={styles.statNumber}>{formatDate()}</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </View>
        </View>

        {/* État de l'engagement du jour */}
        {todaysCommitment ? (
          <View style={[
            styles.todayCommitmentContainer,
            todaysCommitment.completed && styles.todayCommitmentCompleted
          ]}>
            <View style={styles.commitmentIcon}>
              {todaysCommitment.completed ? (
                <Text style={styles.commitmentEmoji}>✅</Text>
              ) : (
                <Text style={styles.commitmentEmoji}>⏳</Text>
              )}
            </View>
            <View style={styles.commitmentContent}>
              <Text style={styles.commitmentStatus}>
                {todaysCommitment.completed ? 'Engagement tenu !' : 'Engagement en cours'}
              </Text>
              <Text style={styles.commitmentMessage}>
                {todaysCommitment.message.substring(0, 100)}...
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noCommitmentContainer}>
            <Heart size={32} color="#666666" />
            <Text style={styles.noCommitmentTitle}>Aucun engagement aujourd'hui</Text>
            <Text style={styles.noCommitmentText}>
              Prenez un engagement devant un proche pour renforcer votre détermination.
            </Text>
          </View>
        )}

        {/* Messages d'engagement prédéfinis */}
        {!todaysCommitment && (
          <View style={styles.messagesContainer}>
            <Text style={styles.messagesTitle}>Message d'engagement :</Text>
            
            <View style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <MessageSquare size={20} color="#FFD700" />
                <Text style={styles.messageTitle}>Votre engagement du jour</Text>
              </View>
              <Text style={styles.messagePreview}>
                {commitmentMessage}
              </Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => createCommitment(0)}
                activeOpacity={0.8}
              >
                <Send size={16} color="#000000" />
                <Text style={styles.shareButtonText}>Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message d'encouragement */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementTitle}>Pourquoi s'engager ?</Text>
          <View style={styles.encouragementList}>
            <Text style={styles.encouragementItem}>
              💪 La responsabilité publique augmente la motivation
            </Text>
            <Text style={styles.encouragementItem}>
              🤝 Créer un réseau de soutien bienveillant
            </Text>
            <Text style={styles.encouragementItem}>
              🎯 Transformer l'engagement privé en promesse sociale
            </Text>
            <Text style={styles.encouragementItem}>
              ❤️ Renforcer les liens avec vos proches
            </Text>
          </View>
        </View>

        {/* Série d'engagements */}
        <View style={styles.streakContainer}>
          <Text style={styles.streakTitle}>Votre série d'engagements</Text>
          <Text style={styles.streakMessage}>
            {getEncouragementMessage()}
          </Text>
        </View>

      </ScrollView>

      {/* Modal de félicitations */}
      <Modal
        visible={showCongratulations}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCongratulations(false)}
      >
        <View style={styles.congratsOverlay}>
          <View style={styles.congratsContainer}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.congratsTitle}>Engagement tenu ! 🎉</Text>
            <Text style={styles.congratsMessage}>
              Bravo ! Vous avez tenu votre promesse pendant 24h.
            </Text>
            <TouchableOpacity
              style={styles.congratsButton}
              onPress={() => setShowCongratulations(false)}
            >
              <Text style={styles.congratsButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  introContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  todayCommitmentContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  todayCommitmentCompleted: {
    backgroundColor: '#2A2A2A',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  commitmentIcon: {
    marginRight: 16,
  },
  commitmentEmoji: {
    fontSize: 32,
  },
  commitmentContent: {
    flex: 1,
  },
  commitmentStatus: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  commitmentMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  noCommitmentContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  noCommitmentTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noCommitmentText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesContainer: {
    marginBottom: 32,
  },
  messagesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginLeft: 8,
  },
  messagePreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 20,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: 6,
  },
  encouragementContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  encouragementTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  encouragementList: {
    gap: 12,
  },
  encouragementItem: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
  },
  streakContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  streakMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  congratsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  congratsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 320,
  },
  congratsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  congratsMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  congratsButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  congratsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
