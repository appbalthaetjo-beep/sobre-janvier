import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { getBlockState, startEmergencyBlock } from 'expo-family-controls';

function formatHHmm(timestamp: number) {
  if (timestamp <= 0) return '';
  const date = new Date(timestamp * 1000);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatMMSS(remaining: number) {
  const total = Math.max(0, Math.floor(remaining));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function EmergencySettingsScreen() {
  const [emergencyActive, setEmergencyActive] = React.useState(false);
  const [emergencyUntil, setEmergencyUntil] = React.useState(0);
  const [now, setNow] = React.useState(Date.now() / 1000);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const state = await getBlockState();
      setEmergencyActive(Boolean((state as any)?.emergencyActive));
      setEmergencyUntil(Number((state as any)?.emergencyUntil ?? 0));
      setNow(Date.now() / 1000);
    } catch (error) {
      console.log('[EmergencySettings] refresh failed', error);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      setNow(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const remaining = Math.max(0, emergencyUntil - now);
  const endAt = formatHHmm(emergencyUntil);

  const handleStart = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading(true);
    try {
      const ok = await startEmergencyBlock();
      if (!ok) {
        Alert.alert('Mode Urgence', "Impossible de lancer le blocage d'urgence.");
      }
      await refresh();
    } catch (error: any) {
      Alert.alert('Mode Urgence', error?.message ?? "Impossible de lancer le blocage d'urgence.");
      console.log('[EmergencySettings] start failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mode Urgence</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Blocage 10 minutes</Text>
          <Text style={styles.cardDesc}>
            Bloque immédiatement tes apps sensibles pendant 10 minutes. Elles se débloqueront automatiquement à la fin du timer.
          </Text>

          <View style={styles.timerContainer}>
            <View style={styles.timerCircleOuter}>
              <View style={styles.timerCircleInner}>
                <Text style={styles.timerValue}>{emergencyActive ? formatMMSS(remaining) : '10:00'}</Text>
                <Text style={styles.timerLabel}>{emergencyActive ? 'restantes' : 'prêt'}</Text>
              </View>
            </View>
            {emergencyActive && endAt ? (
              <Text style={styles.timerHint}>Déblocage prévu vers {endAt}</Text>
            ) : (
              <Text style={styles.timerHint}>Le blocage se désactive automatiquement après 10 minutes.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, emergencyActive && styles.primaryButtonDisabled]}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={loading || emergencyActive}
          >
            <Text style={styles.primaryButtonText}>
              {emergencyActive ? 'Blocage en cours...' : "Lancer le blocage d'urgence"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  cardDesc: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
    gap: 10,
  },
  timerCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircleInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  timerLabel: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  timerHint: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
