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
  setEveningSchedule,
} from 'expo-family-controls';
import { getHourValues, getMinuteValues, WheelPicker } from '@/src/components/WheelTimePicker';

function parseHHmm(value: string): { hour: number; minute: number } | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function formatHHmm(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

export default function NightModeSettingsScreen() {
  const [start, setStart] = React.useState('22:00');
  const [end, setEnd] = React.useState('07:00');
  const [draftStartHour, setDraftStartHour] = React.useState('22');
  const [draftStartMinute, setDraftStartMinute] = React.useState('00');
  const [draftEndHour, setDraftEndHour] = React.useState('07');
  const [draftEndMinute, setDraftEndMinute] = React.useState('00');
  const [showRangePicker, setShowRangePicker] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const hourValues = React.useMemo(() => getHourValues(), []);
  const minuteValues = React.useMemo(() => getMinuteValues(5), []);

  const refresh = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const settings = await getScheduleSettings();
      if (typeof (settings as any)?.eveningStart === 'string') setStart((settings as any).eveningStart);
      if (typeof (settings as any)?.eveningEnd === 'string') setEnd((settings as any).eveningEnd);
    } catch (error) {
      console.log('[NightModeSettings] refresh failed', error);
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

  const persistSchedule = React.useCallback(
    async (nextStart: string, nextEnd: string) => {
      if (Platform.OS !== 'ios') return;
      try {
        await ensureFamilyControlsAuthorized();
        await setEveningSchedule(nextStart, nextEnd);
        await applyCurrentShieldsNow();
        console.log('[NightModeSettings] schedule saved', { start: nextStart, end: nextEnd });
      } catch (error: any) {
        console.log('[NightModeSettings] failed to save schedule', error);
        Alert.alert('Mode Nuit', error?.message ?? 'Impossible de mettre à jour les horaires.');
        await refresh();
      }
    },
    [refresh],
  );

  const handleOpenRangePicker = async () => {
    if (Platform.OS !== 'ios') return;
    const parsedStart = parseHHmm(start) ?? { hour: 22, minute: 0 };
    const parsedEnd = parseHHmm(end) ?? { hour: 7, minute: 0 };
    setDraftStartHour(String(parsedStart.hour).padStart(2, '0'));
    setDraftStartMinute(String(Math.round(parsedStart.minute / 5) * 5).padStart(2, '0'));
    setDraftEndHour(String(parsedEnd.hour).padStart(2, '0'));
    setDraftEndMinute(String(Math.round(parsedEnd.minute / 5) * 5).padStart(2, '0'));
    setShowRangePicker(true);
  };

  const handleConfirmRangePicker = async () => {
    const nextStart = formatHHmm(draftStartHour, draftStartMinute);
    const nextEnd = formatHHmm(draftEndHour, draftEndMinute);
    setShowRangePicker(false);
    setStart(nextStart);
    setEnd(nextEnd);
    await persistSchedule(nextStart, nextEnd);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres Mode Nuit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horaires</Text>
          <Text style={styles.cardDesc}>
            Définis la fenêtre du Mode Nuit. Le mode s’applique tous les jours, et peut traverser minuit (ex : 22:00–07:00).
          </Text>

          <TouchableOpacity style={styles.rangeRow} onPress={handleOpenRangePicker} activeOpacity={0.85}>
            <View style={styles.rangeRowLeft}>
              <Text style={styles.pickerLabel}>Plage</Text>
            </View>
            <View style={styles.rangePill}>
              <Text style={styles.rangePillText}>
                {start}–{end}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showRangePicker} transparent animationType="fade" onRequestClose={() => setShowRangePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choisir la plage horaire</Text>
            <Text style={styles.modalHint}>Fais glisser les roues pour choisir les heures.</Text>
            <View style={styles.modalPicker}>
              <Text style={styles.modalLabel}>Début</Text>
              <View style={styles.wheelsRow}>
                <WheelPicker value={draftStartHour} values={hourValues} onChange={setDraftStartHour} accessibilityLabel="Début heures" />
                <Text style={styles.wheelsSeparator}>:</Text>
                <WheelPicker value={draftStartMinute} values={minuteValues} onChange={setDraftStartMinute} accessibilityLabel="Début minutes" />
              </View>
              <View style={styles.modalDivider} />
              <Text style={styles.modalLabel}>Fin</Text>
              <View style={styles.wheelsRow}>
                <WheelPicker value={draftEndHour} values={hourValues} onChange={setDraftEndHour} accessibilityLabel="Fin heures" />
                <Text style={styles.wheelsSeparator}>:</Text>
                <WheelPicker value={draftEndMinute} values={minuteValues} onChange={setDraftEndMinute} accessibilityLabel="Fin minutes" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowRangePicker(false)} activeOpacity={0.85}>
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConfirmRangePicker} activeOpacity={0.85}>
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
  rangeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rangeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangePill: {
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#101010',
    alignItems: 'center',
  },
  rangePillText: {
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
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  wheelsSeparator: {
    color: '#FFD700',
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  modalLabel: {
    color: '#A3A3A3',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 10,
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
