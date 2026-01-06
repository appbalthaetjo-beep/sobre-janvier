import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDarkProps {
  startDate: Date;
}

export default function TimerDark({ startDate }: TimerDarkProps) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setTime({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Vous êtes sobre depuis :
      </Text>
      <Text style={styles.daysDisplay}>
        {time.days} jour{time.days !== 1 ? 's' : ''}
      </Text>
      <View style={styles.timeDetails}>
        <Text style={styles.timeDetailsText}>
          {time.hours}h {formatTime(time.minutes)}m {formatTime(time.seconds)}s
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3', // Gris neutre
    marginBottom: 16,
    textAlign: 'center',
  },
  mainTime: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF', // Blanc pur
    marginBottom: 8,
    letterSpacing: -2,
    textAlign: 'center',
  },
  daysDisplay: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timeDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  timeDetailsText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5', // Gris très clair
    textAlign: 'center',
  },
});