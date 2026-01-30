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
  getEveningSelection,
  getScheduleSettings,
  openEveningPicker,
  setEveningEnabled,
  setEveningSchedule,
  type SerializedSelection,
} from 'expo-family-controls';

export default function BlockingEveningScreen() {
  const [enabled, setEnabled] = React.useState(true);
  const [startTime, setStartTime] = React.useState('22:00');
  const [endTime, setEndTime] = React.useState('07:00');
  const [selection, setSelection] = React.useState<SerializedSelection | null>(null);
  const [showRangeModal, setShowRangeModal] = React.useState(false);
  const [startInput, setStartInput] = React.useState('22:00');
  const [endInput, setEndInput] = React.useState('07:00');

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getScheduleSettings();
        setEnabled(settings.eveningEnabled);
        setStartTime(settings.eveningStart);
        setEndTime(settings.eveningEnd);
        setStartInput(settings.eveningStart);
        setEndInput(settings.eveningEnd);
        const sel = await getEveningSelection();
        setSelection(sel);
      } catch (error) {
        console.log('[BlockingEvening] Load error:', error);
      }
    };
    load();
  }, []);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    try {
      await setEveningEnabled(value);
    } catch (error) {
      console.log('[BlockingEvening] Toggle error:', error);
    }
  };

  const handleSaveRange = async () => {
    if (!isValidTime(startInput) || !isValidTime(endInput)) {
      Alert.alert('Heure invalide', 'Format attendu HH:mm');
      return;
    }
    setStartTime(startInput);
    setEndTime(endInput);
    setShowRangeModal(false);
    try {
      await setEveningSchedule(startInput, endInput);
    } catch (error) {
      console.log('[BlockingEvening] Set schedule error:', error);
    }
  };

  const handlePickApps = async () => {
    try {
      const sel = await openEveningPicker();
      setSelection(sel);
    } catch (error: any) {
      Alert.alert('Sélection', error?.message ?? 'Impossible d’ouvrir le picker.');
    }
  };

  const count = selection?.applicationsCount ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mode Nuit</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Activer</Text>
        <Switch value={enabled} onValueChange={handleToggle} />
      </View>

      <TouchableOpacity style={styles.pillRow} onPress={() => setShowRangeModal(true)}>
        <Text style={styles.label}>Plage horaire</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {startTime} → {endTime}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handlePickApps}>
        <Text style={styles.primaryButtonText}>Choisir les apps sensibles</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>{count} apps sélectionnées</Text>

      <Modal visible={showRangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Plage horaire</Text>
            <TextInput
              style={styles.modalInput}
              value={startInput}
              onChangeText={setStartInput}
              placeholder="22:00"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              value={endInput}
              onChangeText={setEndInput}
              placeholder="07:00"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowRangeModal(false)}>
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveRange}>
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
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
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
