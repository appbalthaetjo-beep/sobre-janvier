import React from 'react';
import { ActivityIndicator, Platform, StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { getDailySelection, getEveningSelection, getSavedSelection, type SerializedSelection } from 'expo-family-controls';

type OpenBlockPickerButtonProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  onSelectionChange?: (selection: SerializedSelection | null) => void;
};

export default function OpenBlockPickerButton({
  style,
  textStyle,
  iconColor = '#000000',
  onSelectionChange,
}: OpenBlockPickerButtonProps) {
  const [selection, setSelection] = React.useState<SerializedSelection | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadSelection = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const saved = (await getSavedSelection()) ?? (await getDailySelection()) ?? (await getEveningSelection());
      setSelection(saved ?? null);
      onSelectionChange?.(saved ?? null);
    } catch (error) {
      console.log('[FamilyControls] Failed to load saved selection:', error);
    }
  }, [onSelectionChange]);

  React.useEffect(() => {
    void loadSelection();
  }, [loadSelection]);

  const appsCount = selection?.applicationsCount ?? 0;
  const label = appsCount > 0 ? `Bloquer (${appsCount} apps)` : 'Bloquer des apps';

  const handlePress = () => {
    if (loading) return;
    setLoading(true);
    try {
      router.push('/blocking-settings');
    } finally {
      setLoading(false);
    }
  };

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
