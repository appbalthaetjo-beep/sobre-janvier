import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function BlockingIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blocage</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/blocking/daily')}>
        <Text style={styles.cardTitle}>Réinitialisation quotidienne</Text>
        <Text style={styles.cardSubtitle}>Configurer la réinitialisation quotidienne</Text>
      </TouchableOpacity>

      {/* Mode Nuit disabled for now */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
});
