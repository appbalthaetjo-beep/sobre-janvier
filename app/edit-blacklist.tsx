import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Globe } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditBlacklistScreen() {
  const [userAddedDomains, setUserAddedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);

  // Domaines par défaut (protégés, non visibles dans l'UI)
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
    loadUserDomains();
  }, []);

  const loadUserDomains = async () => {
    try {
      // Charger seulement les domaines ajoutés par l'utilisateur
      const domainsData = await AsyncStorage.getItem('userAddedDomains');
      if (domainsData) {
        setUserAddedDomains(JSON.parse(domainsData));
      }
      
      // Toujours sauvegarder la liste complète pour le blocage
      const allDomains = [...defaultBlockedDomains, ...(domainsData ? JSON.parse(domainsData) : [])];
      await AsyncStorage.setItem('blockedDomains', JSON.stringify(allDomains));
      
    } catch (error) {
      console.error('Error loading user domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserDomains = async (userDomains: string[]) => {
    try {
      // Sauvegarder les domaines utilisateur séparément
      await AsyncStorage.setItem('userAddedDomains', JSON.stringify(userDomains));
      setUserAddedDomains(userDomains);
      
      // Sauvegarder la liste complète pour le blocage
      const allDomains = [...defaultBlockedDomains, ...userDomains];
      await AsyncStorage.setItem('blockedDomains', JSON.stringify(allDomains));
    } catch (error) {
      console.error('Error saving user domains:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    }
  };

  const addDomain = () => {
    const trimmedDomain = newDomain.trim().toLowerCase();
    
    if (!trimmedDomain) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de domaine.');
      return;
    }

    // Validation basique du format domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(trimmedDomain)) {
      Alert.alert('Erreur', 'Format de domaine invalide. Exemple : example.com');
      return;
    }

    // Vérifier dans la liste complète (défaut + utilisateur)
    const allDomains = [...defaultBlockedDomains, ...userAddedDomains];
    if (allDomains.includes(trimmedDomain)) {
      Alert.alert('Erreur', 'Ce domaine est déjà dans la liste.');
      return;
    }

    const updatedUserDomains = [...userAddedDomains, trimmedDomain];
    saveUserDomains(updatedUserDomains);
    setNewDomain('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Liste noire</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Domaines bloqués</Text>
          <Text style={styles.introText}>
            Gérez la liste des sites qui seront bloqués par votre protection système.
          </Text>
        </View>

        {/* Ajout de domaine */}
        <View style={styles.addContainer}>
          <Text style={styles.addTitle}>Ajouter un nouveau domaine</Text>
          <View style={styles.addInputContainer}>
            <Globe size={20} color="#A3A3A3" />
            <TextInput
              style={styles.addInput}
              placeholder="exemple.com"
              placeholderTextColor="#666666"
              value={newDomain}
              onChangeText={setNewDomain}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={addDomain}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !newDomain.trim() && styles.addButtonDisabled
              ]}
              onPress={addDomain}
              disabled={!newDomain.trim()}
            >
              <Plus size={20} color={newDomain.trim() ? "#000000" : "#666666"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Liste des domaines */}
        <View style={styles.domainsContainer}>
          <Text style={styles.domainsTitle}>
            Sites bloqués
          </Text>
          
          {/* Domaines par défaut (protégés) */}
          <View style={styles.defaultDomainsContainer}>
            <View style={styles.defaultDomainsCard}>
              <View style={styles.defaultDomainsIcon}>
                <Text style={styles.shieldEmoji}>🛡️</Text>
              </View>
              <View style={styles.defaultDomainsContent}>
                <Text style={styles.defaultDomainsTitle}>
                  {defaultBlockedDomains.length + userAddedDomains.length} sites bloqués
                </Text>
                <Text style={styles.defaultDomainsSubtitle}>
                  Protection système intégrée (non modifiable)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>💡 À savoir</Text>
          <Text style={styles.infoText}>
            • La protection de base est automatique et non modifiable{'\n'}
            • Vous pouvez ajouter discrètement vos propres sites{'\n'}
            • Format : example.com (sans http:// ou www){'\n'}
            • Les sites ajoutés rejoignent automatiquement la protection
          </Text>
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
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  introContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  addContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addButtonDisabled: {
    backgroundColor: '#333333',
  },
  domainsContainer: {
    marginBottom: 24,
  },
  domainsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  domainsList: {
    gap: 12,
  },
  domainItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  domainIcon: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  domainText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  defaultDomainsContainer: {
    marginBottom: 24,
  },
  defaultDomainsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  defaultDomainsIcon: {
    backgroundColor: '#2A2A1A',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  shieldEmoji: {
    fontSize: 24,
  },
  defaultDomainsContent: {
    flex: 1,
  },
  defaultDomainsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 4,
  },
  defaultDomainsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  userDomainsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 20,
  },
});