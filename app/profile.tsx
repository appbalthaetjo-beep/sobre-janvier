import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard as Edit3, User, Mail, Crown, MapPin, Calendar, Users, LogOut, Trash2, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  email: string;
  name: string;
  age: number;
  gender: string;
  region: string;
}

interface EditModalProps {
  isVisible: boolean;
  field: keyof UserProfile;
  value: string;
  onSave: (field: keyof UserProfile, value: string) => void;
  onCancel: () => void;
}

function EditModal({ isVisible, field, value, onSave, onCancel }: EditModalProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value, isVisible]);

  const getFieldTitle = () => {
    switch (field) {
      case 'name': return 'Nom';
      case 'age': return 'Âge';
      case 'gender': return 'Genre';
      case 'region': return 'Région';
      default: return 'Modification';
    }
  };

  const getInputType = () => {
    return field === 'age' ? 'numeric' : 'default';
  };

  const handleSave = () => {
    if (!inputValue.trim()) {
      Alert.alert('Erreur', 'Ce champ ne peut pas être vide');
      return;
    }
    
    if (field === 'age') {
      const ageNum = parseInt(inputValue);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        Alert.alert('Erreur', 'Veuillez entrer un âge valide (13-120 ans)');
        return;
      }
    }
    
    onSave(field, inputValue.trim());
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier {getFieldTitle()}</Text>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalInput}
              placeholder={`Nouveau ${getFieldTitle().toLowerCase()}`}
              placeholderTextColor="#666666"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType={getInputType()}
              autoFocus
              maxLength={field === 'age' ? 3 : 50}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSave}
            >
              <Text style={styles.modalSaveText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { saveUserData, loadUserData } = useFirestore();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: user?.email || '',
    name: user?.displayName || '',
    age: 0,
    gender: '',
    region: ''
  });
  const [referralInfo, setReferralInfo] = useState<{
    code: string;
    enteredAt: string;
  } | null>(null);
  const [editModal, setEditModal] = useState<{
    isVisible: boolean;
    field: keyof UserProfile;
    value: string;
  }>({
    isVisible: false,
    field: 'name',
    value: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadProfilePhoto();
    loadReferralInfo();
  }, []);

  const loadProfilePhoto = async () => {
    try {
      // Charger depuis Firebase d'abord
      const { data: firestoreData } = await loadUserData();
      if (firestoreData && firestoreData.profilePhoto) {
        setProfilePhoto(firestoreData.profilePhoto);
        return;
      }

      // Fallback vers AsyncStorage
      const photoData = await AsyncStorage.getItem('profilePhoto');
      if (photoData) {
        setProfilePhoto(photoData);
      }
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  const ensureMediaLibraryPermission = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      if (permission.canAskAgain) {
        Alert.alert(
          'Permission requise',
          "L'accès à la galerie est nécessaire pour changer votre photo de profil."
        );
      } else {
        Alert.alert(
          'Permission bloquée',
          'Veuillez autoriser l\'accès aux photos dans les réglages de votre appareil.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Ouvrir les réglages',
              onPress: () => Linking.openSettings?.(),
            },
          ]
        );
      }
      return false;
    }

    return true;
  };

  const selectProfilePhoto = async () => {
    try {
      const hasPermission = await ensureMediaLibraryPermission();

      if (!hasPermission) {
        return;
      }

      // Lancer le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        
        // Utiliser base64 pour la sauvegarde cross-platform
        const imageData = base64 ? `data:image/jpeg;base64,${base64}` : imageUri;
        
        // Sauvegarder dans Firebase
        await saveUserData({ profilePhoto: imageData });
        
        // Aussi sauvegarder localement
        await AsyncStorage.setItem('profilePhoto', imageData);
        
        setProfilePhoto(imageData);
        
        if (Platform.OS === 'web') {
          window.alert('Photo de profil mise à jour avec succès !');
        } else {
          Alert.alert('Succès', 'Photo de profil mise à jour avec succès !');
        }
      }
    } catch (error) {
      console.error('Error selecting profile photo:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur lors de la sélection de la photo.');
      } else {
        Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
      }
    }
  };

  const loadReferralInfo = async () => {
    try {
      // Charger depuis Firebase d'abord
      const { data: firestoreData } = await loadUserData();
      if (firestoreData && firestoreData.referralCode) {
        setReferralInfo(firestoreData.referralCode);
        console.log('📊 PROFILE: User referral code loaded:', firestoreData.referralCode.code);
        return;
      }

      // Fallback vers AsyncStorage
      const referralData = await AsyncStorage.getItem('referralCode');
      if (referralData) {
        const parsedData = JSON.parse(referralData);
        setReferralInfo(parsedData);
        console.log('📊 PROFILE: User referral code from local:', parsedData.code);
      } else {
        console.log('📊 PROFILE: No referral code found');
      }
    } catch (error) {
      console.error('Error loading referral info:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Charger depuis Firebase d'abord
      const { data: firestoreData } = await loadUserData();
      
      if (firestoreData && firestoreData.profile) {
        setUserProfile(prev => ({
          ...prev,
          ...firestoreData.profile,
          email: user?.email || '' // Toujours depuis Firebase Auth
        }));
        return;
      }
      
      // Charger depuis AsyncStorage
      const personalData = await AsyncStorage.getItem('personalData');
      if (personalData) {
        const { firstName, age } = JSON.parse(personalData) as { firstName?: string; age?: number };
        setUserProfile((prev) => ({
          ...prev,
          name: firstName || user?.displayName || '',
          age: typeof age === 'number' ? age : prev.age,
        }));
      }

      // Charger les réponses du quiz pour le genre
      const quizAnswers = await AsyncStorage.getItem('quizAnswers');
      if (quizAnswers) {
        const answers = JSON.parse(quizAnswers);
        setUserProfile(prev => ({
          ...prev,
          gender: answers.gender === 'masculin' ? 'Masculin' : 
                  answers.gender === 'feminin' ? 'Féminin' : 
                  answers.gender === 'non-binaire' ? 'Non-binaire' : ''
        }));
      }

      // Pour la région, utiliser une valeur par défaut
      setUserProfile(prev => ({
        ...prev,
        region: 'France'
      }));

    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleEdit = (field: keyof UserProfile) => {
    if (field === 'email') return; // Email non modifiable
    
    setEditModal({
      isVisible: true,
      field: field,
      value: userProfile[field].toString()
    });
  };

  const handleSaveField = async (field: keyof UserProfile, value: string) => {
    try {
      const updatedProfile = { ...userProfile, [field]: value };
      setUserProfile(updatedProfile);

      // Si on modifie le nom, mettre à jour l'identité (Firebase ou Supabase selon le flag)
      if (field === 'name' && user) {
        if (USE_SUPABASE_AUTH) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: value },
          });
          if (updateError && __DEV__) {
            console.warn('[Auth] Supabase updateUser failed', updateError);
          }
        } else {
          await updateProfile(user, {
            displayName: value,
          });
        }
      }

      // Sauvegarder dans Firebase
      await saveUserData({ profile: updatedProfile });
      
      // Sauvegarder selon le champ
      if (field === 'name' || field === 'age') {
        const personalData = {
          firstName: field === 'name' ? value : userProfile.name,
          age: field === 'age' ? parseInt(value) : userProfile.age
        };
        await AsyncStorage.setItem('personalData', JSON.stringify(personalData));
      }

      if (field === 'gender') {
        const quizAnswers = await AsyncStorage.getItem('quizAnswers');
        const answers = quizAnswers ? JSON.parse(quizAnswers) : {};
        answers.gender = value.toLowerCase();
        await AsyncStorage.setItem('quizAnswers', JSON.stringify(answers));
      }

      if (field === 'region') {
        await AsyncStorage.setItem('userRegion', value);
      }

      setEditModal({ isVisible: false, field: 'name', value: '' });
      
    } catch (error) {
      console.error('Error saving profile field:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await logout();
              if (error) {
                Alert.alert('Erreur', 'Impossible de se déconnecter : ' + error);
              } else {
                // Effacer les données locales sensibles
                await AsyncStorage.multiRemove([
                  'sobrietyData',
                  'journalEntries', 
                  'userReasons',
                  'completedChallenges',
                  'userCommitments'
                ]);
                router.replace('/auth/login');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Problème lors de la déconnexion');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'ATTENTION : Cette action est irréversible.\n\nToutes vos données seront définitivement supprimées :\n• Progression de sobriété\n• Journal personnel\n• Conversations avec Clario\n• Statistiques et paliers\n\nÊtes-vous absolument certain de vouloir supprimer votre compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            // Seconde confirmation pour les actions critiques
            Alert.alert(
              'Dernière confirmation',
              'Cette action supprimera DÉFINITIVEMENT votre compte et toutes vos données. Êtes-vous absolument sûr ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'Confirmer la suppression', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Effacer immédiatement toutes les données locales
                      await AsyncStorage.clear();
                      
                      // Déconnexion
                      await logout();
                      
                      // Message final avec instructions
                      Alert.alert(
                        'Compte en cours de suppression',
                        'Vos données locales ont été effacées.\n\nPour la suppression définitive de votre compte Firebase, envoyez un email à sobre.appli@gmail.com avec votre adresse d\'inscription.\n\nSuppression effective sous 30 jours maximum.',
                        [{ 
                          text: 'Compris', 
                          onPress: () => router.replace('/auth/login')
                        }]
                      );
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('Erreur', 'Problème lors de la suppression. Contactez sobre.appli@gmail.com');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil utilisateur</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar et nom principal */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={selectProfilePhoto}>
            <View style={styles.avatar}>
              {profilePhoto ? (
                <Image 
                  source={{ uri: profilePhoto }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={40} color="#000000" />
              )}
            </View>
            <View style={styles.cameraOverlay}>
              <Camera size={16} color="#000000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{userProfile.name || 'Utilisateur'}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
        </View>

        {/* Informations du profil */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          {/* Email (non modifiable) */}
          <View style={styles.profileItem}>
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <Mail size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Email</Text>
                <Text style={styles.profileItemValue}>{userProfile.email}</Text>
              </View>
            </View>
          </View>

          {/* Abonnement (placeholder) */}
          <View style={styles.profileItem}>
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <Crown size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Abonnement</Text>
                <Text style={styles.profileItemValuePlaceholder}>Pas encore activé</Text>
              </View>
            </View>
          </View>

          {/* Nom (modifiable) */}
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={() => handleEdit('name')}
          >
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <User size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Nom</Text>
                <Text style={styles.profileItemValue}>
                  {userProfile.name || 'Non renseigné'}
                </Text>
              </View>
            </View>
            <Edit3 size={16} color="#A3A3A3" />
          </TouchableOpacity>

          {/* Âge (modifiable) */}
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={() => handleEdit('age')}
          >
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <Calendar size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Âge</Text>
                <Text style={styles.profileItemValue}>
                  {userProfile.age > 0 ? `${userProfile.age} ans` : 'Non renseigné'}
                </Text>
              </View>
            </View>
            <Edit3 size={16} color="#A3A3A3" />
          </TouchableOpacity>

          {/* Genre (modifiable) */}
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={() => handleEdit('gender')}
          >
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <Users size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Genre</Text>
                <Text style={styles.profileItemValue}>
                  {userProfile.gender || 'Non renseigné'}
                </Text>
              </View>
            </View>
            <Edit3 size={16} color="#A3A3A3" />
          </TouchableOpacity>

          {/* Région (modifiable) */}
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={() => handleEdit('region')}
          >
            <View style={styles.profileItemLeft}>
              <View style={styles.profileItemIcon}>
                <MapPin size={20} color="#FFD700" />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>Région</Text>
                <Text style={styles.profileItemValue}>
                  {userProfile.region || 'Non renseigné'}
                </Text>
              </View>
            </View>
            <Edit3 size={16} color="#A3A3A3" />
          </TouchableOpacity>
        </View>

        {/* Actions dangereuses */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>Actions du compte</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleLogout}
          >
            <View style={styles.dangerButtonContent}>
              <View style={styles.dangerButtonIcon}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <View style={styles.dangerButtonTextContent}>
                <Text style={styles.dangerButtonTitle}>Se déconnecter</Text>
                <Text style={styles.dangerButtonDescription}>
                  Fermer la session en cours
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dangerButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.dangerButtonContent}>
              <View style={[styles.dangerButtonIcon, styles.deleteButtonIcon]}>
                <Trash2 size={20} color="#EF4444" />
              </View>
              <View style={styles.dangerButtonTextContent}>
                <Text style={styles.dangerButtonTitle}>Supprimer le profil et les données</Text>
                <Text style={styles.dangerButtonDescription}>
                  Suppression définitive du compte
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal d'édition */}
      <EditModal
        isVisible={editModal.isVisible}
        field={editModal.field}
        value={editModal.value}
        onSave={handleSaveField}
        onCancel={() => setEditModal({ isVisible: false, field: 'name', value: '' })}
      />
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: '#FFD700',
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  profileSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  profileItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    marginBottom: 4,
  },
  profileItemValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  profileItemValuePlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    fontStyle: 'italic',
  },
  dangerSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerButtonIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deleteButtonIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerButtonTextContent: {
    flex: 1,
  },
  dangerButtonTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginBottom: 4,
  },
  dangerButtonDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  
  // Styles du modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
