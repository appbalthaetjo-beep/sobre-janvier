import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerProps {
  startDate: Date;
}

export default function Timer({ startDate }: TimerProps) {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setTime({ hours, minutes, seconds });
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
      <Text style={styles.mainTime}>
        {time.hours}h {formatTime(time.minutes)}m
      </Text>
      <Text style={styles.seconds}>
        {formatTime(time.seconds)}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTime: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  seconds: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});