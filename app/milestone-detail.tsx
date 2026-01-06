import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Trophy, Calendar, Target } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withDelay,
  interpolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function MilestoneDetailScreen() {
  const params = useLocalSearchParams();
  const {
    title,
    emoji,
    description,
    image,
    day,
    isUnlocked
  } = params;

  const isUnlockedBool = isUnlocked === 'true';
  
  // Animations
  const headerOpacity = useSharedValue(0);
  const crystalScale = useSharedValue(0.5);
  const crystalOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation séquentielle fluide
    headerOpacity.value = withTiming(1, { duration: 600 });
    
    crystalOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    crystalScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 80 }));
    
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
    
    badgeScale.value = withDelay(1000, withSpring(1, { damping: 10, stiffness: 150 }));
    descriptionOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const crystalStyle = useAnimatedStyle(() => ({
    opacity: crystalOpacity.value,
    transform: [{ scale: crystalScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  const getDescriptionText = () => {
    if (!isUnlockedBool) {
      return "Ce palier sera débloqué lorsque vous atteindrez ce nombre de jours de sobriété. Continuez votre parcours pour découvrir ce cristal !";
    }

    switch (title) {
      case 'Allumage':
        return 'Félicitations ! Vous avez allumé la flamme de votre transformation. Ce premier pas courageusement franchi marque le début de votre renaissance.';
      case 'Stabilité':
        return 'Votre détermination commence à porter ses fruits. Les fondations de votre nouvelle vie se solidifient jour après jour.';
      case 'Cristal poli':
        return 'Une semaine de sobriété ! Votre esprit commence à retrouver sa clarté naturelle. Les premiers bénéfices de votre sevrage se manifestent.';
      case 'Clarté':
        return 'Deux semaines de liberté ! Votre concentration s\'améliore et vous ressentez une nouvelle énergie mentale.';
      case 'Momentum':
        return 'Trois semaines d\'excellence ! Votre élan est maintenant bien établi. Vous développez de nouvelles habitudes saines.';
      case 'Brillance':
        return 'Un mois complet ! Votre transformation devient visible. Votre confiance en vous rayonne et inspire votre entourage.';
      case 'Maîtrise':
        return 'Six semaines de maîtrise ! Vous avez développé une réelle expertise dans la gestion de vos pulsions.';
      case 'Résilience':
        return 'Deux mois de force ! Votre résilience face aux tentations est remarquable. Vous êtes devenu un exemple.';
      case 'Force':
        return 'Plus de deux mois ! Votre force intérieure est désormais inébranlable. Vous maîtrisez parfaitement vos instincts.';
      case 'Cristal légendaire':
        return 'Trois mois complets ! Vous avez atteint le niveau légendaire. Votre transformation est totale et durable.';
      default:
        return 'Un nouveau palier dans votre parcours vers la liberté et l\'épanouissement personnel.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec animation */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Palier de progression</Text>
        <View style={styles.spacer} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Zone cristal centrale */}
        <View style={styles.crystalSection}>
          {isUnlockedBool ? (
            <Animated.View style={[styles.crystalContainer, crystalStyle]}>
              {/* Glow effect pour cristal débloqué */}
              <View style={styles.crystalGlow} />
              <Image
                source={{ uri: image as string }}
                style={styles.crystalImage}
                resizeMode="contain"
              />
              {/* Badge de succès animé */}
              <Animated.View style={[styles.successBadge, badgeStyle]}>
                <Trophy size={20} color="#000000" />
              </Animated.View>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.lockedContainer, crystalStyle]}>
              <View style={styles.lockedBackground}>
                <Lock size={50} color="#666666" />
              </View>
            </Animated.View>
          )}
        </View>

        {/* Titre du palier */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={[
            styles.milestoneTitle,
            isUnlockedBool && styles.milestoneTitleUnlocked
          ]}>
            {title}
          </Text>
        </Animated.View>

        {/* Badge jour */}
        <Animated.View style={[styles.daySection, badgeStyle]}>
          <View style={[
            styles.dayBadge,
            isUnlockedBool && styles.dayBadgeUnlocked
          ]}>
            <Calendar size={20} color={isUnlockedBool ? "#000000" : "#666666"} />
            <Text style={[
              styles.dayText,
              isUnlockedBool && styles.dayTextUnlocked
            ]}>
              {isUnlockedBool ? `Palier atteint au Jour ${day}` : `Jour ${day} verrouillé`}
            </Text>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View style={[styles.descriptionSection, descriptionStyle]}>
          <View style={[
            styles.descriptionCard,
            isUnlockedBool && styles.descriptionCardUnlocked
          ]}>
            <Text style={[
              styles.descriptionText,
              isUnlockedBool && styles.descriptionTextUnlocked
            ]}>
              {getDescriptionText()}
            </Text>
          </View>
        </Animated.View>

        {/* Message de statut */}
        <Animated.View style={[styles.statusSection, descriptionStyle]}>
          <View style={[
            styles.statusCard,
            isUnlockedBool ? styles.statusCardUnlocked : styles.statusCardLocked
          ]}>
            <View style={styles.statusIcon}>
              {isUnlockedBool ? (
                <Target size={24} color="#FFD700" />
              ) : (
                <Lock size={24} color="#666666" />
              )}
            </View>
            <Text style={[
              styles.statusTitle,
              isUnlockedBool ? styles.statusTitleUnlocked : styles.statusTitleLocked
            ]}>
              {isUnlockedBool ? 'Palier débloqué !' : 'Palier verrouillé'}
            </Text>
            <Text style={[
              styles.statusText,
              isUnlockedBool ? styles.statusTextUnlocked : styles.statusTextLocked
            ]}>
              {isUnlockedBool 
                ? 'Félicitations pour avoir atteint ce palier ! Votre progression est remarquable.'
                : 'Continuez votre parcours pour débloquer ce cristal et découvrir ses bénéfices.'
              }
            </Text>
          </View>
        </Animated.View>

        {/* Motivation footer */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationText}>
            {isUnlockedBool 
              ? 'Chaque palier franchi vous rapproche de la liberté totale'
              : 'Chaque jour de sobriété vous rapproche de ce palier'
            }
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  crystalSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  crystalContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD700',
    opacity: 0.15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  crystalImage: {
    width: 150,
    height: 150,
    zIndex: 10,
  },
  successBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBackground: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  milestoneTitle: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  milestoneTitleUnlocked: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  daySection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  dayBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    minWidth: width * 0.7,
    justifyContent: 'center',
  },
  dayBadgeUnlocked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  dayText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginLeft: 8,
  },
  dayTextUnlocked: {
    color: '#000000',
  },
  descriptionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  descriptionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  descriptionCardUnlocked: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 28,
  },
  descriptionTextUnlocked: {
    color: '#F5F5F5',
  },
  statusSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statusCardUnlocked: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  statusCardLocked: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statusIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusTitleUnlocked: {
    color: '#FFD700',
  },
  statusTitleLocked: {
    color: '#666666',
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusTextUnlocked: {
    color: '#F5F5F5',
  },
  statusTextLocked: {
    color: '#A3A3A3',
  },
  motivationSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});