import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface WeeklyStreakDarkProps {
  sobrietyData: {
    startDate: string;
    relapseHistory: Array<{
      date: string;
      daysSoberAtRelapse: number;
    }>;
  };
}

export default function WeeklyStreakDark({ sobrietyData }: WeeklyStreakDarkProps) {
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Calculer les données de la semaine actuelle
  const getWeekData = () => {
    const today = new Date();
    const monday = new Date(today);
    
    // Aller au lundi de cette semaine
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const weekData: boolean[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);
      
      // Si le jour est dans le futur, pas encore de données
      if (currentDay > today) {
        weekData.push(false); // Jour futur = pas de coche
        continue;
      }
      
      // Vérifier s'il y a eu une rechute ce jour-là
      const hasRelapseThisDay = sobrietyData.relapseHistory?.some(relapse => {
        const relapseDate = new Date(relapse.date);
        relapseDate.setHours(0, 0, 0, 0);
        return relapseDate.getTime() === currentDay.getTime();
      });
      
      // Si rechute ce jour = échec, sinon succès
      weekData.push(!hasRelapseThisDay);
    }
    
    return weekData;
  };
  
  const weekData = getWeekData();
  
  // Obtenir le jour actuel (0 = lundi, 6 = dimanche)
  const getTodayIndex = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convertir dimanche=0 en dimanche=6
  };
  
  const todayIndex = getTodayIndex();
  
  return (
    <View style={styles.container}>
      {dayLabels.map((day, index) => {
        const isSuccess = weekData[index];
        const isToday = index === todayIndex;
        const isFutureDay = index > todayIndex;
        
        return (
          <View key={index} style={styles.dayContainer}>
            <Text style={[
              styles.dayLabel,
              isToday && styles.todayLabel
            ]}>
              {day}
            </Text>
            <View style={[
              styles.dayCircle,
              isFutureDay ? styles.futureCircle : 
              isSuccess ? styles.successCircle : styles.failCircle,
              isToday && styles.todayCircle
            ]}>
              {isSuccess && !isFutureDay && (
                <Check size={10} color="#000000" strokeWidth={3} />
              )}
              {!isSuccess && !isFutureDay && (
                <X size={8} color="#FFFFFF" strokeWidth={3} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
    marginBottom: 20,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#A3A3A3',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#FFFFFF',
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  successCircle: {
    backgroundColor: '#FFD700', // Jaune doré premium
    borderColor: '#FFD700',
  },
  failCircle: {
    backgroundColor: '#DC2626', // Rouge pour rechute
    borderColor: '#DC2626',
  },
  futureCircle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});