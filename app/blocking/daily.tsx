import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getDailySelection,
  getScheduleSettings,
  openDailyPicker,
  setDailyEnabled,
  setDailyResetTime,
  type SerializedSelection,
} from 'expo-family-controls';

export default function BlockingDailyScreen() {
  const [enabled, setEnabled] = React.useState(true);
  const [resetTime, setResetTime] = React.useState('08:00');
  const [selection, setSelection] = React.useState<SerializedSelection | null>(null);
  const [showTimeModal, setShowTimeModal] = React.useState(false);
  const [timeInput, setTimeInput] = React.useState('08:00');

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getScheduleSettings();
        setEnabled(settings.dailyEnabled);
        setResetTime(settings.dailyResetTime);
        setTimeInput(settings.dailyResetTime);
        const sel = await getDailySelection();
        setSelection(sel);
      } catch (error) {
        console.log('[BlockingDaily] Load error:', error);
      }
    };
    load();
  }, []);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    try {
      await setDailyEnabled(value);
    } catch (error) {
      console.log('[BlockingDaily] Toggle error:', error);
    }
  };

  const handleSaveTime = async () => {
    if (!isValidTime(timeInput)) {
      Alert.alert('Heure invalide', 'Format attendu HH:mm');
      return;
    }
    setResetTime(timeInput);
    setShowTimeModal(false);
    try {
      await setDailyResetTime(timeInput);
    } catch (error) {
      console.log('[BlockingDaily] Set time error:', error);
    }
  };

  const handlePickApps = async () => {
    try {
      const sel = await openDailyPicker();
      setSelection(sel);
    } catch (error: any) {
      Alert.alert('Sélection', error?.message ?? 'Impossible d’ouvrir le picker.');
    }
  };

  const count = selection?.applicationsCount ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réinitialisation quotidienne</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Activer</Text>
        <Switch value={enabled} onValueChange={handleToggle} />
      </View>

      <TouchableOpacity style={styles.pillRow} onPress={() => setShowTimeModal(true)}>
        <Text style={styles.label}>Heure de reset</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{resetTime}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handlePickApps}>
        <Text style={styles.primaryButtonText}>Choisir les apps</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>{count} apps sélectionnées</Text>
      <Text style={styles.noteText}>Déverrouillage après check-in</Text>

      <Modal visible={showTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Heure de reset</Text>
            <TextInput
              style={styles.modalInput}
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="08:00"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveTime}>
                <Text style={styles.modalButtonPrimaryText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function isValidTime(value: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  return !!match;
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pillText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  helperText: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 6,
  },
  noteText: {
    color: '#666666',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalButtonSecondaryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  modalButtonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFD700',
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
  },
});
