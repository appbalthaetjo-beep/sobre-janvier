import React from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

import {
  applyCurrentShieldsNow,
  getAuthorizationStatus,
  getScheduleSettings,
  requestAuthorization,
  setDailyResetTime,
} from 'expo-family-controls';
import { ensureDailyResetMorningReminderScheduled } from '@/src/dailyResetReminder';
import { getHourValues, getMinuteValues, WheelPicker } from '@/src/components/WheelTimePicker';

function parseHHmm(value: string): { hour: number; minute: number } | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function formatHHmm(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

export default function DailyResetSettingsScreen() {
  const [time, setTime] = React.useState('08:00');
  const [draftHour, setDraftHour] = React.useState('08');
  const [draftMinute, setDraftMinute] = React.useState('00');
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const hourValues = React.useMemo(() => getHourValues(), []);
  const minuteValues = React.useMemo(() => getMinuteValues(5), []);

  const refresh = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const settings = await getScheduleSettings();
      if (typeof (settings as any)?.dailyResetTime === 'string') {
        setTime((settings as any).dailyResetTime);
      }
    } catch (error) {
      console.log('[DailyResetSettings] refresh failed', error);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const ensureFamilyControlsAuthorized = async () => {
    const status = await getAuthorizationStatus();
    if (status === 'approved') return;
    const requestStatus = await requestAuthorization();
    if (requestStatus !== 'approved') {
      throw new Error('Autorisation Screen Time refusée.');
    }
  };

  const persistTime = React.useCallback(
    async (hhmm: string) => {
      if (Platform.OS !== 'ios') return;
      try {
        await ensureFamilyControlsAuthorized();
        await setDailyResetTime(hhmm);
        await applyCurrentShieldsNow();
        await ensureDailyResetMorningReminderScheduled();
        console.log('[DailyResetSettings] daily reset time saved', { hhmm });
      } catch (error: any) {
        console.log('[DailyResetSettings] failed to save time', error);
        Alert.alert('Daily Reset', error?.message ?? 'Impossible de mettre à jour l’heure.');
        await refresh();
      }
    },
    [refresh],
  );

  const handleOpenTimePicker = async () => {
    if (Platform.OS !== 'ios') return;
    const parsed = parseHHmm(time) ?? { hour: 8, minute: 0 };
    setDraftHour(String(parsed.hour).padStart(2, '0'));
    setDraftMinute(String(Math.round(parsed.minute / 5) * 5).padStart(2, '0'));
    setShowTimePicker(true);
  };

  const handleConfirmTimePicker = async () => {
    const hhmm = formatHHmm(draftHour, draftMinute);
    setShowTimePicker(false);
    setTime(hhmm);
    await persistTime(hhmm);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres Daily Reset</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Heure du reset</Text>
          <Text style={styles.cardDesc}>
            Choisis l’heure à laquelle ta journée “Daily Reset” recommence. Par défaut, c’est 08:00.
          </Text>

          <TouchableOpacity style={styles.timeRow} onPress={handleOpenTimePicker} activeOpacity={0.85}>
            <View style={styles.timeRowLeft}>
              <Text style={styles.pickerLabel}>Heure</Text>
            </View>
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>{time}</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choisir une heure</Text>
            <Text style={styles.modalHint}>Fais glisser la roue pour choisir l’heure.</Text>
            <View style={styles.modalPicker}>
              <View style={styles.wheelsRow}>
                <WheelPicker value={draftHour} values={hourValues} onChange={setDraftHour} accessibilityLabel="Heures" />
                <Text style={styles.wheelsSeparator}>:</Text>
                <WheelPicker value={draftMinute} values={minuteValues} onChange={setDraftMinute} accessibilityLabel="Minutes" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowTimePicker(false)} activeOpacity={0.85}>
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConfirmTimePicker} activeOpacity={0.85}>
                <Text style={styles.modalButtonPrimaryText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  pickerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  timeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePill: {
    minWidth: 84,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#101010',
    alignItems: 'center',
  },
  timePillText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  primaryButtonText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 18,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  modalHint: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  modalPicker: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: '#0B0B0B',
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  wheelsSeparator: {
    color: '#FFD700',
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalButtonSecondary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  modalButtonSecondaryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
  },
  modalButtonPrimaryText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
