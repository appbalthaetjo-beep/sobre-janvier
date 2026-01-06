import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Flame, Trophy, RotateCcw, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { requestFeedback } from '@/utils/feedback';

export default function ProfileScreen() {
  const { loadSobrietyData: firestoreLoadSobrietyData, loadUserData, saveUserData } = useFirestore();
  const { user } = useAuth();
  const [userName, setUserName] = useState(user?.displayName || "Utilisateur");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [sobrietyData, setSobrietyData] = useState({
    daysSober: 0,
    longestStreak: 0,
    totalRelapses: 0,
  });

  useEffect(() => {
    loadSobrietyDataLocal();
    loadUserName();
    loadProfilePhoto();
  }, []);

  // Recharger le nom à chaque focus pour synchronisation
  useFocusEffect(
    useCallback(() => {
      loadUserName();
      loadProfilePhoto();
    }, [user])
  );

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
        base64: true, // Pour pouvoir sauvegarder facilement
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

  const loadUserName = async () => {
    try {
      // Priorité à Firebase Auth displayName
      if (user?.displayName) {
        setUserName(user.displayName);
        return;
      }

      // Fallback vers les données Firestore
      const { data: firestoreData } = await loadUserData();
      if (firestoreData && firestoreData.profile && firestoreData.profile.name) {
        setUserName(firestoreData.profile.name);
        return;
      }

      // Fallback vers AsyncStorage
      const personalData = await AsyncStorage.getItem('personalData');
      if (personalData) {
        const { firstName } = JSON.parse(personalData);
        if (firstName) {
          setUserName(firstName);
          return;
        }
      }

      // Dernier fallback
      setUserName("Utilisateur");
    } catch (error) {
      console.error('Error loading user name:', error);
      setUserName("Utilisateur");
    }
  };

  const loadSobrietyDataLocal = async () => {
    try {
      // LOGIQUE UNIFIÉE : Même calcul que partout ailleurs
      const { data: firestoreData } = await firestoreLoadSobrietyData();
      
      let dataToUse = null;
      if (firestoreData) {
        dataToUse = firestoreData;
      } else {
        const localData = await AsyncStorage.getItem('sobrietyData');
        if (localData) {
          dataToUse = JSON.parse(localData);
        }
      }
      
      if (dataToUse) {
        const parsedData = dataToUse;
        const startDate = new Date(parsedData.startDate);
        const today = new Date();
        
        // CALCUL UNIFORME (même que page d'accueil)
        const elapsedMs = today.getTime() - startDate.getTime();
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const daysSober = Math.max(0, Math.floor(totalSeconds / 86400));
        
        console.log('👤 Profile page - Days calculated:', daysSober);
        
        setSobrietyData({
          daysSober: daysSober,
          longestStreak: parsedData.longestStreak || 0,
          totalRelapses: parsedData.totalRelapses || 0,
        });
      }
    } catch (error) {
      console.error('Error loading sobriety data:', error);
    }
  };

  const milestones = [
    { 
      id: 1, 
      day: 1, 
      title: "Allumage", 
      image: "https://i.imgur.com/I0CDkDl.png"
    },
    { 
      id: 2, 
      day: 3, 
      title: "Stabilité", 
      image: "https://i.imgur.com/cniGCsd.png"
    },
    { 
      id: 3, 
      day: 7, 
      title: "Cristal poli", 
      image: "https://i.imgur.com/LNMqJ98.png"
    },
    { 
      id: 4, 
      day: 14, 
      title: "Clarté", 
      image: "https://i.imgur.com/MKLuVcH.png"
    },
    { 
      id: 5, 
      day: 21, 
      title: "Momentum", 
      image: "https://i.imgur.com/Vl6qAgW.png"
    },
    { 
      id: 6, 
      day: 30, 
      title: "Brillance", 
      image: "https://i.imgur.com/MY22kz8.png"
    },
    { 
      id: 7, 
      day: 45, 
      title: "Maîtrise", 
      image: "https://i.imgur.com/umTTlbn.png"
    },
    { 
      id: 8, 
      day: 60, 
      title: "Résilience", 
      image: "https://i.imgur.com/nDgOpzY.png"
    },
    { 
      id: 9, 
      day: 75, 
      title: "Force", 
      image: "https://i.imgur.com/GeKdi4a.png"
    },
    { 
      id: 10, 
      day: 90, 
      title: "Cristal légendaire", 
      image: "https://i.imgur.com/hPEjBe0.png"
    }
  ];

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleInternalFeedbackPress = () => {
    requestFeedback({ context: 'profile_support' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
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
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.email}>{user?.email || ""}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={styles.flameGlow} />
                <Flame size={32} color="#FF6B35" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{sobrietyData.daysSober}</Text>
              <Text style={styles.statLabel}>JOURS SOBRES</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={styles.trophyGlow} />
                <Trophy size={32} color="#FFD700" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{sobrietyData.longestStreak}</Text>
              <Text style={styles.statLabel}>RECORD PERSONNEL</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={styles.recycleGlow} />
                <RotateCcw size={32} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{sobrietyData.totalRelapses}</Text>
              <Text style={styles.statLabel}>REDÉMARRAGES</Text>
            </View>
          </View>
        </View>

        {/* Paliers de progression */}
        <View style={styles.milestonesContainer}>
          <Text style={styles.sectionTitle}>Paliers de progression</Text>
          <View style={styles.milestonesGrid}>
            {milestones.map((milestone, index) => {
              const isUnlocked = sobrietyData.daysSober >= milestone.day;
              
              return (
                <View key={milestone.id} style={styles.milestoneCardContainer}>
                  {isUnlocked ? (
                    <TouchableOpacity
                      style={styles.milestoneCardUnlocked}
                      onPress={() => router.push({
                        pathname: '/milestone-detail',
                        params: {
                          id: milestone.id,
                          title: milestone.title,
                          image: milestone.image,
                          day: milestone.day,
                          isUnlocked: 'true'
                        }
                      })}
                      activeOpacity={0.8}
                    >
                      {/* Badge de validation */}
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                      
                      {/* Image du cristal */}
                      <View style={styles.crystalImageContainer}>
                        <Image
                          source={{ uri: milestone.image }}
                          style={styles.crystalImageLarge}
                          resizeMode="contain"
                        />
                      </View>
                      
                      {/* Nom du palier */}
                      <Text style={styles.milestoneNameUnlocked}>
                        {milestone.title}
                      </Text>
                      
                      {/* Jour */}
                      <Text style={styles.milestoneDayUnlocked}>
                        Jour {milestone.day}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.milestoneCardLocked}>
                      {/* Cadenas */}
                      <View style={styles.lockContainer}>
                        <Text style={styles.lockIcon}>🔒</Text>
                      </View>
                      
                      {/* Texte verrouillé */}
                      <Text style={styles.milestoneNameLocked}>
                        Jour {milestone.day}
                      </Text>
                      <Text style={styles.milestoneDayLocked}>
                        verrouillé
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationTitle}>Vous progressez magnifiquement !</Text>
          <Text style={styles.motivationText}>
            Chaque jour de sobriété est un pas vers une vie meilleure. 
            Votre détermination et votre courage inspirent toute la communauté.
          </Text>
        </View>

        {/* Support & Feedback */}
        <View style={styles.supportContainer}>
          <Text style={styles.sectionTitle}>Aide & retours</Text>
          <View style={styles.supportButtons}>
            <TouchableOpacity style={styles.supportButtonSecondary} onPress={handleInternalFeedbackPress}>
              <Text style={styles.supportButtonSecondaryText}>Envoyer un feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MilestoneCardProps {
  milestone: {
    id: number;
    day: number;
    title: string;
    emoji: string;
    description: string;
    image: string;
  };
  isUnlocked: boolean;
  animationDelay: number;
  onPress: () => void;
}

function MilestoneCard({ milestone, isUnlocked, animationDelay, onPress }: MilestoneCardProps) {
  const scaleAnimation = useSharedValue(0.8);
  const opacityAnimation = useSharedValue(0);

  React.useEffect(() => {
    opacityAnimation.value = withDelay(animationDelay, withTiming(1, { duration: 600 }));
    scaleAnimation.value = withDelay(animationDelay, withSpring(1, { damping: 15, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
    transform: [{ scale: scaleAnimation.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.milestoneCard,
          isUnlocked && styles.milestoneCardUnlocked
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.milestoneImageContainer}>
          <Image
            source={{ uri: milestone.image }}
            style={[
              styles.milestoneImage,
              !isUnlocked && styles.milestoneImageLocked
            ]}
            resizeMode="contain"
          />
          {isUnlocked && (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedText}>✓</Text>
            </View>
          )}
          {!isUnlocked && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedText}>🔒</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.milestoneTitle,
          isUnlocked && styles.milestoneTitleUnlocked
        ]}>
          {milestone.title}
        </Text>
        <Text style={styles.milestoneDay}>Jour {milestone.day}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface LockedMilestoneCardProps {
  milestone: {
    id: number;
    day: number;
    title: string;
  };
  animationDelay: number;
}

function LockedMilestoneCard({ milestone, animationDelay }: LockedMilestoneCardProps) {
  const scaleAnimation = useSharedValue(0.8);
  const opacityAnimation = useSharedValue(0);

  React.useEffect(() => {
    opacityAnimation.value = withDelay(animationDelay, withTiming(1, { duration: 600 }));
    scaleAnimation.value = withDelay(animationDelay, withSpring(1, { damping: 15, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
    transform: [{ scale: scaleAnimation.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.lockedMilestoneCard}>
        <View style={styles.lockedIcon}>
          <Text style={styles.lockedText}>🔒</Text>
        </View>
        <Text style={styles.lockedMilestoneTitle}>
          Jour {milestone.day} verrouillé
        </Text>
      </View>
    </Animated.View>
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
    padding: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#FFD700',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  statIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  flameGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    opacity: 0.6,
  },
  trophyGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    opacity: 0.6,
  },
  recycleGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    opacity: 0.6,
  },
  statNumber: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  milestonesContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  milestoneCardContainer: {
    width: '47%', // 2 colonnes parfaites
    aspectRatio: 1, // Parfaitement carré
    marginBottom: 16,
  },
  milestoneCardUnlocked: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    flex: 1,
  },
  milestoneCardLocked: {
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  checkMark: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  crystalImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flex: 1,
  },
  crystalImageLarge: {
    width: 80,
    height: 80,
  },
  milestoneNameUnlocked: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneDayUnlocked: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  lockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 40,
    color: '#FFD700',
  },
  milestoneNameLocked: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneDayLocked: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    textAlign: 'center',
  },
  motivationContainer: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  motivationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
    textAlign: 'center',
  },
  supportContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  supportButtons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  supportButtonPrimary: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  supportButtonPrimaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  supportButtonSecondary: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2F32',
  },
  supportButtonSecondaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
