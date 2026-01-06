import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import missionsData from '@/data/missions.json';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { recordFullDayAndMaybePrompt } from '@/utils/reviewPrompts';

// MODE DEV : Permet de décocher les missions pour tester
const DEV_MODE = false; // Mode PROD activé

interface Mission {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
}

interface DailyMissionsData {
  date: string; // Format YYYY-MM-DD
  missions: Mission[];
  dayIndex: number;
}

interface BenefitBonus {
  benefitKey: string;
  bonusAmount: number;
}

interface MissionBonusMapping {
  [missionTitle: string]: BenefitBonus[];
}

export function useDailyMissions() {
  const [todaysMissions, setTodaysMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [lastCompletedMission, setLastCompletedMission] = useState<{
    title: string;
    bonuses: BenefitBonus[];
  } | null>(null);
  const totalMissions = 3;

  // Mapping des missions vers les bonus de bénéfices
  const missionBonusMapping: MissionBonusMapping = {
    "Lire la leçon du jour": [
      { benefitKey: "Esprit clair", bonusAmount: 0.6 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.4 }
    ],
    "Thérapeute Clario": [
      { benefitKey: "Aisance sociale", bonusAmount: 0.6 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.4 }
    ],
    "Message d'engagement": [
      { benefitKey: "Aisance sociale", bonusAmount: 0.5 },
      { benefitKey: "Force intérieure", bonusAmount: 0.5 }
    ],
    "Écrire dans mon journal": [
      { benefitKey: "Force intérieure", bonusAmount: 0.6 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.4 }
    ],
    "Relire mes raisons d'arrêter": [
      { benefitKey: "Force intérieure", bonusAmount: 0.5 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.5 }
    ],
    "Exercice de reconcentration": [
      { benefitKey: "Capacité d'action", bonusAmount: 0.6 },
      { benefitKey: "Esprit clair", bonusAmount: 0.4 }
    ],
    "Sécuriser mon environnement": [
      { benefitKey: "Capacité d'action", bonusAmount: 0.5 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.5 }
    ],
    "Partager dans la communauté": [
      { benefitKey: "Aisance sociale", bonusAmount: 0.6 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.4 }
    ],
    "Méditation guidée": [
      { benefitKey: "Esprit clair", bonusAmount: 0.6 },
      { benefitKey: "Stabilité mentale", bonusAmount: 0.4 }
    ],
    "Exercice de respiration": [
      { benefitKey: "Esprit clair", bonusAmount: 0.5 },
      { benefitKey: "Repos profond", bonusAmount: 0.5 }
    ]
  };

  // Fonction pour calculer l'index du jour (0-29) basé sur le jour de l'année
  const getDayIndex = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return (dayOfYear - 1) % 30; // Index 0-29
  };

  // Obtenir la date du jour au format YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Générer les missions du jour basées sur l'index
  const generateTodaysMissions = (dayIndex: number): Mission[] => {
    const { plan30jours, emojis } = missionsData;
    const todaysPlan = plan30jours[dayIndex] || plan30jours[0]; // Fallback sur jour 1
    
    return todaysPlan.map((missionTitle, index) => ({
      id: `${dayIndex}-${index}`,
      title: missionTitle,
      emoji: emojis[missionTitle] || '📋',
      completed: false
    }));
  };

  // Sauvegarder les bonus de bénéfices pour aujourd'hui
  const saveBenefitBonuses = async (bonuses: BenefitBonus[]) => {
    try {
      const todayString = getTodayString();
      const key = `benefitsBonuses_${todayString}`;
      
      // Charger les bonus existants pour aujourd'hui
      const existingBonusesStr = await AsyncStorage.getItem(key);
      let existingBonuses: BenefitBonus[] = existingBonusesStr ? JSON.parse(existingBonusesStr) : [];
      
      // Ajouter les nouveaux bonus en respectant le cap de +2.0% par jour par bénéfice
      bonuses.forEach(newBonus => {
        const totalForBenefit = existingBonuses
          .filter(b => b.benefitKey === newBonus.benefitKey)
          .reduce((sum, b) => sum + b.bonusAmount, 0);
        
        // Ne pas dépasser +1.0% par jour par bénéfice (réduction du cap)
        const remainingCap = Math.max(0, 1.0 - totalForBenefit);
        const actualBonus = Math.min(newBonus.bonusAmount, remainingCap);
        
        if (actualBonus > 0) {
          existingBonuses.push({
            benefitKey: newBonus.benefitKey,
            bonusAmount: actualBonus
          });
        }
      });
      
      await AsyncStorage.setItem(key, JSON.stringify(existingBonuses));
    } catch (error) {
      console.error('Error saving benefit bonuses:', error);
    }
  };

  // Charger les missions du jour
  const loadTodaysMissions = async () => {
    try {
      const todayString = getTodayString();
      const dayIndex = getDayIndex();
      
      // Vérifier si on a déjà des données pour aujourd'hui
      const storedDataStr = await AsyncStorage.getItem('dailyMissions');
      
      if (storedDataStr) {
        const storedData: DailyMissionsData = JSON.parse(storedDataStr);
        
        // Si c'est le même jour, charger les données existantes
        if (storedData.date === todayString) {
          setTodaysMissions(storedData.missions);
          const completed = storedData.missions.filter(m => m.completed).length;
          setCompletedCount(completed);
          return;
        }
      }
      
      // Nouveau jour ou première fois : générer nouvelles missions
      const newMissions = generateTodaysMissions(dayIndex);
      const newData: DailyMissionsData = {
        date: todayString,
        missions: newMissions,
        dayIndex: dayIndex
      };
      
      await AsyncStorage.setItem('dailyMissions', JSON.stringify(newData));
      setTodaysMissions(newMissions);
      setCompletedCount(0);
      
    } catch (error) {
      console.error('Error loading daily missions:', error);
      // Fallback : générer missions pour le jour 1
      const fallbackMissions = generateTodaysMissions(0);
      setTodaysMissions(fallbackMissions);
      setCompletedCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Marquer une mission comme complétée ET appliquer les bonus
  const completeMission = async (missionId: string) => {
    try {
      // Trouver la mission
      const mission = todaysMissions.find(m => m.id === missionId);
      if (!mission || mission.completed) return;

      // Marquer comme complétée
      const updatedMissions = todaysMissions.map(m =>
        m.id === missionId ? { ...m, completed: true } : m
      );
      
      setTodaysMissions(updatedMissions);
      
      const newCompletedCount = updatedMissions.filter(m => m.completed).length;
      setCompletedCount(newCompletedCount);
      
      // Sauvegarder les missions
      const todayString = getTodayString();
      const dayIndex = getDayIndex();
      
      const updatedData: DailyMissionsData = {
        date: todayString,
        missions: updatedMissions,
        dayIndex: dayIndex
      };
      
      await AsyncStorage.setItem('dailyMissions', JSON.stringify(updatedData));
      
      // Appliquer les bonus de bénéfices
      const bonuses = missionBonusMapping[mission.title] || [];
      if (bonuses.length > 0) {
        await saveBenefitBonuses(bonuses);
        
        setLastCompletedMission({
          title: mission.title,
          bonuses: bonuses
        });
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      if (newCompletedCount === totalMissions) {
        await recordFullDayAndMaybePrompt(new Date().toISOString());
      }
      
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  // Fonction pour décocher une mission (MODE DEV UNIQUEMENT)
  const uncheckMission = useCallback(async (missionId: string) => {
    if (!DEV_MODE) return; // Protection PROD

    try {
      const mission = todaysMissions.find(m => m.id === missionId);
      if (!mission || !mission.completed) return;

      // Marquer comme non complétée
      const updatedMissions = todaysMissions.map(m =>
        m.id === missionId ? { ...m, completed: false } : m
      );
      
      setTodaysMissions(updatedMissions);
      
      const newCompletedCount = updatedMissions.filter(m => m.completed).length;
      setCompletedCount(newCompletedCount);
      
      // Sauvegarder les missions
      const todayString = getTodayString();
      const dayIndex = getDayIndex();
      
      const updatedData: DailyMissionsData = {
        date: todayString,
        missions: updatedMissions,
        dayIndex: dayIndex
      };
      
      await AsyncStorage.setItem('dailyMissions', JSON.stringify(updatedData));
      
      console.log(`DEV MODE: Mission "${mission.title}" décochée`);
      
    } catch (error) {
      console.error('Error unchecking mission:', error);
    }
  }, [todaysMissions, setTodaysMissions, setCompletedCount, DEV_MODE]);

  // Charger au montage du hook
  useEffect(() => {
    loadTodaysMissions();
  }, []);

  // Vérifier automatiquement si on a changé de jour (toutes les minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDateString = getTodayString();
      
      // Si le jour a changé, recharger les missions
      if (todaysMissions.length > 0) {
        AsyncStorage.getItem('dailyMissions').then(storedDataStr => {
          if (storedDataStr) {
            const storedData: DailyMissionsData = JSON.parse(storedDataStr);
            if (storedData.date !== currentDateString) {
              console.log('New day detected, refreshing missions...');
              loadTodaysMissions();
            }
          }
        }).catch(console.error);
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval);
  }, [todaysMissions]);

  return {
    missions: todaysMissions,
    loading,
    completedCount,
    totalMissions,
    completeMission,
    uncheckMission,
    refreshMissions: loadTodaysMissions,
    lastCompletedMission,
    clearLastCompletedMission: () => setLastCompletedMission(null),
    isDevMode: DEV_MODE
  };
}
