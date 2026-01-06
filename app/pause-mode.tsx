import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import RespireZen from '@/components/games/RespireZen';
import TapFocus from '@/components/games/TapFocus';
import FocusChallenge from '@/components/games/FocusChallenge';

const { width, height } = Dimensions.get('window');

export default function PauseModeScreen() {
  const [currentGame, setCurrentGame] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

  const games = ['RespireZen', 'TapFocus', 'FocusChallenge'];

  const startGame = (gameIndex: number) => {
    setGameStarted(true);
    setCurrentGame(gameIndex);
  };

  const nextGame = () => {
    if (currentGame < games.length - 1) {
      setCurrentGame(currentGame + 1);
    } else {
      // Fin de tous les jeux
      setShowCongratulations(true);
    }
  };

  const returnToEmergency = () => {
    router.back(); // Retour à stay-sober
    router.back(); // Retour à emergency
  };

  if (showCongratulations) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.congratulationsContainer}>
          <View style={styles.congratulationsContent}>
            <Trophy size={80} color="#FFD700" />
            <Text style={styles.congratulationsTitle}>
              Bravo ! Tu as réussi ton Mode Pause.
            </Text>
            <Text style={styles.congratulationsSubtitle}>
              Tu es resté maître de toi.
            </Text>
            
            <View style={styles.congratulationsStats}>
              <Text style={styles.congratulationsStatsText}>
                🧠 Ton cerveau a été renforcé{'\n'}
                ⏱️ Tu as résisté pendant 90 secondes{'\n'}
                💪 Tu as prouvé ta force intérieure
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.returnButton}
              onPress={returnToEmergency}
            >
              <Text style={styles.returnButtonText}>Retour à Urgence</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Détourne ton addiction</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.introContainer}>
          <Text style={styles.introSubtitle}>
            3 mini-jeux pour reprendre le contrôle de ton esprit
          </Text>

          <View style={styles.gamesPreview}>
            {games.map((game, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.gamePreviewCard} 
                onPress={() => startGame(index)}
                activeOpacity={0.8}
              >
                <Text style={styles.gamePreviewNumber}>{index + 1}</Text>
                <View style={styles.gamePreviewContent}>
                  <Text style={styles.gamePreviewName}>{game}</Text>
                  <Text style={styles.gamePreviewDuration}>30 secondes</Text>
                </View>
                <View style={styles.playIcon}>
                  <Text style={styles.playIconText}>▶</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.motivationBox}>
            <Text style={styles.motivationIcon}>🎯</Text>
            <Text style={styles.motivationText}>
              Chaque seconde de distraction renforce ta résistance
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameHeader}>
        <View style={styles.gameProgress}>
          {games.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                index === currentGame && styles.progressDotActive,
                index < currentGame && styles.progressDotCompleted
              ]}
            />
          ))}
        </View>
        <Text style={styles.gameTitle}>
          {games[currentGame]} ({currentGame + 1}/3)
        </Text>
      </View>

      <View style={styles.gameContainer}>
        {currentGame === 0 && <RespireZen onComplete={nextGame} />}
        {currentGame === 1 && <TapFocus onComplete={nextGame} />}
        {currentGame === 2 && <FocusChallenge onComplete={nextGame} />}
      </View>
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
    color: '#FFFFFF', // Blanc comme demandé
  },
  spacer: {
    width: 40,
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  introSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  gamesPreview: {
    gap: 16,
    marginBottom: 32,
  },
  gamePreviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gamePreviewNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginRight: 16,
    width: 36,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 18,
    paddingVertical: 6,
  },
  gamePreviewContent: {
    flex: 1,
  },
  gamePreviewName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gamePreviewDuration: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  playIcon: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  playIconText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 2,
  },
  motivationBox: {
    backgroundColor: '#2A2A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  motivationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 22,
  },
  gameHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  gameProgress: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  gameTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  gameContainer: {
    flex: 1,
  },
  congratulationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  congratulationsContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  congratulationsTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 32,
  },
  congratulationsSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 32,
  },
  congratulationsStats: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  congratulationsStatsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
  returnButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  returnButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});