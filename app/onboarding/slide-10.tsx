import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';
import { ensureLocalNotificationPermission } from '@/src/notifications';

export default function Slide10Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-11');
  };

  const totalDots = 5;
  const activeDotIndex = 4;

  const badgePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(650),
      ]),
    );
    loop.start();

    return () => badgePulse.stopAnimation();
  }, [badgePulse]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void ensureLocalNotificationPermission();
    }, 800);
    return () => clearTimeout(timeout);
  }, []);

  const badgeStyle = {
    transform: [
      {
        scale: badgePulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.28],
        }),
      },
    ],
  } as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.preview}>
          <View style={styles.bellWrap}>
            <Ionicons name="notifications" size={126} color="#FFFFFF" />
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>3</Text>
            </Animated.View>
          </View>

          <View style={styles.notificationCard}>
            <Image
              source={require('../../modules/expo-family-controls/ios/ShieldConfigurationExtension/sobre_shield_logo.png')}
              style={styles.notificationLogo}
              resizeMode="contain"
            />
            <View style={styles.notificationTextCol}>
              <View style={styles.notificationTitleRow}>
                <Text style={styles.notificationTitle}>Il se fait tard…</Text>
                <Text style={styles.notificationTime}>Maintenant</Text>
              </View>
              <Text style={styles.notificationBody} numberOfLines={1}>
                Pense à noter tes symptômes pour garder le cap.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Reste sur la bonne voie</Text>
          <Text style={styles.message}>
            Reste régulier grâce aux rappels, au suivi des séries et aux notifications motivantes — conçus pour te
            garder responsable et avancer.
          </Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: totalDots }).map((_, index) => {
            const isActive = index === activeDotIndex;
            return <View key={index} style={isActive ? styles.dotActive : styles.dot} />;
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F7E08A', '#D6A93A', '#B17A10']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="arrow-forward" size={18} color="#6B4A00" style={styles.nextArrow} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 86,
    height: 86,
  },
  preview: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  bellWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badge: {
    position: 'absolute',
    top: 24,
    right: 26,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  notificationCard: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  notificationLogo: {
    width: 34,
    height: 34,
  },
  notificationTextCol: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  notificationBody: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.65)',
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.22)',
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 106, 0.9)',
  },
  nextButton: {
    borderRadius: 16,
    marginBottom: 34,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    width: '100%',
  },
  nextButtonGradient: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B4A00',
  },
  nextArrow: {
    marginTop: 1,
  },
});
