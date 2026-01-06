import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Target, CircleCheck as CheckCircle, Clock, Trophy, Zap, Brain, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';

export default function ChallengesScreen() {
  const { saveCompletedChallenges, loadCompletedChallenges } = useFirestore();
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(0);

  const dailyChallenges = [
    {
      id: 'meditation',
      title: 'Méditation matinale',
      description: 'Méditez pendant 10 minutes au réveil',
      icon: Brain,
      points: 20,
      category: 'mental'
    },
    {
      id: 'exercise',
      title: 'Exercice physique',
      description: 'Faites 30 minutes d\'activité physique',
      icon: Zap,
      points: 25,
      category: 'physical'
    },
    {
      id: 'journal',
      title: 'Écriture journal',
      description: 'Écrivez dans votre journal personnel',
      icon: Heart,
      points: 15,
      category: 'emotional'
    },
    {
      id: 'cold_shower',
      title: 'Douche froide',
      description: 'Prenez une douche froide de 2 minutes',
      icon: Zap,
      points: 30,
      category: 'physical'
    },
    {
      id: 'no_phone_morning',
      title: 'Matin sans téléphone',
      description: 'Pas de téléphone pendant la première heure',
      icon: Target,
      points: 20,
      category: 'digital'
    },
    {
      id: 'gratitude',
      title: 'Gratitude',
      description: 'Listez 3 choses pour lesquelles vous êtes reconnaissant',
      icon: Heart,
      points: 15,
      category: 'emotional'
    }
  ];

  const weeklyChallenges = [
    {
      id: 'week_no_social',
      title: 'Semaine sans réseaux sociaux',
      description: 'Évitez tous les réseaux sociaux pendant 7 jours',
      duration: '7 jours',
      points: 200,
      difficulty: 'hard'
    },
    {
      id: 'week_exercise',
      title: 'Sport quotidien',
      description: 'Faites du sport tous les jours pendant une semaine',
      duration: '7 jours',
      points: 150,
      difficulty: 'medium'
    },
    {
      id: 'week_reading',
      title: 'Lecture quotidienne',
      description: 'Lisez 30 minutes par jour pendant une semaine',
      duration: '7 jours',
      points: 100,
      difficulty: 'easy'
    }
  ];

  const monthlyChallenges = [
    {
      id: 'month_nofap',
      title: 'NoFap 30 jours',
      description: 'Aucune rechute pendant 30 jours complets',
      duration: '30 jours',
      points: 1000,
      difficulty: 'extreme'
    },
    {
      id: 'month_meditation',
      title: 'Méditation quotidienne',
      description: 'Méditez tous les jours pendant un mois',
      duration: '30 jours',
      points: 500,
      difficulty: 'hard'
    },
    {
      id: 'month_fitness',
      title: 'Transformation physique',
      description: 'Programme fitness complet pendant 30 jours',
      duration: '30 jours',
      points: 400,
      difficulty: 'hard'
    }
  ];

  useEffect(() => {
    loadChallengesData();
  }, []);

  const loadChallengesData = async () => {
    try {
      // Charger depuis Firebase d'abord
      const { data: firestoreData } = await loadCompletedChallenges();
      
      if (firestoreData && firestoreData.length > 0) {
        setCompletedChallenges(firestoreData);
      } else {
        // Fallback vers AsyncStorage
        const data = await AsyncStorage.getItem('completedChallenges');
        if (data) {
          setCompletedChallenges(JSON.parse(data));
        }
      }
      
      const streakData = await AsyncStorage.getItem('dailyStreak');
      if (streakData) {
        setDailyStreak(parseInt(streakData));
      }
    } catch (error) {
      console.error('Error loading challenges data:', error);
    }
  };

  const completeChallenge = async (challengeId, points) => {
    const today = new Date().toDateString();
    const challengeKey = `${challengeId}_${today}`;
    
    if (completedChallenges.includes(challengeKey)) {
      Alert.alert('Déjà fait !', 'Vous avez déjà complété ce défi aujourd\'hui.');
      return;
    }

    try {
      // Sauvegarder dans Firebase
      await saveCompletedChallenges(newCompleted);
      
      // Aussi sauvegarder localement comme backup
      const newCompleted = [...completedChallenges, challengeKey];
      await AsyncStorage.setItem('completedChallenges', JSON.stringify(newCompleted));
      setCompletedChallenges(newCompleted);
      
      // Update streak if all daily challenges are completed
      const todaysChallenges = dailyChallenges.map(c => `${c.id}_${today}`);
      const completedToday = newCompleted.filter(c => c.endsWith(today));
      
      if (todaysChallenges.every(c => completedToday.includes(c))) {
        const newStreak = dailyStreak + 1;
        setDailyStreak(newStreak);
        await AsyncStorage.setItem('dailyStreak', newStreak.toString());
        Alert.alert('🎉 Félicitations !', `Défi complété ! +${points} points\n\nVous avez terminé tous les défis du jour ! Série de ${newStreak} jours !`);
      } else {
        Alert.alert('✅ Défi complété !', `Bravo ! Vous avez gagné ${points} points !`);
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const isChallengeCompleted = (challengeId) => {
    const today = new Date().toDateString();
    return completedChallenges.includes(`${challengeId}_${today}`);
  };

  const getTotalPointsToday = () => {
    const today = new Date().toDateString();
    return dailyChallenges
      .filter(challenge => isChallengeCompleted(challenge.id))
      .reduce((total, challenge) => total + challenge.points, 0);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'extreme': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'mental': return '#8B5CF6';
      case 'physical': return '#EF4444';
      case 'emotional': return '#EC4899';
      case 'digital': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Défis & Missions</Text>
        <View style={styles.pointsContainer}>
          <Trophy size={20} color="#FFD700" />
          <Text style={styles.pointsText}>{getTotalPointsToday()}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Streak */}
        <View style={styles.streakContainer}>
          <View style={styles.streakIcon}>
            <Target size={24} color="#000000" />
          </View>
          <View style={styles.streakContent}>
            <Text style={styles.streakTitle}>Série quotidienne</Text>
            <Text style={styles.streakNumber}>{dailyStreak} jours</Text>
          </View>
        </View>

        {/* Daily Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis quotidiens</Text>
          <Text style={styles.sectionSubtitle}>
            Complétez tous les défis pour maintenir votre série !
          </Text>
          
          {dailyChallenges.map((challenge) => {
            const completed = isChallengeCompleted(challenge.id);
            return (
              <TouchableOpacity
                key={challenge.id}
                style={[
                  styles.challengeCard,
                  completed && styles.challengeCardCompleted
                ]}
                onPress={() => !completed && completeChallenge(challenge.id, challenge.points)}
                disabled={completed}
              >
                <View style={styles.challengeHeader}>
                  <View style={[
                    styles.challengeIcon,
                    { backgroundColor: getCategoryColor(challenge.category) + '20' }
                  ]}>
                    <challenge.icon size={20} color={getCategoryColor(challenge.category)} />
                  </View>
                  <View style={styles.challengeContent}>
                    <Text style={[
                      styles.challengeTitle,
                      completed && styles.challengeTitleCompleted
                    ]}>
                      {challenge.title}
                    </Text>
                    <Text style={styles.challengeDescription}>
                      {challenge.description}
                    </Text>
                  </View>
                  <View style={styles.challengeRight}>
                    {completed ? (
                      <CheckCircle size={24} color="#FFD700" />
                    ) : (
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsBadgeText}>+{challenge.points}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Weekly Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis hebdomadaires</Text>
          {weeklyChallenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIcon}>
                  <Clock size={20} color="#F59E0B" />
                </View>
                <View style={styles.challengeContent}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>
                    {challenge.description}
                  </Text>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeDuration}>{challenge.duration}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(challenge.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>
                        {challenge.difficulty === 'easy' ? 'Facile' :
                         challenge.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>+{challenge.points}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Monthly Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis mensuels</Text>
          {monthlyChallenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIcon}>
                  <Trophy size={20} color="#8B5CF6" />
                </View>
                <View style={styles.challengeContent}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>
                    {challenge.description}
                  </Text>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeDuration}>{challenge.duration}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(challenge.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>
                        {challenge.difficulty === 'hard' ? 'Difficile' : 'Extrême'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>+{challenge.points}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Conseils pour réussir</Text>
          <Text style={styles.tipsText}>
            • Commencez par les défis faciles{'\n'}
            • Soyez régulier plutôt que parfait{'\n'}
            • Célébrez chaque petite victoire{'\n'}
            • Adaptez les défis à votre situation{'\n'}
            • Demandez de l'aide si nécessaire
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pointsText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  streakContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    padding: 12,
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  challengeCardCompleted: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeIcon: {
    borderRadius: 16,
    padding: 8,
    marginRight: 12,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeTitleCompleted: {
    color: '#FFD700',
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    marginBottom: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  challengeRight: {
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  tipsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 20,
  },
});