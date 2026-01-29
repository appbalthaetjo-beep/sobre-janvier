import React from 'react';
import { Alert, ActivityIndicator, Platform, StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Shield } from 'lucide-react-native';
import {
  getAuthorizationStatus,
  getSavedSelection,
  openFamilyActivityPicker,
  requestAuthorization,
  type SerializedSelection,
} from 'expo-family-controls';

type OpenBlockPickerButtonProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
};

export default function OpenBlockPickerButton({
  style,
  textStyle,
  iconColor = '#000000',
}: OpenBlockPickerButtonProps) {
  const [selection, setSelection] = React.useState<SerializedSelection | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadSavedSelection = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const saved = await getSavedSelection();
      if (saved) {
        setSelection(saved);
      }
    } catch (error) {
      console.log('[FamilyControls] Failed to load saved selection:', error);
    }
  }, []);

  React.useEffect(() => {
    loadSavedSelection();
  }, [loadSavedSelection]);

  const handlePress = async () => {
    if (loading) return;
    if (Platform.OS !== 'ios') {
      Alert.alert('Family Controls', 'Disponible uniquement sur iOS.');
      return;
    }

    setLoading(true);
    try {
      const status = await getAuthorizationStatus();
      if (status !== 'approved') {
        const requestStatus = await requestAuthorization();
        if (requestStatus !== 'approved') {
          throw new Error('Autorisation refusée.');
        }
      }

      const result = await openFamilyActivityPicker();
      setSelection(result);
    } catch (error: any) {
      console.log('[FamilyControls] Picker error:', error);
      Alert.alert('Family Controls', error?.message ?? 'Erreur lors de la sélection.');
    } finally {
      setLoading(false);
    }
  };

  const appsCount = selection?.applicationsCount ?? 0;
  const label = appsCount > 0 ? `Bloquer (${appsCount} apps)` : 'Bloquer des apps';

  return (
    <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.85} disabled={loading}>
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          <Shield size={20} color={iconColor} />
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
