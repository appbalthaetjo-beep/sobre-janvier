import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';

export default function TestimonialsScreen() {
  const { triggerTap } = useHaptics();
  const testimonials = [
    {
      id: 1,
      name: 'Kanye West',
      image: 'https://i.imgur.com/s1k4cy2.png',
      quote: 'Mon addiction à la pornographie a détruit ma famille. Je suis en train de la combattre, et Dieu m\'aide à retrouver ma liberté.',
      isAnonymous: false,
      isVerified: true
    },
    {
      id: 2,
      name: 'Billie Eilish',
      image: 'https://i.imgur.com/t9MhrJV.png',
      quote: 'J\'ai vu du porno dès l\'âge de 11 ans. Je pense que ça a ruiné mon cerveau.',
      isAnonymous: false,
      isVerified: true
    },
    {
      id: 3,
      name: 'Viktor Frankl',
      image: 'https://i.imgur.com/G4lIOEK.png',
      quote: 'Entre le stimulus et la réponse, il y a un espace. Et dans cet espace réside notre pouvoir de choisir.',
      isAnonymous: false,
      isVerified: true
    },
    {
      id: 4,
      name: 'Connor',
      image: null,
      quote: 'Arrêter m\'a permis de changer ma mentalité sur les petites choses de la vie.',
      isAnonymous: false,
      isVerified: true
    },
    {
      id: 5,
      name: 'Finch',
      image: null,
      quote: 'Je vis enfin à la hauteur de mon potentiel et c\'est incroyable.',
      isAnonymous: false,
      isVerified: true
    },
    {
      id: 6,
      name: 'Anonyme',
      image: null,
      quote: 'La vie a retrouvé ses couleurs, et je suis enthousiaste pour l\'avenir.',
      isAnonymous: true,
      isVerified: true
    },
    {
      id: 7,
      name: 'Anonyme',
      image: null,
      quote: 'Je suis plus présent et engagé dans les conversations.',
      isAnonymous: true,
      isVerified: true
    }
  ];

  const handleFinishOnboarding = async () => {
    triggerTap('medium');
    router.push('/onboarding/past-attempts');
  };

  const renderTestimonial = (testimonial) => (
    <View key={testimonial.id} style={styles.testimonialContainer}>
      {/* Photo de profil */}
      <View style={styles.profileSection}>
        {testimonial.image ? (
          <Image 
            source={{ uri: testimonial.image }}
            style={styles.profilePhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.anonymousAvatar}>
            <Text style={styles.anonymousAvatarText}>
              {testimonial.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Contenu du témoignage */}
      <View style={styles.contentSection}>
        {/* Nom avec badge de vérification */}
        <View style={styles.nameContainer}>
          <Text style={styles.personName}>{testimonial.name}</Text>
          {testimonial.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Bulle de citation */}
        <View style={styles.quoteBubble}>
          <Text style={styles.quoteText}>{testimonial.quote}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background avec particules */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.particle, { top: '10%', left: '15%' }]} />
        <View style={[styles.particle, { top: '25%', right: '20%' }]} />
        <View style={[styles.particle, { top: '40%', left: '10%' }]} />
        <View style={[styles.particle, { top: '60%', right: '15%' }]} />
        <View style={[styles.particle, { top: '80%', left: '25%' }]} />
        <View style={[styles.particle, { top: '15%', left: '60%' }]} />
        <View style={[styles.particle, { top: '70%', right: '40%' }]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Pourquoi des milliers décident d'arrêter
          </Text>
        </View>

        {/* Témoignages */}
        <View style={styles.testimonialsContainer}>
          {testimonials.map(renderTestimonial)}
        </View>

        {/* Message d'encouragement final */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementText}>
            Vous n'êtes pas seul dans ce combat. Des milliers de personnes 
            reprennent le contrôle de leur vie chaque jour.
          </Text>
        </View>
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleFinishOnboarding}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  scrollContent: {
    paddingBottom: 120, // Espace pour le bouton fixe
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  testimonialsContainer: {
    paddingHorizontal: 24,
    gap: 24,
  },
  testimonialContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileSection: {
    marginRight: 16,
    marginTop: 4,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  anonymousAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  anonymousAvatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  contentSection: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  verifiedBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  quoteBubble: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
  },
  encouragementContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    marginHorizontal: 24,
    marginTop: 40,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
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
    zIndex: 2,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
