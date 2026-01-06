import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import CalendarView from '@/components/CalendarView';
// import PremiumGate from '@/src/components/PremiumGate'; // Supprimé - SimplePaywallSystem gère tout
import { formatDateFrench } from '@/utils/date';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedProps,
  withTiming, 
  interpolate,
  Easing 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const circleSize = Math.min(width * 0.8, 320); // Beaucoup plus grand
const strokeWidth = 20; // Barre beaucoup plus épaisse
const radius = (circleSize - strokeWidth) / 2;
const circumference = radius * 2 * Math.PI;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Benefit {
  emoji: string;
  title: string;
  description: string;
  startDay: number; // Jour où le bénéfice commence à apparaître
  peakDay: number; // Jour où le bénéfice atteint son maximum
  gradientId: string;
}

export default function ProgressScreen() {
  const { loadSobrietyData, loadUserData, saveSobrietyData } = useFirestore();
  const [sobrietyData, setSobrietyData] = useState({
    startDate: new Date().toISOString(),
    daysSober: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalRelapses: 0,
    relapseHistory: [], // Nouvel historique des rechutes
  });

  const [userData, setUserData] = useState({
    name: 'Champion',
    goals: [],
    triggers: [],
  });

  // Fonction pour charger les bonus de bénéfices cumulés
  const loadBenefitBonuses = async () => {
    try {
      const today = new Date();
      const bonusesMap = new Map<string, number>();
      
      // CORRECTION: Charger seulement les bonus depuis le début de la série actuelle
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      const sobrietyData = sobrietyDataStr ? JSON.parse(sobrietyDataStr) : null;
      
      if (!sobrietyData) return bonusesMap;
      
      const currentStartDate = new Date(sobrietyData.startDate);
      const daysSinceStart = Math.floor((today.getTime() - currentStartDate.getTime()) / (1000 * 3600 * 24));
      
      // Charger les bonus seulement depuis le début de la série actuelle
      for (let daysBack = 0; daysBack <= Math.min(daysSinceStart, 90); daysBack++) {
        const date = new Date(today.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        // Ne pas aller avant le début de la série actuelle
        if (date < currentStartDate) break;
        
        const dateString = date.toISOString().split('T')[0];
        const key = `benefitsBonuses_${dateString}`;
        
        const bonusesStr = await AsyncStorage.getItem(key);
        if (bonusesStr) {
          const bonuses = JSON.parse(bonusesStr);
          bonuses.forEach((bonus: { benefitKey: string; bonusAmount: number }) => {
            // PROTECTION: Vérifier que le bonus est valide
            if (typeof bonus.bonusAmount !== 'number' || isNaN(bonus.bonusAmount)) {
              console.warn('Invalid bonus amount:', bonus);
              return;
            }
            
            const current = bonusesMap.get(bonus.benefitKey) || 0;
            const newTotal = current + bonus.bonusAmount;
            
            // PROTECTION: Cap global de 30% de bonus max
            bonusesMap.set(bonus.benefitKey, Math.min(newTotal, 30));
          });
        }
      }
      
      return bonusesMap;
    } catch (error) {
      console.error('Error loading benefit bonuses:', error);
      return new Map<string, number>();
    }
  };

  const progressAnimation = useSharedValue(0);

  // Bénéfices basés sur la recherche scientifique NoFap/NoPortno
  const benefits: Benefit[] = [
    {
      emoji: '💬',
      title: 'Aisance sociale',
      description: 'Les échanges deviennent plus fluides, avec moins de nervosité.',
      startDay: 3,
      peakDay: 21,
      gradientId: 'confidenceGradient'
    },
    {
      emoji: '⭐',
      title: 'Force intérieure',
      description: 'Le contrôle de soi renforce la confiance en ses capacités.',
      startDay: 5,
      peakDay: 45,
      gradientId: 'selfEsteemGradient'
    },
    {
      emoji: '🧧',
      title: 'Esprit clair',
      description: 'Les pensées deviennent plus nettes et mieux organisées.',
      startDay: 7,
      peakDay: 60,
      gradientId: 'clarityGradient'
    },
    {
      emoji: '🔥',
      title: 'Énergie intime naturelle',
      description: 'La sensibilité et l\'envie naturelle se réinstallent progressivement.',
      startDay: 14,
      peakDay: 90,
      gradientId: 'libidoGradient'
    },
    {
      emoji: '🧠',
      title: 'Stabilité mentale',
      description: 'Les pensées intrusives diminuent, laissant place à l\'équilibre.',
      startDay: 21,
      peakDay: 75,
      gradientId: 'thoughtsGradient'
    },
    {
      emoji: '⏰',
      title: 'Capacité d\'action',
      description: 'Plus d\'énergie et meilleure efficacité au quotidien.',
      startDay: 3,
      peakDay: 40,
      gradientId: 'productivityGradient'
    },
    {
      emoji: '😴',
      title: 'Repos profond',
      description: 'Un sommeil plus réparateur et régulier.',
      startDay: 10,
      peakDay: 50,
      gradientId: 'sleepGradient'
    }
  ];

  // Charger les données au focus de la page
  useFocusEffect(
    useCallback(() => {
      console.log('=== PROGRESS PAGE - useFocusEffect triggered ===');
      loadData();
    }, [])
  );

  const loadData = useCallback(async () => {
    try {
      // LOGIQUE UNIFIÉE : Même calcul que partout ailleurs
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      
      let sobrietyDataToUse = null;
      if (sobrietyDataStr) {
        sobrietyDataToUse = JSON.parse(sobrietyDataStr);
      }

      if (sobrietyDataToUse) {
        const data = sobrietyDataToUse;
        const startDate = new Date(data.startDate);
        const today = new Date();
        
        // CALCUL UNIFORME (même que page d'accueil)
        const elapsedMs = today.getTime() - startDate.getTime();
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const daysSober = Math.max(0, Math.floor(totalSeconds / 86400));
        
        if (__DEV__) console.log('📊 Progress page - Days calculated:', daysSober);
        
        const finalData = {
          ...data,
          daysSober: daysSober,
          relapseHistory: data.relapseHistory || [],
        };
        
        setSobrietyData(finalData);
      } else {
        // Fallback : créer données initiales
        const startDateStr = await AsyncStorage.getItem('sobrietyStartDate');
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const today = new Date();
        
        const elapsedMs = today.getTime() - startDate.getTime();
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const daysSober = Math.max(0, Math.floor(totalSeconds / 86400));
        
        const initialData = {
          startDate: startDate.toISOString(),
          daysSober: daysSober,
          currentStreak: daysSober,
          longestStreak: 0,
          totalRelapses: 0,
          relapseHistory: [],
        };
        
        await AsyncStorage.setItem('sobrietyData', JSON.stringify(initialData));
        setSobrietyData(initialData);
      }

      // Charger les données utilisateur
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        setUserData(JSON.parse(userDataStr));
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading sobriety data:', error);
    }
  }, []);

  // Charger au montage du composant
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (sobrietyData.daysSober >= 0) {
      const recoveryProgress = Math.min((sobrietyData.daysSober / 90) * 100, 100);
      progressAnimation.value = withTiming(recoveryProgress, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [sobrietyData.daysSober]);

  // LOGIQUE UNIFIÉE : Même calcul de progression partout
  const getBrainRewiringProgress = () => {
    // Utiliser daysSober uniforme
    return Math.min(Math.floor((sobrietyData.daysSober / 90) * 100), 100);
  };

  const getRecoveryProgress = () => {
    // Utilise exactement les mêmes données que partout
    return getBrainRewiringProgress();
  };

  const getTargetDate = () => {
    // Date cible = startDate + 90 jours
    const startDate = new Date(sobrietyData.startDate);
    const targetDate = new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000));
    
    return formatDateFrench(targetDate, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const circleAnimatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      progressAnimation.value,
      [0, 100],
      [circumference, 0]
    );

    return {
      strokeDashoffset,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Votre Progression</Text>
        </View>

        {/* Cercle de progression principal */}
        <View style={styles.circleContainer}>
          <Svg width={circleSize} height={circleSize} style={styles.circularProgress}>
            <Defs>
              <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#34D399" />
                <Stop offset="50%" stopColor="#10B981" />
                <Stop offset="100%" stopColor="#059669" />
              </LinearGradient>
            </Defs>
            
            {/* Cercle de fond */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            
            {/* Cercle de progression */}
            <AnimatedCircle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animatedProps={circleAnimatedProps}
              transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
            />
          </Svg>
          
          {/* Contenu au centre */}
          <View style={styles.circleContent}>
            <Text style={styles.recoveryLabel}>RÉCUPÉRATION</Text>
            <Text style={styles.percentageText}>{Math.round(getRecoveryProgress())}%</Text>
            <Text style={styles.daysText}>{sobrietyData.daysSober} JOURS</Text>
          </View>
        </View>

        {/* Message dynamique */}
        <View style={styles.targetContainer}>
          <Text style={styles.targetText}>
            Vous êtes en bonne voie pour arrêter définitivement le :
          </Text>
          <View style={styles.targetDateContainer}>
            <Text style={styles.targetDateText}>
              {getTargetDate()}
            </Text>
          </View>
        </View>

        {/* Message d'encouragement additionnel */}
        <View style={styles.encouragementBadge}>
          <Text style={styles.encouragementBadgeText}>
            ✨ Votre cerveau se reconstruit jour après jour
          </Text>
        </View>

        {/* Calendrier mensuel */}
        <CalendarView sobrietyData={{...sobrietyData, daysSober: sobrietyData.daysSober}} />

        {/* Liste des bénéfices */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Vos bénéfices en cours</Text>
          
          {benefits.map((benefit, index) => {
            return (
              <BenefitItem
                key={index}
                benefit={benefit}
                delay={index * 100}
              />
            );
          })}
        </View>

        {/* Message d'encouragement */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementTitle}>
            Chaque jour compte ! 💪
          </Text>
          <Text style={styles.encouragementText}>
            Votre cerveau se reconstruit progressivement. Les bénéfices s'accumulent 
            jour après jour. Continuez sur cette voie exceptionnelle.
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
  );
}

interface BenefitItemProps {
  benefit: Benefit;
  delay: number;
}

function BenefitItem({ benefit, delay }: BenefitItemProps) {
  const progressAnimation = useSharedValue(0);
  const [progress, setProgress] = useState(0);

  // Fonction pour charger les bonus de bénéfices cumulés
  const loadBenefitBonuses = async () => {
    try {
      const today = new Date();
      const bonusesMap = new Map<string, number>();
      
      // CORRECTION: Charger seulement les bonus depuis le début de la série actuelle
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      const sobrietyData = sobrietyDataStr ? JSON.parse(sobrietyDataStr) : null;
      
      if (!sobrietyData) return bonusesMap;
      
      const currentStartDate = new Date(sobrietyData.startDate);
      const daysSinceStart = Math.floor((today.getTime() - currentStartDate.getTime()) / (1000 * 3600 * 24));
      
      // Charger les bonus seulement depuis le début de la série actuelle
      for (let daysBack = 0; daysBack <= Math.min(daysSinceStart, 90); daysBack++) {
        const date = new Date(today.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        // Ne pas aller avant le début de la série actuelle
        if (date < currentStartDate) break;
        
        const dateString = date.toISOString().split('T')[0];
        const key = `benefitsBonuses_${dateString}`;
        
        const bonusesStr = await AsyncStorage.getItem(key);
        if (bonusesStr) {
          const bonuses = JSON.parse(bonusesStr);
          bonuses.forEach((bonus: { benefitKey: string; bonusAmount: number }) => {
            // PROTECTION: Vérifier que le bonus est valide
            if (typeof bonus.bonusAmount !== 'number' || isNaN(bonus.bonusAmount)) {
              console.warn('Invalid bonus amount:', bonus);
              return;
            }
            
            const current = bonusesMap.get(bonus.benefitKey) || 0;
            const newTotal = current + bonus.bonusAmount;
            
            // PROTECTION: Cap global de 30% de bonus max
            bonusesMap.set(bonus.benefitKey, Math.min(newTotal, 30));
          });
        }
      }
      
      return bonusesMap;
    } catch (error) {
      console.error('Error loading benefit bonuses:', error);
      return new Map<string, number>();
    }
  };

  useEffect(() => {
    // Calculer le progrès de façon asynchrone
    const calculateProgress = async () => {
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      const sobrietyData = sobrietyDataStr ? JSON.parse(sobrietyDataStr) : { daysSober: 0 };
      const days = sobrietyData.daysSober;
      
      // Charger les bonus cumulés
      const bonusesMap = await loadBenefitBonuses();
      const totalBonus = bonusesMap.get(benefit.title) || 0;
      
      let calculatedProgress = 0;
      
      if (days < benefit.startDay) {
        // Même si pas encore commencé naturellement, on peut avoir des bonus
        calculatedProgress = Math.min(totalBonus, 100);
      } else if (days >= benefit.peakDay) {
        // Progression naturelle complète + bonus (clampé)
        calculatedProgress = Math.min(100 + totalBonus, 100);
      } else {
        // Progression non-linéaire plus réaliste
        const totalRange = benefit.peakDay - benefit.startDay;
        const currentRange = days - benefit.startDay;
        const linearProgress = currentRange / totalRange;
        
        // Courbe logarithmique pour un début plus rapide puis ralentissement
        const adjustedProgress = Math.pow(linearProgress, 0.7) * 100;
        
        // Ajouter les bonus et clamper 0-100%
        calculatedProgress = Math.round(Math.min(adjustedProgress + totalBonus, 100));
      }
      
      setProgress(calculatedProgress);
    };
    
    calculateProgress();
  }, [benefit]);

  useEffect(() => {
    setTimeout(() => {
      progressAnimation.value = withTiming(progress, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
  }, [progress, delay]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnimation.value, [0, 100], [0, 100])}%`,
  }));

  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitHeader}>
        <View style={styles.benefitTitleRow}>
          <Text style={styles.benefitEmoji}>{benefit.emoji}</Text>
          <Text style={styles.benefitTitle}>{benefit.title}</Text>
        </View>
        <Text style={styles.benefitProgress}>{progress}%</Text>
      </View>
      
      <Text style={styles.benefitDescription}>{benefit.description}</Text>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
            <Svg width="100%" height="100%" style={styles.progressBarSvg}>
              <Defs>
                <LinearGradient id={benefit.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#06B6D4" />
                  <Stop offset="50%" stopColor="#3B82F6" />
                  <Stop offset="100%" stopColor="#10B981" />
                </LinearGradient>
              </Defs>
              <Circle
                cx="50%"
                cy="50%"
                r="50%"
                fill={`url(#${benefit.gradientId})`}
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  circularProgress: {
    transform: [{ rotate: '0deg' }],
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: circleSize,
    height: circleSize,
  },
  recoveryLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#A3A3A3',
    letterSpacing: 2,
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  daysText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#A3A3A3',
    letterSpacing: 1,
  },
  targetContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  targetDateContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  targetDateText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  encouragementBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  encouragementBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    textAlign: 'center',
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  benefitItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  benefitProgress: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginLeft: 12,
  },
  benefitDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  progressBarSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'none',
  },
  encouragementContainer: {
    backgroundColor: '#000000',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    // Effet de dégradé jaune interne
    position: 'relative',
  },
  encouragementTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.95,
  },
});
