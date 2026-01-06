import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Switch, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, User, CircleHelp as HelpCircle, Bell, Instagram, Video, LogOut, Trash2, Shield, FileText, Crown, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { openManageSubscription } from '@/src/lib/revenuecat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateFrench } from '@/utils/date';
import { readNavigationHistory, clearNavigationHistory } from '@/utils/diagnostics';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const { hasAccess } = useRevenueCat();
  const { user } = useAuth();
  const [restoreEmail, setRestoreEmail] = React.useState('');
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [restoreLoading, setRestoreLoading] = React.useState(false);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);

  const handleInstagram = () => {
    Linking.openURL('https://www.instagram.com/sobre_app_?utm_source=ig_web_button_share_sheet&igsh=MWNoaWxxbmozZ21mMw==').catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien Instagram');
    });
  };

  const handleTikTok = () => {
    Linking.openURL('https://www.tiktok.com/@sobre_1x?is_from_webapp=1&sender_device=pc').catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien TikTok');
    });
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleTermsOfService = () => {
    router.push('/terms-of-service');
  };

  const handleNotifications = () => {
    // Toggle fonctionnel mais simulé pour la prochaine mise à jour
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Notifications', 
      notificationsEnabled 
        ? 'Notifications désactivées (fonctionnalité complète à venir)'
        : 'Notifications activées (fonctionnalité complète à venir)'
    );
  };

  const handleSupport = () => {
    const subject = encodeURIComponent('Demande de support - SØBRE');
    const body = encodeURIComponent(`Bonjour l'équipe SØBRE,

J'ai besoin d'aide concernant l'application SØBRE.

Voici ma demande :
[Décrivez votre problème ou question ici]

Informations techniques (optionnel) :
- Version de l'app : 1.0.0
- Système : ${Platform.OS === 'ios' ? 'iOS' : 'Android'}
- Problème rencontré le : ${formatDateFrench(new Date())}

Merci pour votre aide !

Cordialement`);
    
    const mailtoUrl = `mailto:sobre.appli@gmail.com?subject=${subject}&body=${body}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Impossible d\'ouvrir l\'email',
        'Veuillez nous contacter directement à sobre.appli@gmail.com',
        [
          { text: 'Copier l\'email', onPress: () => {
            Clipboard.setStringAsync('sobre.appli@gmail.com');
            Alert.alert('✅ Copié !', 'L\'adresse email a été copiée dans votre presse-papiers.');
          }},
          { text: 'OK', style: 'cancel' }
        ]
      );
    });
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleManageSubscription = () => {
    openManageSubscription();
  };

  const handleBillingDebug = () => {
    router.push('/debug/billing');
  };

  const handleRestoreProgress = () => {
    setRestoreEmail('');
    setRestoreMessage(null);
    setShowRestoreModal(true);
  };

  const handleShowNavigationHistory = React.useCallback(async () => {
    try {
      const history = await readNavigationHistory();
      if (!history || history.length === 0) {
        Alert.alert('Diagnostic', 'Aucun historique de navigation.');
        return;
      }

      const preview = history
        .slice(Math.max(history.length - 10, 0))
        .map((entry) => {
          const meta = entry.meta ? JSON.stringify(entry.meta) : 'no meta';
          return `${entry.timestamp} - ${entry.action} -> ${entry.path} (${meta})`;
        })
        .join('\n\n');

      Alert.alert(
        'Historique de navigation',
        preview,
        [
          {
            text: 'Effacer',
            style: 'destructive',
            onPress: () => {
              clearNavigationHistory();
              Alert.alert('Diagnostic', 'Historique efface.');
            },
          },
          { text: 'Fermer', style: 'cancel' },
        ],
      );
    } catch (error) {
      console.error('[Settings] Failed to show navigation history', error);
      Alert.alert('Diagnostic', "Impossible de recuperer l'historique.");
    }
  }, []);

  const settingsItems = [
    {
      id: 'profile',
      title: 'Profil',
      icon: User,
      action: handleProfile,
      description: 'Modifier vos informations personnelles'
    },
{
      id: 'support',
      title: 'Support',
      icon: HelpCircle,
      action: handleSupport,
      description: 'Centre d\'aide et assistance'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      action: handleNotifications,
      description: 'Gérer vos notifications',
      hasToggle: true,
      toggleValue: notificationsEnabled,
      onToggle: setNotificationsEnabled
    },
    {
      id: 'instagram',
      title: 'Instagram',
      icon: Instagram,
      action: handleInstagram,
      description: 'Protection pour Instagram'
    },
    {
      id: 'tiktok',
      title: 'TikTok',
      icon: Video,
      action: handleTikTok,
      description: 'Protection pour TikTok'
    },
    {
      id: 'navigation-history',
      title: 'Diagnostic navigation',
      icon: AlertTriangle,
      action: handleShowNavigationHistory,
      description: 'Consulter le dernier historique de navigation'
    },
    {
      id: 'privacy',
      title: 'Politique de confidentialité',
      icon: Shield,
      action: handlePrivacyPolicy,
      description: 'Consulter notre politique de confidentialité'
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: FileText,
      action: handleTermsOfService,
      description: 'Consulter nos conditions d\'utilisation'
    }
  ];

  // Ajouter le bouton de gestion d'abonnement si l'utilisateur a un accès premium
  if (hasAccess) {
    settingsItems.push({
      id: 'manage-subscription',
      title: 'Gérer mon abonnement',
      icon: Crown,
      action: handleManageSubscription,
      description: 'Gérer votre abonnement dans l\'App Store'
    });
  }

  // Ajouter le bouton de debug billing en mode développement
  if (__DEV__) {
    settingsItems.push({
      id: 'billing-debug',
      title: 'Debug Billing (Sandbox)',
      icon: HelpCircle,
      action: handleBillingDebug,
      description: 'Tester les prix et l\'éligibilité'
    });
  }

  if (user) {
    settingsItems.splice(1, 0, {
      id: 'restore-progress',
      title: 'Restaurer mes progrès',
      icon: User,
      action: handleRestoreProgress,
      description: 'Restaurer vos données de progression',
    });
  }

  const handleRestoreSubmit = async () => {
    if (!restoreEmail || restoreLoading) return;
    setRestoreLoading(true);
    setRestoreMessage(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setRestoreMessage("Impossible de récupérer l'utilisateur Supabase.");
        return;
      }

      const supaUserId = authData.user.id;

      const { data: userRow, error: userFetchError } = await supabase
        .from('users')
        .select('migration_restored')
        .eq('id', supaUserId)
        .maybeSingle();

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        setRestoreMessage('Lecture utilisateur Supabase impossible.');
        return;
      }

      if (userRow?.migration_restored) {
        setRestoreMessage('Restauration déjà effectuée.');
        return;
      }

      const normalizedEmail = restoreEmail.trim().toLowerCase();

      const tryLegacyQuery = async (field: string) => {
        const q = query(collection(db, 'users'), where(field, '==', normalizedEmail), limit(1));
        const snap = await getDocs(q);
        return snap.empty ? null : snap.docs[0];
      };

      const legacyDoc =
        (await tryLegacyQuery('email')) ||
        (await tryLegacyQuery('emailLower')) ||
        null;

      if (!legacyDoc) {
        setRestoreMessage(
          "Aucun ancien compte trouvé pour cet email (les comptes Apple hérités peuvent ne pas être récupérables automatiquement)."
        );
        return;
      }

      const legacy = legacyDoc.data() || {};
      const payload = {
        user_id: supaUserId,
        sobriety_start_date: legacy.sobrietyStartDate ?? null,
        days_sober: legacy.daysSober ?? 0,
        longest_streak: legacy.longestStreak ?? 0,
        quiz_answers: legacy.quizAnswers ?? null,
        progression: legacy.progression ?? null,
        restored_from_firebase: true,
      };

      const { error: upsertError } = await supabase.from('user_progress').upsert(payload, { onConflict: 'user_id' });
      if (upsertError) {
        setRestoreMessage('Échec de la sauvegarde Supabase.');
        return;
      }

      const { error: markError } = await supabase
        .from('users')
        .update({ migration_restored: true })
        .eq('id', supaUserId);

      if (markError) {
        setRestoreMessage('Échec du marquage de la restauration.');
        return;
      }

      setRestoreMessage('Restauration effectuée.');
    } catch (error: any) {
      setRestoreMessage(error?.message ?? 'Erreur inattendue.');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réglages</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Settings List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContainer}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingsItem,
                item.isDestructive && styles.settingsItemDestructive
              ]}
              onPress={item.hasToggle ? undefined : item.action}
              activeOpacity={0.8}
              disabled={item.hasToggle}
            >
              <View style={[
                styles.iconContainer,
                item.isDestructive && styles.iconContainerDestructive
              ]}>
                <item.icon 
                  size={20} 
                  color={item.isDestructive ? "#EF4444" : "#A3A3A3"} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.settingsTitle,
                  item.isDestructive && styles.settingsTitleDestructive
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.settingsDescription}>
                  {item.description}
                </Text>
              </View>
              
              {item.hasToggle && (
                <View style={styles.toggleContainer}>
                  <Switch
                    value={item.toggleValue}
                    onValueChange={(value) => {
                      item.onToggle?.(value);
                      handleNotifications();
                    }}
                    trackColor={{ false: "#333333", true: "#FFD700" }}
                    thumbColor="#FFFFFF"
                    style={styles.toggle}
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer info */}
        <View style={styles.footerContainer}>
          <Text style={styles.versionText}>SØBRE v1.0.0</Text>
          <Text style={styles.footerText}>
            Libérez-vous de la pornographie et reprenez le contrôle de votre vie.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showRestoreModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restaurer mes progrès</Text>
            <Text style={styles.modalDescription}>
              Saisis l'email utilisé avant la mise à jour pour récupérer tes données.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              value={restoreEmail}
              onChangeText={setRestoreEmail}
            />
            {restoreMessage ? <Text style={styles.modalMessage}>{restoreMessage}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowRestoreModal(false)}>
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleRestoreSubmit}
                disabled={restoreLoading}
              >
                {restoreLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Restaurer</Text>
                )}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  settingsContainer: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  settingsItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  iconContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingsTitleDestructive: {
    color: '#EF4444',
  },
  settingsDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 18,
  },
  toggleContainer: {
    marginLeft: 16,
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    marginBottom: 12,
  },
  modalMessage: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#1A1A1A',
  },
  modalButtonSecondaryText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  modalButtonPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFD700',
  },
  modalButtonPrimaryText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});
