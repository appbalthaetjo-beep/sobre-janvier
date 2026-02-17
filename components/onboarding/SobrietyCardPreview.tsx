import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SobreLogo from '@/components/SobreLogo';

export default function SobrietyCardPreview() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.sobrietyCard}>
        <View style={styles.cardHeader}>
          <SobreLogo fontSize={18} color="#FFD700" letterSpacing={1} />
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>Membre</Text>
          </View>
        </View>

        <View style={styles.cardMain}>
          <Text style={styles.sobreText}>Vous Ãªtes sobre depuis</Text>

          <View style={styles.counterContainer}>
            <Text style={styles.daysNumber}>0</Text>
            <Text style={styles.daysLabel}>jours</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 48,
  },
  sobrietyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: 320,
    height: 200,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  memberBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  cardMain: {
    alignItems: 'center',
  },
  sobreText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  daysNumber: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  daysLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

