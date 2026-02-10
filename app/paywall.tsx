import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { showDefaultPaywall } from '@/src/lib/revenuecat';

export default function PaywallQuickActionScreen() {
  React.useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        await showDefaultPaywall({ placement: 'quick_action' });
      } catch (error) {
        console.log('[PaywallQuickAction] showDefaultPaywall failed', error);
      } finally {
        if (active) {
          router.replace('/(tabs)');
        }
      }
    };

    if (Platform.OS === 'web') {
      router.replace('/(tabs)');
      return;
    }

    void run();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#FFD700" />
      <Text style={styles.text}>Ouverture des offres…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  text: {
    color: '#DDDDDD',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});

