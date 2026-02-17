import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const AUTO_ADVANCE_DELAY_MS = 2200;

export default function ConsiderThisScreen() {
  const [firstName, setFirstName] = useState<string>('toi');

  useEffect(() => {
    const loadName = async () => {
      try {
        const personalData = await AsyncStorage.getItem('personalData');
        if (!personalData) return;
        const parsed = JSON.parse(personalData) as { firstName?: string };
        if (parsed.firstName?.trim()) {
          setFirstName(parsed.firstName.trim());
        }
      } catch {
        // ignore
      }
    };

    void loadName();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.replace('/onboarding/question-1');
    }, AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>{`D'accord ${firstName},\npassons au diagnostic...`}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  text: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 28,
  },
});
