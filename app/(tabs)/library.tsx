import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ImageBackground, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Wind, Brain } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Heart, BookOpen } from 'lucide-react-native';

// Import des modules de leçons
import module1 from '@/data/modules/module1.json';
import module2 from '@/data/modules/module2.json';
import module3 from '@/data/modules/module3.json';
import module4 from '@/data/modules/module4.json';
import module5 from '@/data/modules/module5.json';

const { width, height } = Dimensions.get('window');

interface Lesson {
  id: number;
  title: string;
  content: string;
  duration: string;
  moduleId: number;
}

export default function LibraryScreen() {
  const [userDaysSober, setUserDaysSober] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [daysSinceSignup, setDaysSinceSignup] = useState(0);
  const [readLessons, setReadLessons] = useState<number[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Recharger les données quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      loadUserProgress();
      loadLessonsFromModules();
      loadReadLessons();
    }, [])
  );

  const loadUserProgress = async () => {
    try {
      const sobrietyDataStr = await AsyncStorage.getItem('sobrietyData');
      if (sobrietyDataStr) {
        const data = JSON.parse(sobrietyDataStr);
        
        // Calculer les jours depuis l'inscription (pas depuis la série actuelle)
        const signupDate = new Date(data.originalSignupDate || data.startDate);
        const today = new Date();
        const daysSinceSignupCalc = Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 3600 * 24)) + 1; // +1 car jour 1 = premier jour
        setDaysSinceSignup(Math.max(1, daysSinceSignupCalc));
        
        // Calculer aussi les jours sobres pour d'autres usages
        const startDate = new Date(data.startDate);
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        setUserDaysSober(Math.max(0, daysDiff));
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const loadReadLessons = async () => {
    try {
      const readLessonsStr = await AsyncStorage.getItem('readLessons');
      const readLessonsList = readLessonsStr ? JSON.parse(readLessonsStr) : [];
      setReadLessons(readLessonsList);
      
      // Calculer le nombre de leçons non lues
      const maxAvailableLessons = Math.min(daysSinceSignup, 25);
      const unreadLessons = maxAvailableLessons - readLessonsList.length;
      setUnreadCount(Math.max(0, unreadLessons));
    } catch (error) {
      console.error('Error loading read lessons:', error);
    }
  };

  // Recalculer les notifications quand daysSinceSignup change
  useEffect(() => {
    if (daysSinceSignup > 0) {
      loadReadLessons();
    }
  }, [daysSinceSignup]);

  const markLessonAsRead = async (lessonId: number) => {
    try {
      const updatedReadLessons = [...readLessons, lessonId];
      const uniqueReadLessons = [...new Set(updatedReadLessons)]; // Éviter les doublons
      
      await AsyncStorage.setItem('readLessons', JSON.stringify(uniqueReadLessons));
      setReadLessons(uniqueReadLessons);
      
      // Recalculer les notifications
      const maxAvailableLessons = Math.min(daysSinceSignup, 25);
      const unreadLessons = maxAvailableLessons - uniqueReadLessons.length;
      setUnreadCount(Math.max(0, unreadLessons));
    } catch (error) {
      console.error('Error marking lesson as read:', error);
    }
  };

  const isLessonUnlocked = (lessonId: number) => {
    return lessonId <= daysSinceSignup && lessonId <= 25;
  };

  const showLockedLessonAlert = () => {
    Alert.alert(
      "Leçon verrouillée 🔒",
      "Une nouvelle leçon se débloque chaque jour. Revenez demain pour découvrir la suite !",
      [{ text: "Compris", style: "default" }]
    );
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (!isLessonUnlocked(lesson.id)) {
      showLockedLessonAlert();
      return;
    }
    
    // Marquer comme lue et naviguer
    markLessonAsRead(lesson.id);
    router.push({
      pathname: '/lesson-detail',
      params: { 
        lessonId: lesson.id.toString()
      }
    });
  };

  const handleStartLesson = () => {
    // Commencer par la première leçon disponible non lue
    const firstUnreadLesson = lessons.find(lesson => 
      isLessonUnlocked(lesson.id) && !readLessons.includes(lesson.id)
    );
    
    if (firstUnreadLesson) {
      handleLessonPress(firstUnreadLesson);
    } else {
      // Toutes les leçons disponibles sont lues, aller à la première
      const firstAvailableLesson = lessons.find(lesson => isLessonUnlocked(lesson.id));
      if (firstAvailableLesson) {
        handleLessonPress(firstAvailableLesson);
      }
    }
  };

  const loadLessonsFromModules = () => {
    const allModules = [module1, module2, module3, module4, module5];
    const allLessons: Lesson[] = [];
    
    allModules.forEach(module => {
      module.lessons.forEach(lesson => {
        allLessons.push({
          ...lesson,
          moduleId: module.moduleId
        });
      });
    });
    
    setLessons(allLessons);
  };

  const handleClarioPress = () => {
    router.push('/ai-therapist');
  };

  const handleBreathingPress = () => {
    router.push('/pause-mode');
  };

  const handleMeditationPress = () => {
    router.push('/meditation');
  };

  const handleReasonsPress = () => {
    router.push('/reasons');
  };

  const handleJournalPress = () => {
    router.push('/journal');
  };

  // Fonction pour positionner les hexagones en chemin serpentin
  const getHexagonPosition = (index: number) => {
    // Pattern serpentin : centre, gauche, droite, centre, gauche, droite...
    const positions = ['center', 'left', 'right'];
    const pattern = positions[index % 3];
    
    switch (pattern) {
      case 'left':
        return { alignSelf: 'flex-start', marginLeft: 30 };
      case 'right':  
        return { alignSelf: 'flex-end', marginRight: 30 };
      default: // center
        return { alignSelf: 'center' };
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec bannière */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{ uri: 'https://i.imgur.com/PQ6jTfK.png' }}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            {/* Overlay sombre pour lisibilité */}
            <View style={styles.bannerOverlay} />
            
            {/* Titre Resources en haut à droite */}
            <SafeAreaView style={styles.bannerContent}>
              <View style={styles.resourcesTextContainer}>
                <Text style={styles.resourcesTitle}>Ressources</Text>
                <Text style={styles.resourcesSubtitle}>Outils de soutien immédiat</Text>
              </View>
            </SafeAreaView>
          </ImageBackground>

          {/* Boutons flottants superposés en bas de la bannière */}
          <View style={styles.floatingButtons}>
            {/* Bouton Raisons - Extrémité gauche du W (bas) */}
            <TouchableOpacity
              style={[styles.actionButton, styles.extremeButton]}
              onPress={handleReasonsPress}
              activeOpacity={0.8}
            >
              <Heart size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bouton Respiration - Montée gauche du W (haut) */}
            <TouchableOpacity
              style={[styles.actionButton, styles.sideButton, styles.upButton]}
              onPress={handleBreathingPress}
              activeOpacity={0.8}
            >
              <Wind size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bouton Clario - Centre (sommet du W) - NE PAS BOUGER */}
            <TouchableOpacity
              style={[styles.actionButton, styles.clarioButton]}
              onPress={handleClarioPress}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://i.imgur.com/yWky9d2.png' }}
                style={styles.clarioImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Bouton Méditation - Descente droite du W (haut) */}
            <TouchableOpacity
              style={[styles.actionButton, styles.sideButton, styles.upButton]}
              onPress={handleMeditationPress}
              activeOpacity={0.8}
            >
              <Brain size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bouton Journal - Extrémité droite du W (bas) */}
            <TouchableOpacity
              style={[styles.actionButton, styles.extremeButton]}
              onPress={handleJournalPress}
              activeOpacity={0.8}
            >
              <BookOpen size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Labels sous les boutons */}
          <View style={styles.buttonLabels}>
            <Text style={styles.buttonLabelText}>Raisons</Text>
            <Text style={styles.buttonLabelText}>Focus</Text>
            <Text style={styles.buttonLabelClarioText}>Clario</Text>
            <Text style={styles.buttonLabelText}>Méditation</Text>
            <Text style={styles.buttonLabelText}>Journal</Text>
          </View>
        </View>

        {/* Section des leçons - exactement comme l'image */}
        <View style={styles.lessonsSection}>
          <View style={styles.lessonsTitleContainer}>
            <Text style={styles.lessonsTitle}>Leçons</Text>
            <Text style={styles.lessonsSubtitle}>Programme de rétablissement structuré • 1 leçon par jour</Text>
          </View>
          
          {/* Carte conteneur pour les leçons - Vue limitée à 3-4 leçons */}
          <View style={styles.lessonsCard}>
            <ScrollView 
              style={styles.lessonsScrollContainer}
              contentContainerStyle={styles.lessonsScrollContent}
              showsVerticalScrollIndicator={false}
              inverted={true}
            >
              <View style={styles.lessonsPathContainer}>
                {lessons.map((lesson, index) => {
                  // Inverser l'ordre : leçon 1 en bas, 25 en haut
                  const reversedIndex = lessons.length - 1 - index;
                  const actualLesson = lessons[reversedIndex];
                  
                  return (
                    <View 
                      key={actualLesson.id} 
                      style={[
                        styles.lessonNodeContainer, 
                        getHexagonPosition(index)
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.hexagonLesson,
                          isLessonUnlocked(actualLesson.id) ? styles.hexagonUnlocked : styles.hexagonLocked
                        ]}
                        onPress={() => handleLessonPress(actualLesson)}
                        activeOpacity={0.8}
                      >
                        {isLessonUnlocked(actualLesson.id) ? (
                          <View style={styles.hexagonIcon}>
                            <Text style={styles.hexagonBook}>📖</Text>
                          </View>
                        ) : (
                          <View style={styles.hexagonIcon}>
                            <Text style={styles.hexagonLock}>🔒</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      {/* Titre de la leçon sous l'hexagone */}
                      <Text style={styles.lessonNodeTitle}>{actualLesson.title}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            
            {/* Bouton Start Lesson fixe en bas de la carte */}
            <View style={styles.startLessonContainer}>
              <TouchableOpacity 
                style={styles.startLessonButton}
                onPress={handleStartLesson}
                activeOpacity={0.9}
              >
                <Text style={styles.startLessonText}>Commencer la leçon</Text>
                
                {/* Bulle de notification rouge */}
                {unreadCount > 0 && (
                  <View style={styles.notificationBubble}>
                    <Text style={styles.notificationText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espace pour la tab bar
  },
  headerContainer: {
    position: 'relative',
    height: height * 0.4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerContent: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  resourcesTextContainer: {
    alignItems: 'flex-start',
  },
  resourcesTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resourcesSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: -35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  extremeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 0, // Niveau bas du W
  },
  upButton: {
    marginBottom: -2, // Niveau plus bas du W
  },
  clarioButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    marginBottom: -20,
    shadowColor: 'rgba(255, 255, 255, 0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 10,
  },
  clarioImage: {
    width: 40,
    height: 40,
  },
  buttonLabels: {
    position: 'absolute',
    bottom: -75,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonLabelText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    width: 70,
  },
  buttonLabelClarioText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    width: 75,
    marginTop: 8,
  },
  lessonsSection: {
    marginTop: 120,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  lessonsTitleContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  lessonsTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 8,
  },
  lessonsSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'left',
  },
  lessonsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    height: 400,
    position: 'relative',
  },
  lessonsScrollContainer: {
    flex: 1,
  },
  lessonsScrollContent: {
    paddingVertical: 20,
  },
  lessonsPathContainer: {
    alignItems: 'center',
    paddingBottom: 100, // Plus d'espace pour le bouton
    paddingTop: 20,
  },
  lessonNodeContainer: {
    alignItems: 'center',
    marginBottom: 60, // Plus d'espace entre les hexagones
  },
  hexagonLesson: {
    width: 120,
    height: 104, // Hexagone proportionnel
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  hexagonUnlocked: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  hexagonLocked: {
    backgroundColor: '#8B8B8B',
    shadowColor: '#8B8B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hexagonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonBook: {
    fontSize: 32,
    color: '#000000',
  },
  hexagonLock: {
    fontSize: 32,
    color: '#444444',
  },
  lessonNodeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 140,
    lineHeight: 18,
  },
  startLessonButton: {
    backgroundColor: '#1A1A1A', // Noir lumineux
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FFFFFF', // Effet lumineux
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  startLessonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF', // Texte blanc sur fond noir
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  startLessonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  notificationBubble: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});