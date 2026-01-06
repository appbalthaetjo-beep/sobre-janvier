import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { MessageSquare, TriangleAlert as AlertTriangle, TrendingDown, Users, Heart, Target, Zap, X } from 'lucide-react-native';
import ClarioChat from '@/components/ClarioChat';
import { useFirestore } from '@/hooks/useFirestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  interpolate
} from 'react-native-reanimated';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function EmergencyScreen() {
  const [showClarioChat, setShowClarioChat] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const { saveSobrietyData } = useFirestore();
  
  const pulseAnimation = useSharedValue(0);
  
  const motivationalMessages = [
    "Il faut seulement 90 secondes pour qu'une pulsion disparaisse.",
    "Tu es plus fort que cette envie.",
    "Ton cerveau se reconstruit à chaque seconde de résistance.",
    "Ton futur toi te dira merci.",
    "Ce moment va passer."
  ];

  const relapseConsequences = [
    {
      id: 1,
      icon: TrendingDown,
      title: "Diminution de l'estime de soi",
      description: "Sentiment de honte et de dévalorisation personnelle"
    },
    {
      id: 2,
      icon: AlertTriangle,
      title: "Besoin de contenus plus extrêmes",
      description: "Escalade vers des contenus de plus en plus problématiques"
    },
    {
      id: 3,
      icon: Zap,
      title: "Perte de motivation et d'énergie",
      description: "Fatigue mentale et physique, perte de productivité"
    },
    {
      id: 4,
      icon: Users,
      title: "Isolement et culpabilité",
      description: "Retrait social et cycles de culpabilité destructeurs"
    },
    {
      id: 5,
      icon: Heart,
      title: "Dévalorisation dans les relations",
      description: "Impact négatif sur l'intimité et les relations personnelles"
    }
  ];

  // Animation de pulsation
  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  // Effet machine à écrire
  useEffect(() => {
    const currentMessage = motivationalMessages[currentMessageIndex];
    let charIndex = 0;
    setDisplayedText('');

    const typewriterInterval = setInterval(() => {
      if (charIndex <= currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typewriterInterval);
        // Passer au message suivant après 3 secondes
        setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
        }, 3000);
      }
    }, 50);

    return () => clearInterval(typewriterInterval);
  }, [currentMessageIndex]);

  const handleRelapse = async () => {
    router.push('/relapse');
  };

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.05]);
    return {
      transform: [{ scale }],
    };
  });

  const handleCameraPermission = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Caméra indisponible',
        "La caméra n'est pas accessible depuis Expo Go. Installe la version de développement (expo run:ios ou dev build) pour tester cette fonctionnalité."
      );
      return;
    }

    try {
      const response = await requestPermission();
      if (!response?.granted && !response?.canAskAgain && Linking.openSettings) {
        Alert.alert(
          'Permission nécessaire',
          'Active la caméra dans les réglages pour utiliser cette fonctionnalité.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings?.() },
          ]
        );
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Erreur', 'Impossible de demander l\'accès à la caméra.');
    }
  };

  if (showClarioChat) {
    return <ClarioChat onClose={() => setShowClarioChat(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton fermer */}
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={styles.closeButton}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image 
            source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.modalSubtitle}>Mode Urgence</Text>
        </View>
        <View style={styles.spacer} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Caméra comme dans Quittr - rectangle simple */}
        <View style={styles.cameraContainer}>
          {!isExpoGo && permission?.granted ? (
            <View style={styles.cameraFrame}>
              <CameraView 
                style={styles.camera}
                facing="front"
              />
              {/* Overlay avec texte machine à écrire */}
              <View style={styles.overlayText}>
                {Platform.OS === 'web' ? (
                  <View style={[styles.overlayBubble, styles.overlayBubbleWeb]}>
                    <Text style={styles.overlayTextContent}>{displayedText}</Text>
                  </View>
                ) : (
                  <BlurView intensity={80} style={styles.overlayBubble}>
                    <View style={styles.overlayBubbleContent}>
                      <Text style={styles.overlayTextContent}>{displayedText}</Text>
                    </View>
                  </BlurView>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={handleCameraPermission}
              >
                <Text style={styles.permissionText}>
                  {isExpoGo
                    ? "Installe la version de développement pour utiliser la caméra en mode urgence."
                    : 'Active la caméra pour rester ancré dans le moment présent.'}
                </Text>
                <View style={styles.activateButton}>
                  <Text style={styles.activateButtonText}>
                    {isExpoGo ? 'En savoir plus' : 'Activer la caméra'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Carrousel "Ce que la rechute t'enlève" */}
        <View style={styles.consequencesSection}>
          <Text style={styles.consequencesTitle}>Ce que la rechute t'enlève :</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.consequencesScrollContent}
            style={styles.consequencesScroll}
          >
            {relapseConsequences.map((consequence) => (
              <View key={consequence.id} style={styles.consequenceCard}>
                <View style={styles.consequenceIcon}>
                  <consequence.icon size={20} color="#DC2626" />
                </View>
                <Text style={styles.consequenceTitle}>{consequence.title}</Text>
                <Text style={styles.consequenceDescription}>
                  {consequence.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Statistique encourageante */}
        <View style={styles.statContainer}>
          <Text style={styles.statTitle}>⚡ RÉSISTANCE = VICTOIRE</Text>
          <Text style={styles.statText}>
            Chaque seconde de résistance renforce ton cerveau.{'\n'}
            90 secondes suffisent pour que l'envie disparaisse.
          </Text>
        </View>
      </ScrollView>

      {/* Boutons d'action fixes en bas */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.panicButton}
          onPress={() => router.push('/stay-sober')}
        >
          <MessageSquare size={20} color="#FFFFFF" />
          <Text style={styles.panicButtonText}>Je sens que je vais rechuter</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.relapseButton}
          onPress={handleRelapse}
        >
          <AlertTriangle size={20} color="#FFFFFF" />
          <Text style={styles.relapseButtonText}>J'ai rechuté</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 160, // Espace pour les boutons fixes
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 26,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginTop: 4,
  },
  spacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    textAlign: 'center',
  },
  cameraContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  cameraFrame: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    width: width - 48,
    height: (width - 48) * 0.75,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlayText: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  overlayBubble: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: '90%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  overlayBubbleWeb: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  overlayBubbleContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  overlayTextContent: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 26,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cameraPlaceholder: {
    width: width - 48,
    height: (width - 48) * 0.75,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionButton: {
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  activateButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  consequencesSection: {
    marginBottom: 32,
  },
  consequencesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  consequencesScroll: {
    paddingLeft: 24,
  },
  consequencesScrollContent: {
    paddingRight: 24,
    gap: 16,
  },
  consequenceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    width: width * 0.7,
    borderWidth: 1,
    borderColor: '#333333',
  },
  consequenceIcon: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  consequenceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  consequenceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    lineHeight: 20,
  },
  statContainer: {
    marginHorizontal: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  statTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  panicButton: {
    backgroundColor: '#DC2626',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  panicButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  relapseButton: {
    backgroundColor: 'rgba(74, 74, 74, 0.8)',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  relapseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
  const isExpoGo = Constants?.appOwnership === 'expo';
