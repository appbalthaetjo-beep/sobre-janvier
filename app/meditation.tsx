import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing,
  withSequence
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MeditationSession {
  id: string;
  title: string;
  duration: number; // en minutes
  description: string;
  instructions: string[];
}

export default function MeditationScreen() {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const instructionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animations
  const breathingAnimation = useSharedValue(0);
  const rippleAnimation = useSharedValue(0);

  const meditationSessions: MeditationSession[] = [
    {
      id: 'focus_5',
      title: 'Focus rapide',
      duration: 5,
      description: 'Méditation courte pour retrouver votre concentration',
      instructions: [
        'Installez-vous confortablement',
        'Fermez les yeux doucement',
        'Concentrez-vous sur votre respiration',
        'Inspirez profondément par le nez',
        'Expirez lentement par la bouche',
        'Laissez vos pensées passer sans les juger',
        'Revenez toujours à votre respiration',
        'Sentez votre corps se détendre',
        'Vous êtes présent dans l\'instant',
        'Prenez une dernière respiration profonde'
      ]
    },
    {
      id: 'calm_10',
      title: 'Calme profond',
      duration: 10,
      description: 'Méditation pour apaiser l\'esprit et réduire le stress',
      instructions: [
        'Asseyez-vous le dos droit',
        'Posez vos mains sur vos genoux',
        'Fermez les yeux en douceur',
        'Prenez conscience de votre corps',
        'Respirez naturellement',
        'Observez vos sensations',
        'Relâchez toutes les tensions',
        'Votre esprit devient calme',
        'Vous êtes en paix',
        'Chaque respiration vous apaise',
        'Restez dans cette tranquillité',
        'Ouvrez les yeux quand vous êtes prêt'
      ]
    },
    {
      id: 'recovery_15',
      title: 'Rétablissement',
      duration: 15,
      description: 'Méditation spécialement conçue pour le parcours de sobriété',
      instructions: [
        'Vous êtes en sécurité ici',
        'Respirez avec intention',
        'Reconnaissez votre courage',
        'Chaque instant sobre est une victoire',
        'Visualisez votre futur libre',
        'Ressentez votre force intérieure',
        'Vous maîtrisez vos choix',
        'La liberté grandit en vous',
        'Votre cerveau se guérit',
        'Vous méritez cette paix',
        'L\'addiction n\'a plus de pouvoir',
        'Vous êtes plus fort que vos pulsions',
        'Embrassez cette nouvelle version de vous',
        'Prenez une respiration de gratitude'
      ]
    },
    {
      id: 'deep_20',
      title: 'Méditation profonde',
      duration: 20,
      description: 'Session complète pour une transformation profonde',
      instructions: [
        'Créez votre espace sacré',
        'Laissez le monde extérieur',
        'Votre respiration devient votre ancre',
        'Descendez profondément en vous',
        'Observez sans jugement',
        'Accueillez ce qui vient',
        'Relâchez ce qui doit partir',
        'Vous êtes exactement où vous devez être',
        'Chaque cellule de votre corps se régénère',
        'Votre esprit retrouve sa clarté',
        'Vous êtes connecté à votre essence',
        'La paix remplit tout votre être',
        'Vous rayonnez de sérénité',
        'Cette transformation est durable',
        'Portez cette paix dans votre journée'
      ]
    }
  ];

  useEffect(() => {
    // Animation de respiration continue
    breathingAnimation.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.bezier(0.42, 0, 0.58, 1) 
      }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isPlaying && selectedSession) {
      startMeditation();
    } else {
      stopMeditation();
    }
    
    return () => {
      stopMeditation();
    };
  }, [isPlaying, selectedSession]);

  const startMeditation = () => {
    if (!selectedSession) return;
    
    setSessionCompleted(false);
    
    // Timer principal
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer pour les instructions
    const instructionInterval = Math.max(3, (selectedSession.duration * 60) / selectedSession.instructions.length);
    instructionTimerRef.current = setInterval(() => {
      setCurrentInstructionIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= selectedSession.instructions.length) {
          return 0; // Recommencer les instructions en boucle
        }
        return nextIndex;
      });
    }, instructionInterval * 1000);
  };

  const stopMeditation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (instructionTimerRef.current) clearInterval(instructionTimerRef.current);
  };

  const completeMeditation = () => {
    setIsPlaying(false);
    setSessionCompleted(true);
    
    // Animation de réussite
    rippleAnimation.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 500 })
    );
  };

  const handleSessionSelect = (session: MeditationSession) => {
    setSelectedSession(session);
    setTimeLeft(session.duration * 60);
    setCurrentInstructionIndex(0);
    setSessionCompleted(false);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (selectedSession) {
      setTimeLeft(selectedSession.duration * 60);
      setCurrentInstructionIndex(0);
      setSessionCompleted(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedSession) return 0;
    const totalSeconds = selectedSession.duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const breathingStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathingAnimation.value, [0, 1], [1, 1.15]);
    return {
      transform: [{ scale }],
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    const scale = interpolate(rippleAnimation.value, [0, 1], [1, 3]);
    const opacity = interpolate(rippleAnimation.value, [0, 0.5, 1], [0, 0.6, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  if (selectedSession && !sessionCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header minimal */}
        <View style={styles.activeSessionHeader}>
          <TouchableOpacity onPress={() => setSelectedSession(null)} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.activeSessionTitle}>{selectedSession.title}</Text>
          <View style={styles.spacer} />
        </View>

        {/* Zone de méditation centrale */}
        <View style={styles.meditationZone}>
          {/* Cercle de respiration animé */}
          <View style={styles.breathingContainer}>
            <Animated.View style={[styles.rippleEffect, rippleStyle]} />
            <Animated.View style={[styles.breathingCircle, breathingStyle]}>
              <View style={styles.breathingInner}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Instruction actuelle */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              {selectedSession.instructions[currentInstructionIndex] || selectedSession.instructions[0]}
            </Text>
          </View>
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleReset}
          >
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={32} color="#000000" />
            ) : (
              <Play size={32} color="#000000" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleReset}
          >
            <RotateCcw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${getProgress()}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgress())}% terminé
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Text style={styles.completionEmoji}>🧘‍♂️</Text>
            <Text style={styles.completionTitle}>
              Méditation terminée
            </Text>
            <Text style={styles.completionMessage}>
              Félicitations ! Vous avez terminé votre session de méditation. 
              Prenez un moment pour savourer cette paix intérieure.
            </Text>
            
            <View style={styles.completionStats}>
              <Text style={styles.completionStatsText}>
                ⏱️ {selectedSession?.duration} minutes de méditation{'\n'}
                🧠 Votre esprit est maintenant plus calme{'\n'}
                ✨ Vous avez renforcé votre maîtrise de soi
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.returnButton}
              onPress={() => router.back()}
            >
              <Text style={styles.returnButtonText}>Retour à la librairie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Méditation</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Trouvez votre paix intérieure</Text>
          <Text style={styles.introSubtitle}>
            La méditation renforce votre maîtrise de soi et apaise votre esprit. 
            Choisissez une session adaptée à votre disponibilité.
          </Text>
        </View>

        {/* Sessions de méditation */}
        <View style={styles.sessionsContainer}>
          {meditationSessions.map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionCard,
                selectedSession?.id === session.id && styles.sessionCardSelected
              ]}
              onPress={() => handleSessionSelect(session)}
              activeOpacity={0.8}
            >
              <View style={styles.sessionContent}>
                <View style={styles.sessionHeader}>
                  <Text style={[
                    styles.sessionTitle,
                    selectedSession?.id === session.id && styles.sessionTitleSelected
                  ]}>
                    {session.title}
                  </Text>
                  <View style={[
                    styles.durationBadge,
                    selectedSession?.id === session.id && styles.durationBadgeSelected
                  ]}>
                    <Text style={[
                      styles.durationText,
                      selectedSession?.id === session.id && styles.durationTextSelected
                    ]}>
                      {session.duration} min
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.sessionDescription,
                  selectedSession?.id === session.id && styles.sessionDescriptionSelected
                ]}>
                  {session.description}
                </Text>
              </View>
              
              {selectedSession?.id === session.id && (
                <View style={styles.playIconContainer}>
                  <Play size={20} color="#000000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bénéfices de la méditation */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Bénéfices de la méditation</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🧠</Text>
              <Text style={styles.benefitText}>Améliore la concentration et la clarté mentale</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>😌</Text>
              <Text style={styles.benefitText}>Réduit le stress et l'anxiété</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>💪</Text>
              <Text style={styles.benefitText}>Renforce la maîtrise de soi</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>💤</Text>
              <Text style={styles.benefitText}>Améliore la qualité du sommeil</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de démarrage */}
      {selectedSession && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handlePlayPause}
          >
            <Play size={24} color="#000000" />
            <Text style={styles.startButtonText}>
              Commencer la méditation ({selectedSession.duration} min)
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  introContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  introSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  sessionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  sessionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionCardSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
  sessionTitleSelected: {
    color: '#FFD700',
  },
  durationBadge: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  durationBadgeSelected: {
    backgroundColor: '#FFD700',
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  durationTextSelected: {
    color: '#000000',
  },
  sessionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  sessionDescriptionSelected: {
    color: '#F5F5F5',
  },
  playIconContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  benefitsContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  benefitsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    flex: 1,
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  startButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: 8,
  },
  
  // Styles pour la session active
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  activeSessionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  meditationZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    position: 'relative',
  },
  rippleEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFD700',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  breathingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  instructionContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  instructionText: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 40,
    marginBottom: 32,
  },
  controlButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  playButton: {
    backgroundColor: '#FFD700',
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completionContent: {
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
  completionEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  completionStats: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  completionStatsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
  returnButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  returnButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
