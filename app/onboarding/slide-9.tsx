import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';

type AppIconProps = {
  backgroundColor: string;
  icon: React.ReactNode;
  style?: object;
};

function AppIcon({ backgroundColor, icon, style }: AppIconProps) {
  return (
    <View style={[styles.appIcon, { backgroundColor }, style]}>
      {icon}
    </View>
  );
}

export default function Slide9Screen() {
  const { triggerTap } = useHaptics();

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-10');
  };

  const totalDots = 5;
  const activeDotIndex = 3;

  const i1 = useRef(new Animated.Value(0)).current;
  const i2 = useRef(new Animated.Value(0)).current;
  const i3 = useRef(new Animated.Value(0)).current;
  const i4 = useRef(new Animated.Value(0)).current;
  const i5 = useRef(new Animated.Value(0)).current;

  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const f3 = useRef(new Animated.Value(0)).current;
  const f4 = useRef(new Animated.Value(0)).current;
  const f5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeIn = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(v, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 160,
        }),
      ]);

    Animated.parallel([
      makeIn(i1, 0),
      makeIn(i2, 90),
      makeIn(i3, 160),
      makeIn(i4, 230),
      makeIn(i5, 300),
    ]).start();
  }, [i1, i2, i3, i4, i5]);

  useEffect(() => {
    const loop = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      );

    const a = loop(f1, 0);
    const b = loop(f2, 220);
    const c = loop(f3, 420);
    const d = loop(f4, 140);
    const e = loop(f5, 320);

    a.start();
    b.start();
    c.start();
    d.start();
    e.start();

    return () => {
      f1.stopAnimation();
      f2.stopAnimation();
      f3.stopAnimation();
      f4.stopAnimation();
      f5.stopAnimation();
    };
  }, [f1, f2, f3, f4, f5]);

  const inStyle = (v: Animated.Value, fromY: number) => ({
    opacity: v,
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
    ],
  });

  const floatStyle = (v: Animated.Value, amplitude = 5) => ({
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [amplitude, -amplitude],
        }),
      },
    ],
  });

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
          <View style={styles.appCluster}>
            <Animated.View style={[styles.appPos1, inStyle(i1, 26), floatStyle(f1, 4)]}>
              <View style={styles.appIcon}>
                <Image
                  source={{ uri: 'https://i.imgur.com/75sb9AW.png' }}
                  style={styles.appIconImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.appPos2, inStyle(i2, 28), floatStyle(f2, 5)]}>
              <View style={styles.appIcon}>
                <Image
                  source={{ uri: 'https://i.imgur.com/uGvCpcv.png' }}
                  style={styles.appIconImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.appPos3, inStyle(i3, 34), floatStyle(f3, 4)]}>
              <AppIcon
                backgroundColor="#FF4500"
                icon={<FontAwesome5 name="reddit-alien" size={28} color="#FFFFFF" />}
              />
            </Animated.View>

            <Animated.View style={[styles.appPos4, inStyle(i4, 30), floatStyle(f4, 6)]}>
              <View style={styles.appIcon}>
                <Image
                  source={{ uri: 'https://i.imgur.com/iGhV3dq.png' }}
                  style={styles.appIconImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.appPos5, inStyle(i5, 30), floatStyle(f5, 5)]}>
              <View style={styles.appIcon}>
                <Image
                  source={{ uri: 'https://i.imgur.com/of9UJL3.png' }}
                  style={styles.appIconImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.circleBtn}>
              <Ionicons name="remove" size={18} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={styles.pillBtn}>
              <Text style={styles.pillBtnText}>5 min</Text>
            </View>
            <View style={styles.circleBtn}>
              <Ionicons name="add" size={18} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={styles.pillBtnWide}>
              <Text style={styles.pillBtnText}>+ Ajouter des apps</Text>
            </View>
          </View>

          <View style={styles.startBlocking}>
            <Ionicons name="play" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.startBlockingText}>Démarrer le blocage</Text>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Limitez vos déclencheurs</Text>
          <Text style={styles.message}>
            Réduisez vos tentations en limitant le temps d’écran sur les applications qui vous déclenchent.
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
    paddingTop: 6,
    paddingBottom: 8,
  },
  appCluster: {
    height: 232,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  appIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  xText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  appPos1: { position: 'absolute', left: 40, top: 34 },
  appPos2: { position: 'absolute', right: 40, top: 38 },
  appPos3: { position: 'absolute', top: 76 },
  appPos4: { position: 'absolute', left: 28, bottom: 18 },
  appPos5: { position: 'absolute', right: 28, bottom: 18 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillBtnWide: {
    flex: 1,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.85)',
  },
  startBlocking: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.10)',
  },
  startBlockingText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.85)',
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
