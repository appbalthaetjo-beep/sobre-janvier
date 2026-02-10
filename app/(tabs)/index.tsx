import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Image, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import CrystalDisplay from '@/components/CrystalDisplay';
import Method306090 from '@/components/Method30-60-90';
import MilestonePopup from '@/components/MilestonePopup';
import DailyMissions from '@/components/DailyMissions';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Book, Heart, RotateCcw, Share, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import OpenBlockPickerButton from '@/components/OpenBlockPickerButton';
import { scheduleDay7Prompt } from '@/utils/reviewPrompts';
import { getAppOpenStreak } from '@/src/appOpenStreak';
import { maybeNotifyMilestone } from '@/src/milestoneNotifications';
import {
  getBlockState,
} from 'expo-family-controls';

const { width } = Dimensions.get('window');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function HomeScreen() {
  const { loadSobrietyData, saveSobrietyData } = useFirestore();
  const [sobrietyData, setSobrietyData] = useState({
    startDate: new Date().toISOString(),
    daysSober: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalRelapses: 0,
    lastMilestoneShown: 0, // Pour tracker le dernier palier affiché
  });

  const [, forceUpdate] = useReducer((value) => value + 1, 0);
  const [appOpenStreak, setAppOpenStreak] = useState(0);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const milestoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blockingState, setBlockingState] = useState<any>(null);

  const milestones = [
    { day: 1, title: "Allumage", image: "https://i.imgur.com/I0CDkDl.png" },
    { day: 3, title: "Stabilité", image: "https://i.imgur.com/cniGCsd.png" },
    { day: 7, title: "Cristal poli", image: "https://i.imgur.com/LNMqJ98.png" },
    { day: 14, title: "Clarté", image: "https://i.imgur.com/MKLuVcH.png" },
    { day: 21, title: "Momentum", image: "https://i.imgur.com/Vl6qAgW.png" },
    { day: 30, title: "Brillance", image: "https://i.imgur.com/MY22kz8.png" },
    { day: 45, title: "Maîtrise", image: "https://i.imgur.com/umTTlbn.png" },
    { day: 60, title: "Résilience", image: "https://i.imgur.com/nDgOpzY.png" },
    { day: 75, title: "Force", image: "https://i.imgur.com/GeKdi4a.png" },
    { day: 90, title: "Cristal légendaire", image: "https://i.imgur.com/hPEjBe0.png" }
  ];

  const parsedStartDate = Date.parse(sobrietyData.startDate);
  const startDateMs = Number.isFinite(parsedStartDate) ? parsedStartDate : Date.now();
  const elapsedMs = Math.max(0, Date.now() - startDateMs);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const daysElapsed = Math.floor(elapsedMs / MS_PER_DAY);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 1000);

    return () => clearInterval(interval);
  }, [forceUpdate]);

  useEffect(() => {
    if (sobrietyData.daysSober === daysElapsed) {
      return;
    }
    setSobrietyData((prev) => ({ ...prev, daysSober: daysElapsed }));
  }, [daysElapsed, sobrietyData.daysSober]);
  // VǸrifier les nouveaux paliers atteints
  const scheduleMilestonePopup = useCallback((milestone) => {
    if (milestoneTimeoutRef.current) {
      clearTimeout(milestoneTimeoutRef.current);
    }

    milestoneTimeoutRef.current = setTimeout(() => {
      setCurrentMilestone(milestone);
      setShowMilestonePopup(true);
    }, 600);
  }, []);

  const checkForNewMilestone = useCallback(() => {
    if (!sobrietyData?.daysSober) {
      return;
    }

    const achievedMilestones = milestones.filter((m) => sobrietyData.daysSober >= m.day);
    if (achievedMilestones.length === 0) {
      return;
    }

    const latestMilestone = achievedMilestones[achievedMilestones.length - 1];

    const lastShown = sobrietyData.lastMilestoneShown || 0;
    if (latestMilestone.day <= lastShown) {
      return;
    }

    scheduleMilestonePopup(latestMilestone);
    void maybeNotifyMilestone(latestMilestone.day);

    const updatedData = {
      ...sobrietyData,
      lastMilestoneShown: latestMilestone.day,
    };
    setSobrietyData(updatedData);
    saveSobrietyData(updatedData);
    AsyncStorage.setItem('sobrietyData', JSON.stringify(updatedData));
  }, [sobrietyData, milestones, saveSobrietyData, scheduleMilestonePopup]);

  useEffect(() => {
    checkForNewMilestone();
  }, [checkForNewMilestone]);

  const hideMilestonePopup = () => {
    const milestoneForReview = currentMilestone;
    if (milestoneTimeoutRef.current) {
      clearTimeout(milestoneTimeoutRef.current);
      milestoneTimeoutRef.current = null;
    }
    if (reviewTimeoutRef.current) {
      clearTimeout(reviewTimeoutRef.current);
      reviewTimeoutRef.current = null;
    }
    setShowMilestonePopup(false);
    setCurrentMilestone(null);

    if (milestoneForReview?.day === 7) {
      reviewTimeoutRef.current = setTimeout(() => {
        scheduleDay7Prompt();
        reviewTimeoutRef.current = null;
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) {
        clearTimeout(milestoneTimeoutRef.current);
      }
      if (reviewTimeoutRef.current) {
        clearTimeout(reviewTimeoutRef.current);
      }
    };
  }, []);

  const refreshBlockingState = useCallback(async () => {
    try {
      if (Platform.OS !== 'ios') return;
      const state = await getBlockState();
      setBlockingState(state);
    } catch (error) {
      console.log('[Home] getBlockState failed', error);
    }
  }, []);
  const loadData = useCallback(async () => {
    try {
      const { data: firestoreSobrietyData } = await loadSobrietyData();
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      
      let sobrietyDataToUse = null;
      if (firestoreSobrietyData) {
        sobrietyDataToUse = firestoreSobrietyData;
      } else if (sobrietyDataStr) {
        sobrietyDataToUse = JSON.parse(sobrietyDataStr);
      }

      if (sobrietyDataToUse) {
        const data = sobrietyDataToUse;
        const startDate = new Date(data.startDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const actualDaysSober = Math.max(0, daysDiff);
        
        setSobrietyData({
          ...data,
          daysSober: actualDaysSober, // Utiliser le calcul uniforme
          lastMilestoneShown: data.lastMilestoneShown || 0, // Charger le dernier palier affiché
        });
      } else {
        const startDateStr = await AsyncStorage.getItem('sobrietyStartDate');
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const actualDaysSober = Math.max(0, daysDiff);
        
        const initialData = {
          startDate: startDate.toISOString(),
          daysSober: actualDaysSober,
          currentStreak: actualDaysSober,
          longestStreak: 0,
          totalRelapses: 0,
          lastMilestoneShown: 0,
        };
        
        await AsyncStorage.setItem('sobrietyData', JSON.stringify(initialData));
        await saveSobrietyData(initialData);
        setSobrietyData(initialData);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading data:', error);
    }
  }, [loadSobrietyData, saveSobrietyData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      void getAppOpenStreak()
        .then(setAppOpenStreak)
        .catch((error) => console.log('[Home] getAppOpenStreak failed', error));
      void refreshBlockingState();
    }, [loadData, refreshBlockingState])
  );

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const getNextMilestone = () => {
    return milestones.find((m) => daysElapsed < m.day) || milestones[milestones.length - 1];
  };

  const getMilestoneProgress = () => {
    const milestone = getNextMilestone();
    if (daysElapsed >= milestone.day) return 100;
    return (daysElapsed / milestone.day) * 100;
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. Logo et slogan */}
          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.slogan}>Tu forges ta liberté</Text>
            <View style={styles.appOpenStreakPill}>
              <Text style={styles.appOpenStreakEmoji}>🔥</Text>
              <Text style={styles.appOpenStreakText}>{appOpenStreak}</Text>
            </View>
          </View>

          {/* 2. Titre "SOBRE DEPUIS" + Bloc central */}
          <View style={styles.centralBlock}>
            
            {/* Titre SOBRE DEPUIS */}
            <Text style={styles.sobreDepuis}>SOBRE DEPUIS</Text>
            
            {/* Disposition horizontale : Timer à gauche + Cristal à droite */}
            <View style={styles.timerAndCrystalRow}>
              {/* Timer vertical à gauche */}
              <View style={styles.timerSection}>
                
                <View style={styles.timerVertical}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeNumber}>{daysElapsed}</Text>
                    <Text style={styles.timeLabel}>jours</Text>
                  </View>
                  
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeNumberMedium}>{formatTime(hours)}</Text>
                    <Text style={styles.timeLabel}>heures</Text>
                  </View>
                  
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeNumberMedium}>{formatTime(minutes)}</Text>
                    <Text style={styles.timeLabel}>minutes</Text>
                  </View>
                  
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeNumberSmall}>{formatTime(seconds)}</Text>
                    <Text style={styles.timeLabel}>secondes</Text>
                  </View>
                </View>
              </View>

              {/* Cristal à droite */}
              <View style={styles.crystalWrapper}>
                <View style={styles.crystalSection}>
                  <CrystalDisplay daysElapsed={daysElapsed} />
                </View>
              </View>
            </View>
          </View>

          {/* 2.5. Méthode 30-60-90 */}
          <View style={styles.methodSection}>
            <Method306090 
              daysElapsed={daysElapsed}
            />
          </View>

          {/* 3. Barre de progression - Prochain palier */}
          <TouchableOpacity 
            style={styles.progressContainer}
            onPress={() => router.push('/(tabs)/progress')}
          >
            {/* Titre avec cristal à gauche */}
            <View style={styles.progressHeader}>
              <View style={styles.nextCrystalIconLeft}>
                <Image
                  source={{ uri: getNextMilestone().image }}
                  style={styles.nextCrystalIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.progressTitle}>
                Prochain palier : {getNextMilestone().title}
              </Text>
            </View>
            
            {/* Barre de progression raccourcie */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${getMilestoneProgress()}%` }
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Reset */}
          {Platform.OS === 'ios' ? (
            <View style={styles.dailyResetCardWrapper}>
              <View style={styles.dailyResetCard}>
                {(() => {
                  const now = Date.now() / 1000;
                  const unlockedUntil = Number(blockingState?.dailyUnlockedUntil ?? 0);
                  const locked = unlockedUntil <= now;
                  const resetTime = String(blockingState?.dailyResetTime ?? '08:00');

                  return (
                    <>
                      <Text style={styles.dailyResetTitle}>
                        {locked ? '🔒 Tes apps sensibles sont verrouillées.' : '✅ Tes apps sensibles sont déverrouillées.'}
                      </Text>
                      <Text style={styles.dailyResetSubtitle}>
                        {locked
                          ? `Fais ton Daily Reset dans Sobre pour les déverrouiller jusqu'à demain ${resetTime}.`
                          : `Elles resteront déverrouillées jusqu'à demain ${resetTime}.`}
                      </Text>
                      {locked ? (
                        <TouchableOpacity style={styles.dailyResetButton} onPress={() => router.push('/daily-reset')}>
                          <Text style={styles.dailyResetButtonText}>Faire mon Daily Reset</Text>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  );
                })()}
              </View>
            </View>
          ) : null}

          {/* 4. Missions du jour */}
          <DailyMissions />

          {/* 5. Actions rapides (grille 2x2) */}
          <View style={styles.actionsContainer}>
            <View style={styles.actionsGrid}>
              {/* Engagement à un pote */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/commitment')}
              >
                <Share size={24} color="#FFD700" />
                <Text style={styles.actionText}>Engagement{'\n'}envers un proche</Text>
              </TouchableOpacity>

              {/* Journal */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/journal-history')}
              >
                <Book size={24} color="#FFD700" />
                <Text style={styles.actionText}>Journal</Text>
              </TouchableOpacity>

              {/* Raisons */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/reasons')}
              >
                <Heart size={24} color="#FFD700" />
                <Text style={styles.actionText}>Mes raisons{'\n'}d'arrêter</Text>
              </TouchableOpacity>

              {/* Reset */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/relapse')}
              >
                <RotateCcw size={24} color="#FFD700" />
                <Text style={styles.actionText}>Reset{'\n'}sobriété</Text>
              </TouchableOpacity>
            </View>

            {/* Bouton bloquer apps */}
            <OpenBlockPickerButton
              style={styles.blockSitesButton}
              textStyle={styles.blockSitesText}
            />
          </View>

        </ScrollView>
        
        {/* Bouton d'urgence permanent au-dessus de la tab bar */}
        <View 
          style={styles.emergencyButtonContainer}
        >
          <BlurView intensity={20} style={styles.emergencyButtonBlur}>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => router.push('/emergency')}
            >
              <LinearGradient
                colors={['rgba(220, 38, 38, 0.3)', 'rgba(185, 28, 28, 0.5)', 'rgba(153, 27, 27, 0.2)']}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.emergencyGradient}
              >
                <AlertTriangle size={18} color="#FFFFFF" />
                <Text style={styles.emergencyButtonText}>Bouton d'urgence</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
        
        {/* Pop-up de nouveau palier */}
        {showMilestonePopup && currentMilestone && (
          <MilestonePopup
            isVisible={showMilestonePopup}
            milestone={currentMilestone}
            onHide={hideMilestonePopup}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140, // Espace pour tab bar + bouton d'urgence permanent
  },

  // 1. Logo et slogan
  header: {
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    position: 'relative',
  },
  logoImage: {
    width: 120,
    height: 40,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#DDDDDD',
    marginTop: 2,
    textAlign: 'center',
  },
  appOpenStreakPill: {
    position: 'absolute',
    top: 14,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  appOpenStreakEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  appOpenStreakText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.86)',
  },

  dailyResetCardWrapper: {
    marginHorizontal: 24,
    marginTop: 14,
    marginBottom: 24,
  },
  dailyResetCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  dailyResetTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  dailyResetSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 18,
  },
  dailyResetButton: {
    marginTop: 12,
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyResetButtonText: {
    color: '#000000',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },

  // 2. Bloc central avec titre
  centralBlock: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'flex-start', 
  },
  sobreDepuis: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'left',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  timerAndCrystalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  timerSection: {
    flex: 1.5,
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  timerVertical: {
    alignItems: 'flex-start',
    gap: 16,
  },
  timeBlock: {
    alignItems: 'flex-start',
  },
  timeNumber: {
    fontSize: 84,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -3,
    lineHeight: 84,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    fontWeight: '900',
  },
  timeNumberMedium: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -2,
    lineHeight: 64,
    fontWeight: '800',
  },
  timeNumberSmall: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
    letterSpacing: -1,
    lineHeight: 48,
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#BBBBBB',
    letterSpacing: 0.5,
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  crystalWrapper: {
    marginLeft: -10,
    marginTop: -20,
  },
  crystalSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingRight: 12,
  },

  // 2.5. Méthode 30-60-90
  methodSection: {
    paddingHorizontal: 0, 
    paddingVertical: 16,
  },

  // 3. Barre de progression
  progressContainer: {
    marginHorizontal: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    // Dégradé subtil interne
    position: 'relative',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextCrystalIconLeft: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginRight: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  nextCrystalIconImage: {
    width: 20,
    height: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
  progressBarContainer: {
    width: '85%', // Raccourcie pour laisser de l'espace à droite
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#333333',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  // 5. Actions rapides
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 24,
    width: (width - 68) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  blockSitesButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  blockSitesText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: 8,
  },
  shieldActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  shieldActionButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  shieldActionPrimary: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  shieldActionSecondary: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#444444',
  },
  shieldActionTextPrimary: {
    color: '#FFD700',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  shieldActionTextSecondary: {
    color: '#DDDDDD',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },

  // Bouton d'urgence permanent
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 15, // Très proche de la tab bar
    left: 24,
    right: 24,
    zIndex: 1000,
  },
  emergencyButtonBlur: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emergencyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emergencyGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    shadowColor: 'rgba(220, 38, 38, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  emergencyButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
