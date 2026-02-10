import React from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyCurrentShieldsNow,
  getScheduleSettings,
  setDailyUnlockedUntil,
} from 'expo-family-controls';
import { router } from 'expo-router';
import { ensureDailyResetMorningReminderScheduled } from '@/src/dailyResetReminder';

const { width } = Dimensions.get('window');

export default function DailyCheckinScreen() {
  const [step, setStep] = React.useState(0);
  const [moodValue, setMoodValue] = React.useState(0.5);
  const [isCommitted, setIsCommitted] = React.useState(false);
  const [daysSober, setDaysSober] = React.useState<number | null>(null);
  const [resetTime, setResetTime] = React.useState('08:00');

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getScheduleSettings();
        setResetTime(settings.dailyResetTime);
        const raw = await AsyncStorage.getItem('sobrietyData');
        if (raw) {
          const data = JSON.parse(raw);
          const startDate = new Date(data.startDate);
          const today = new Date();
          const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
          setDaysSober(Math.max(0, diff));
        } else {
          setDaysSober(0);
        }
      } catch (error) {
        console.log('[DailyCheckin] Load error:', error);
      }
    };
    load();
  }, []);

  const handleUnlock = async () => {
    try {
      const nextUnlock = getNextResetTimestamp(resetTime);
      await setDailyUnlockedUntil(nextUnlock);
      await applyCurrentShieldsNow();
      await ensureDailyResetMorningReminderScheduled({ requestPermission: false });
      setStep(2);
    } catch (error: any) {
      Alert.alert('Déblocage', error?.message ?? 'Impossible de débloquer.');
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {step === 0 && (
        <View style={styles.step}>
          <Text style={styles.title}>Comment tu te sens aujourd’hui ?</Text>
          <Text style={styles.subtitle}>Fragile → bien → fort</Text>
          <MoodSlider value={moodValue} onChange={setMoodValue} />
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(1)}>
            <Text style={styles.primaryButtonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.title}>
            Aujourd’hui tu en es à {daysSober ?? 0} jour{(daysSober ?? 0) === 1 ? '' : 's'} de sobriété.
          </Text>
          <Text style={styles.subtitle}>
            Chaque check-in est une victoire. Tu choisis ta liberté.
          </Text>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsCommitted((v) => !v)}>
            <View style={[styles.checkbox, isCommitted && styles.checkboxChecked]} />
            <Text style={styles.checkboxText}>Je signe mon engagement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !isCommitted && styles.primaryButtonDisabled]}
            onPress={handleUnlock}
            disabled={!isCommitted}
          >
            <Text style={styles.primaryButtonText}>Déverrouiller mes apps pour aujourd’hui</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <Text style={styles.title}>Apps débloquées 🎯</Text>
          <Text style={styles.subtitle}>Déverrouillées jusqu’à demain à {resetTime}.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
            <Text style={styles.primaryButtonText}>Retour à l’accueil</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getNextResetTimestamp(time: string) {
  const [hours, minutes] = time.split(':').map((val) => parseInt(val, 10));
  const now = new Date();
  // Unlock until tomorrow at the configured reset time (e.g. 08:00),
  // so the user gets a full day regardless of when they complete the check-in.
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(hours, minutes, 0, 0);
  return target.getTime() / 1000;
}

function MoodSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const trackWidth = width - 80;
  const thumbSize = 28;
  const left = value * (trackWidth - thumbSize);

  const handlePress = (event: any) => {
    const x = event.nativeEvent.locationX;
    const next = Math.min(1, Math.max(0, x / (trackWidth - thumbSize)));
    onChange(next);
  };

  return (
    <TouchableOpacity style={styles.sliderTrack} activeOpacity={1} onPress={handlePress}>
      <View style={styles.sliderFill} />
      <View style={[styles.sliderThumb, { left }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    marginBottom: 24,
  },
  sliderTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
    marginBottom: 32,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
  },
  sliderThumb: {
    position: 'absolute',
    top: -9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#000000',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555555',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
