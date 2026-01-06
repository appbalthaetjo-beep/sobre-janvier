import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface WeeklyStreakProps {
  weekData: boolean[]; // [L, M, M, J, V, S, D] - true = réussite, false = échec
}

export default function WeeklyStreak({ weekData }: WeeklyStreakProps) {
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  return (
    <View style={styles.container}>
      {dayLabels.map((day, index) => {
        const isSuccess = weekData[index];
        const isToday = index === new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Adjust for Monday start
        
        return (
          <View key={index} style={styles.dayContainer}>
            <View style={[
              styles.dayCircle,
              isSuccess ? styles.successCircle : styles.failCircle,
              isToday && styles.todayCircle
            ]}>
              {isSuccess ? (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <X size={12} color="#FFFFFF" strokeWidth={3} />
              )}
            </View>
            <Text style={[
              styles.dayLabel,
              isToday && styles.todayLabel
            ]}>
              {day}
            </Text>
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
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successCircle: {
    backgroundColor: '#10B981',
  },
  failCircle: {
    backgroundColor: '#EF4444',
  },
  todayCircle: {
    borderWidth: 3,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  todayLabel: {
    color: '#4F46E5',
  },
});