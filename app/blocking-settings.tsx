import React from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

import {
  applyCurrentShieldsNow,
  clearEveningOverride,
  getAuthorizationStatus,
  getDailySelection,
  getEveningSelection,
  getSavedSelection,
  getScheduleSettings,
  openFamilyActivityPicker,
  requestAuthorization,
  setDailyEnabled,
  setEveningEnabled,
} from 'expo-family-controls';
import { isFamilyControlsPickerCanceled } from '@/src/familyControlsErrors';

const lockIllustration = require('../assets/blocking/lock-illustration.png');

export default function BlockingSettingsScreen() {
  const [dailyEnabled, setDailyEnabledState] = React.useState(true);
  const [dailyResetTime, setDailyResetTimeState] = React.useState('08:00');
  const [nightModeEnabled, setNightModeEnabledState] = React.useState(false);
  const [nightStart, setNightStart] = React.useState('22:00');
  const [nightEnd, setNightEnd] = React.useState('07:00');
  const [webFilterEnabled, setWebFilterEnabled] = React.useState(false);
  const [appsCount, setAppsCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const settings = await getScheduleSettings();
      setDailyEnabledState(settings.dailyEnabled);
      setDailyResetTimeState(settings.dailyResetTime ?? '08:00');
      setNightModeEnabledState(settings.eveningEnabled);
      setNightStart(settings.eveningStart ?? '22:00');
      setNightEnd(settings.eveningEnd ?? '07:00');

      const sel = (await getSavedSelection()) ?? (await getDailySelection()) ?? (await getEveningSelection());
      setAppsCount(sel?.applicationsCount ?? 0);
    } catch (error) {
      console.log('[BlockingSettings] refresh failed', error);
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

  const handleToggleDaily = async (value: boolean) => {
    if (Platform.OS !== 'ios') return;
    if (loading) return;
    setLoading(true);
    try {
      await ensureFamilyControlsAuthorized();
      setDailyEnabledState(value);
      await setDailyEnabled(value);
      // Apply immediately so the Shield state matches the toggle.
      await applyCurrentShieldsNow();
    } catch (error: any) {
      console.log('[BlockingSettings] toggle daily failed', error);
      Alert.alert('Daily Reset', error?.message ?? 'Impossible de mettre à jour le réglage.');
      // Roll back UI by refreshing from native state.
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNightMode = async (value: boolean) => {
    if (Platform.OS !== 'ios') return;
    if (loading) return;
    setLoading(true);
    try {
      await ensureFamilyControlsAuthorized();
      setNightModeEnabledState(value);
      await setEveningEnabled(value);
      // If the user previously tapped "Continuer quand même", the evening override can keep the shield
      // disabled for a while. Turning the mode ON should always re-enable friction immediately.
      await clearEveningOverride();
      await applyCurrentShieldsNow();
    } catch (error: any) {
      console.log('[BlockingSettings] toggle night failed', error);
      Alert.alert('Mode Nuit', error?.message ?? 'Impossible de mettre à jour le réglage.');
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleManageApps = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Blocage', 'Disponible uniquement sur iOS.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await ensureFamilyControlsAuthorized();
      const selection = await openFamilyActivityPicker();
      setAppsCount(selection?.applicationsCount ?? 0);
      await applyCurrentShieldsNow();
      /*
        {
          options: ['Daily Reset', 'Mode Nuit', 'Annuler'],
          cancelButtonIndex: 2,
          title: 'Choisir le mode',
        },
        async (buttonIndex) => {
          if (buttonIndex === 2) return;
          setLoading(true);
          try {
            await ensureFamilyControlsAuthorized();
            if (buttonIndex === 0) {
              const selection = await openDailyPicker();
              setDailyAppsCount(selection?.applicationsCount ?? 0);
            } else if (buttonIndex === 1) {
              const selection = await openEveningPicker();
              setNightAppsCount(selection?.applicationsCount ?? 0);
            }
            await applyCurrentShieldsNow();
          } catch (error: any) {
            console.log('[BlockingSettings] open picker failed', error);
            if (isFamilyControlsPickerCanceled(error)) {
              return;
            }
            Alert.alert('Gérer les apps', error?.message ?? "Impossible d'ouvrir le sélecteur d'apps.");
          } finally {
            setLoading(false);
          }
        },
      */
    } catch (error: any) {
      console.log('[BlockingSettings] openFamilyActivityPicker failed', error);
      if (isFamilyControlsPickerCanceled(error)) {
        return;
      }
      Alert.alert('Gérer les apps', error?.message ?? "Impossible d'ouvrir le sélecteur d'apps.");
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
        <Text style={styles.headerTitle}>Blocage &amp; filtres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <Image source={lockIllustration} style={styles.illustration} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modes de protection</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.rowText} onPress={() => router.push('/daily-reset-settings')} activeOpacity={0.85}>
              <Text style={styles.rowLabel}>Daily Reset</Text>
              <Text style={styles.rowDesc}>
                Tes apps sensibles restent verrouillées tant que tu n&apos;as pas fait ton Daily Reset. Après, elles sont
                débloquées jusqu&apos;au lendemain à {dailyResetTime}.
              </Text>
            </TouchableOpacity>
            <Switch value={dailyEnabled} onValueChange={handleToggleDaily} disabled={loading} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <TouchableOpacity style={styles.rowText} onPress={() => router.push('/night-mode-settings')} activeOpacity={0.85}>
              <Text style={styles.rowLabel}>Mode Nuit</Text>
              <Text style={styles.rowDesc}>
                Réduit l&apos;accès à tes apps sensibles le soir ({nightStart}–{nightEnd}).
              </Text>
            </TouchableOpacity>
            <Switch value={nightModeEnabled} onValueChange={handleToggleNightMode} disabled={loading} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Bloquer le contenu adulte sur le web</Text>
              <Text style={styles.rowDesc}>Filtre les sites sensibles dans Safari (bientôt disponible).</Text>
            </View>
            <Switch value={webFilterEnabled} onValueChange={setWebFilterEnabled} />
          </View>

          <TouchableOpacity style={styles.manageAppsButton} onPress={handleManageApps} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.manageAppsButtonText}>
              Gérer les apps bloquées{appsCount ? ` (${appsCount})` : ''}
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
  },
  illustrationWrap: {
    width: '100%',
    height: 300,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
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
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    marginBottom: 6,
  },
  rowDesc: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  manageAppsButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  manageAppsButtonText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
