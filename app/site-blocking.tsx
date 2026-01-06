import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Settings, TestTube, Smartphone, Monitor, List, SquareCheck as CheckSquare, Square, Globe } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

interface BlockingState {
  isEnabled: boolean;
  status: 'off' | 'partiel' | 'actif';
  checklist: {
    ios: {
      screenTimeEnabled: boolean;
      domainsAdded: boolean;
      restrictionsSet: boolean;
    };
    android: {
      privateDNSEnabled: boolean;
      hostFileConfigured: boolean;
      dnsAddressSet: boolean;
    };
  };
}

export default function SiteBlockingScreen() {
  const [blockingState, setBlockingState] = useState<BlockingState>({
    isEnabled: false,
    status: 'off',
    checklist: {
      ios: {
        screenTimeEnabled: false,
        domainsAdded: false,
        restrictionsSet: false,
      },
      android: {
        privateDNSEnabled: false,
        hostFileConfigured: false,
        dnsAddressSet: false,
      }
    }
  });

  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);

  // Liste par défaut des domaines à bloquer
  const defaultBlockedDomains = [
    'example.com',
    'pornhub.com',
    'xvideos.com', 
    'xnxx.com',
    'redtube.com',
    'youjizz.com',
    'youporn.com',
    'spankbang.com',
    'brazzers.com',
    'adultfriendfinder.com',
    'porn.com',
    'sexfinder.com',
    'beeg.com',
    'efukt.com',
    'porntube.com',
    'tube8.com',
    'tnaflix.com',
    'rule34.xxx',
    'fapdu.com',
    'gaytube.com',
    'cam4.com'
  ];

  useEffect(() => {
    loadBlockingData();
    loadUserDomains();
  }, []);

  const loadUserDomains = async () => {
    try {
      const domainsData = await AsyncStorage.getItem('userAddedDomains');
      if (domainsData) {
        setUserAddedDomains(JSON.parse(domainsData));
      }
    } catch (error) {
      console.error('Error loading user domains:', error);
    }
  };

  const loadBlockingData = async () => {
    try {
      // Charger l'état de blocage
      const blockingData = await AsyncStorage.getItem('siteBlockingState');
      if (blockingData) {
        setBlockingState(JSON.parse(blockingData));
      }

      // Charger les domaines bloqués (précharger si vide)
      const domainsData = await AsyncStorage.getItem('blockedDomains');
      if (domainsData) {
        setBlockedDomains(JSON.parse(domainsData));
      } else {
        // Précharger avec la liste par défaut
        setBlockedDomains(defaultBlockedDomains);
        await AsyncStorage.setItem('blockedDomains', JSON.stringify(defaultBlockedDomains));
      }
    } catch (error) {
      console.error('Error loading blocking data:', error);
      // Fallback : utiliser les valeurs par défaut
      setBlockedDomains(defaultBlockedDomains);
    }
  };

  const saveBlockingData = async (newState: BlockingState) => {
    try {
      await AsyncStorage.setItem('siteBlockingState', JSON.stringify(newState));
      setBlockingState(newState);
    } catch (error) {
      console.error('Error saving blocking state:', error);
    }
  };

  // Calculer le statut basé sur la checklist de la plateforme
  const calculateStatus = (state: BlockingState): 'off' | 'partiel' | 'actif' => {
    if (!state.isEnabled) return 'off';

    const currentPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
    const checklist = state.checklist[currentPlatform];
    
    if (currentPlatform === 'ios') {
      const completedSteps = Object.values(checklist).filter(Boolean).length;
      if (completedSteps === 0) return 'off';
      if (completedSteps === 3) return 'actif';
      return 'partiel';
    } else {
      const completedSteps = Object.values(checklist).filter(Boolean).length;
      if (completedSteps === 0) return 'off';
      if (completedSteps === 3) return 'actif';
      return 'partiel';
    }
  };

  const handleToggleBlocking = async () => {
    const newState = {
      ...blockingState,
      isEnabled: !blockingState.isEnabled
    };
    
    newState.status = calculateStatus(newState);
    await saveBlockingData(newState);
  };

  const handleConfigure = () => {
    setShowAssistant(true);
    
    // Toast selon la plateforme
    if (Platform.OS === 'ios') {
      Alert.alert(
        '🍎 Assistant iOS prêt',
        'Coche les étapes au fur et à mesure.'
      );
    } else {
      Alert.alert(
        '🤖 Assistant Android prêt',
        'Coche les étapes au fur et à mesure.'
      );
    }
  };

  const handleTestBlocking = async () => {
    try {
      // Prendre le premier domaine de la liste pour le test
      const testDomain = 'example.com';
      const testUrl = `https://${testDomain}`;
      
      // Toast explicatif puis ouverture directe
      Alert.alert(
        '🧪 Test en cours...',
        `Le site ${testDomain} va s'ouvrir dans votre navigateur.\n\nSi votre protection système est active, il devrait être bloqué automatiquement.\n\n(example.com est dans votre liste noire pour la démonstration)`,
        [{ text: 'Compris' }]
      );
      
      // Ouvrir directement après 1 seconde
      setTimeout(async () => {
        await WebBrowser.openBrowserAsync(testUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error testing blocking:', error);
      Alert.alert('Erreur', 'Impossible de lancer le test de blocage.');
    }
  };

  const handleEditBlacklist = () => {
    router.push('/edit-blacklist');
  };

  const handleChecklistChange = async (platform: 'ios' | 'android', step: string, value: boolean) => {
    const newState = {
      ...blockingState,
      checklist: {
        ...blockingState.checklist,
        [platform]: {
          ...blockingState.checklist[platform],
          [step]: value
        }
      }
    };
    
    newState.status = calculateStatus(newState);
    await saveBlockingData(newState);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'off': return '#666666';
      case 'partiel': return '#F59E0B';
      case 'actif': return '#10B981';
      default: return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'off': return 'Off';
      case 'partiel': return 'Partiel';
      case 'actif': return 'Actif';
      default: return 'Off';
    }
  };

  // Obtenir la checklist selon la plateforme
  const getCurrentChecklist = () => {
    return Platform.OS === 'ios' ? blockingState.checklist.ios : blockingState.checklist.android;
  };

  // Obtenir les étapes selon la plateforme
  const getStepsForPlatform = () => {
    if (Platform.OS === 'ios') {
      return [
        {
          key: 'screenTimeEnabled',
          title: 'Ouvrir Temps d\'écran',
          subtitle: 'Active Temps d\'écran si ce n\'est pas déjà fait.'
        },
        {
          key: 'restrictionsSet',
          title: 'Limiter les sites pour adultes',
          subtitle: 'Contenu & Confidentialité → Contenu web → Limiter les sites pour adultes.'
        },
        {
          key: 'domainsAdded',
          title: 'Ajouter les domaines bloqués',
          subtitle: 'Ajouter les domaines de ta liste noire (copier/coller).'
        }
      ];
    } else {
      return [
        {
          key: 'privateDNSEnabled',
          title: 'Ouvrir Réglages → Réseau & Internet',
          subtitle: 'Accède à DNS privé.'
        },
        {
          key: 'hostFileConfigured',
          title: 'Activer DNS privé',
          subtitle: 'Choisis \'Nom d\'hôte du fournisseur de DNS privé\'.'
        },
        {
          key: 'dnsAddressSet',
          title: 'Saisir l\'adresse DNS filtrante',
          subtitle: 'Colle l\'adresse fournie : dns.adguard.com'
        }
      ];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Blocage des sites</Text>
        <TouchableOpacity onPress={handleEditBlacklist} style={styles.editButton}>
          <List size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showAssistant ? (
          <>
            {/* Introduction */}
            <View style={styles.introContainer}>
              <Text style={styles.introTitle}>Protection contre les sites pour adultes</Text>
              <Text style={styles.introText}>
                Configurez une protection système pour bloquer l'accès aux contenus inappropriés sur votre appareil.
              </Text>
            </View>

            {/* Carte principale de blocage */}
            <View style={styles.blockingCard}>
              {/* Header de la carte */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleSection}>
                  <Shield size={24} color="#FFD700" />
                  <View style={styles.cardTitles}>
                    <Text style={styles.cardTitle}>Blocage des sites</Text>
                    <Text style={styles.cardSubtitle}>
                      Active une protection contre les sites pour adultes.
                    </Text>
                  </View>
                </View>
                
                {/* Toggle principal */}
                <Switch
                  value={blockingState.isEnabled}
                  onValueChange={handleToggleBlocking}
                  trackColor={{ false: "#333333", true: "#FFD700" }}
                  thumbColor="#FFFFFF"
                  style={styles.toggle}
                />
              </View>

              {/* Statut actuel */}
              <View style={styles.statusSection}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(blockingState.status) + '20' },
                  { borderColor: getStatusColor(blockingState.status) }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(blockingState.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(blockingState.status) }
                  ]}>
                    {getStatusText(blockingState.status)}
                  </Text>
                </View>
              </View>

              {/* Boutons d'action */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.configureButton,
                    !blockingState.isEnabled && styles.actionButtonDisabled
                  ]}
                  onPress={handleConfigure}
                  disabled={!blockingState.isEnabled}
                >
                  <Settings size={20} color={blockingState.isEnabled ? "#000000" : "#666666"} />
                  <Text style={[
                    styles.actionButtonText,
                    !blockingState.isEnabled && styles.actionButtonTextDisabled
                  ]}>
                    Configurer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.testButton
                  ]}
                  onPress={handleTestBlocking}
                >
                  <TestTube size={20} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Tester le blocage</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.safeBrowserButton}
                onPress={() => router.push('/safe-browser')}
              >
                <Globe size={20} color="#FFFFFF" />
                <Text style={styles.safeBrowserButtonText}>
                  Ouvrir le navigateur sécurisé
                </Text>
              </TouchableOpacity>
            </View>

            {/* Informations sur la plateforme */}
            <View style={styles.platformInfo}>
              <View style={styles.platformIcon}>
                {Platform.OS === 'ios' ? (
                  <Smartphone size={20} color="#FFD700" />
                ) : (
                  <Monitor size={20} color="#FFD700" />
                )}
              </View>
              <View style={styles.platformContent}>
                <Text style={styles.platformTitle}>
                  Configuration {Platform.OS === 'ios' ? 'iOS' : 'Android'}
                </Text>
                <Text style={styles.platformDescription}>
                  {Platform.OS === 'ios' 
                    ? 'Utilise Screen Time et les restrictions de contenu d\'Apple'
                    : 'Utilise DNS privé filtrant pour bloquer les sites adultes'
                  }
                </Text>
              </View>
            </View>

            {/* Statistiques de blocage */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{blockedDomains.length}</Text>
                  <Text style={styles.statLabel}>Sites bloqués</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {blockingState.status === 'actif' ? '✓' : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Protection active</Text>
                </View>
              </View>
            </View>

            {/* Lien vers la liste noire */}
            <TouchableOpacity style={styles.blacklistLink} onPress={handleEditBlacklist}>
              <List size={20} color="#FFD700" />
              <Text style={styles.blacklistLinkText}>Voir / éditer la liste noire</Text>
            </TouchableOpacity>

            {/* Message d'avertissement */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>⚠️ Important</Text>
              <Text style={styles.warningText}>
                Cette protection aide à réduire l'accès facile aux contenus inappropriés. 
                Elle ne remplace pas votre propre détermination et vigilance.
              </Text>
            </View>
          </>
        ) : (
          /* Assistant selon la plateforme */
          <View style={styles.assistantContainer}>
            {/* Header de l'assistant */}
            <View style={styles.assistantHeader}>
              <TouchableOpacity 
                onPress={() => setShowAssistant(false)} 
                style={styles.assistantBackButton}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.assistantTitle}>
                Assistant {Platform.OS === 'ios' ? 'iOS' : 'Android'}
              </Text>
              <View style={styles.spacer} />
            </View>

            {/* Introduction */}
            <View style={styles.assistantIntro}>
              <Text style={styles.assistantIntroTitle}>
                {Platform.OS === 'ios' 
                  ? 'Active la protection Apple et ajoute notre liste noire.'
                  : 'Active un DNS privé filtrant pour bloquer les sites adultes.'
                }
              </Text>
            </View>

            {/* Checklist des étapes */}
            <View style={styles.checklistContainer}>
              <Text style={styles.checklistTitle}>Étapes à suivre :</Text>
              
              {getStepsForPlatform().map((step, index) => {
                const currentPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
                const isChecked = getCurrentChecklist()[step.key as keyof typeof blockingState.checklist.ios];
                
                return (
                  <TouchableOpacity
                    key={step.key}
                    style={[
                      styles.checklistItem,
                      isChecked && styles.checklistItemChecked
                    ]}
                    onPress={() => handleChecklistChange(currentPlatform, step.key, !isChecked)}
                  >
                    <View style={styles.checklistLeft}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      
                      {isChecked ? (
                        <CheckSquare size={24} color="#FFD700" />
                      ) : (
                        <Square size={24} color="#666666" />
                      )}
                    </View>
                    
                    <View style={styles.checklistContent}>
                      <Text style={[
                        styles.stepTitle,
                        isChecked && styles.stepTitleChecked
                      ]}>
                        {step.title}
                      </Text>
                      <Text style={styles.stepSubtitle}>
                        {step.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Test de blocage dans l'assistant */}
            <View style={styles.assistantTestContainer}>
              <TouchableOpacity
                style={styles.assistantTestButton}
                onPress={handleTestBlocking}
              >
                <TestTube size={20} color="#FFFFFF" />
                <Text style={styles.assistantTestButtonText}>Tester le blocage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.assistantSafeBrowserButton}
                onPress={() => router.push('/safe-browser')}
              >
                <Globe size={20} color="#FFFFFF" />
                <Text style={styles.assistantSafeBrowserButtonText}>
                  Navigateur sécurisé
                </Text>
              </TouchableOpacity>
              <Text style={styles.assistantTestDescription}>
                {Platform.OS === 'ios'
                  ? 'Si Screen Time est bien activé, ce site devrait être bloqué.'
                  : 'Si le DNS filtrant est actif, ce site devrait être bloqué partout.'
                }
              </Text>
            </View>
          </View>
        )}
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
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  editButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  introContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  blockingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardTitles: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  toggle: {
    marginLeft: 16,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  configureButton: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  testButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#666666',
  },
  actionButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  actionButtonTextDisabled: {
    color: '#666666',
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  platformInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  platformIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  platformContent: {
    flex: 1,
  },
  platformTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  blacklistLink: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  blacklistLinkText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginLeft: 8,
  },
  safeBrowserContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  safeBrowserButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 16,
  },
  safeBrowserButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  assistantSafeBrowserButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  assistantSafeBrowserButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  safeBrowserDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#2A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DC2626',
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Styles pour l'assistant
  assistantContainer: {
    paddingTop: 16,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  assistantBackButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  assistantTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  assistantIntro: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  assistantIntroTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 24,
  },
  checklistContainer: {
    marginBottom: 32,
  },
  checklistTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  checklistItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  checklistItemChecked: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  stepNumber: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  checklistContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  stepTitleChecked: {
    color: '#FFD700',
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  assistantTestContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  assistantTestButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  assistantTestButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  assistantTestDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
  },
});