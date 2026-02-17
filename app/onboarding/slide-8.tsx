import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';

export default function Slide8Screen() {
  const { triggerTap } = useHaptics();
  const [isBlocked, setIsBlocked] = useState(false);
  const [scanningDots, setScanningDots] = useState('');

  const scanShimmerX = useRef(new Animated.Value(0)).current;
  const blockProgress = useRef(new Animated.Value(0)).current;
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-9');
  };

  const totalDots = 5;
  const activeDotIndex = 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setScanningDots((d) => (d.length >= 3 ? '' : `${d}.`));
    }, 350);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(scanShimmerX, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    shimmer.start();

    const clearAll = () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeouts.current.push(id);
    };

    const run = () => {
      clearAll();
      setIsBlocked(false);
      blockProgress.setValue(0);

      schedule(() => {
        Animated.timing(blockProgress, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setIsBlocked(true);
        });
      }, 1200);

      schedule(run, 1200 + 520 + 1700);
    };

    run();

    return () => {
      clearAll();
      shimmer.stop();
      scanShimmerX.stopAnimation();
      blockProgress.stopAnimation();
    };
  }, [blockProgress, scanShimmerX]);

  const blockingOpacity = blockProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const blockedOpacity = blockProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const blockingTranslateY = blockProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const blockedTranslateY = blockProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
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
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.searchText}>Analyse{scanningDots}</Text>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerOverlay,
                {
                  transform: [
                    {
                      translateX: scanShimmerX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-220, 220],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>

          <View style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <View style={styles.blockHeaderLeft}>
                <View style={styles.blockHeaderIcon}>
                  <Ionicons name="checkmark" size={14} color="#0B0B0B" />
                </View>
                <Text style={styles.blockHeaderTitle}>Sites bloqués</Text>
                <Text style={styles.blockHeaderCount}>· {isBlocked ? '1249' : '1248'}</Text>
              </View>
            </View>

            <View style={styles.siteRowWrapX}>
              <Animated.View
                style={[
                  styles.siteRowBlocking,
                  {
                    opacity: blockingOpacity,
                    transform: [{ translateY: blockingTranslateY }],
                  },
                ]}
              >
                <View style={styles.siteIconX}>
                  <Text style={styles.siteIconXText}>X</Text>
                </View>
                <View style={styles.siteTextCol}>
                  <Text style={styles.siteDomain}>XVideos.com</Text>
                  <Text style={styles.siteStatusBlocking}>Blocage…</Text>
                </View>
                <View style={styles.siteShield}>
                  <Ionicons name="shield-outline" size={18} color="#D6A93A" />
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.siteRowBlockedAlt,
                  {
                    opacity: blockedOpacity,
                    transform: [{ translateY: blockedTranslateY }],
                  },
                ]}
              >
                <View style={styles.siteIconX}>
                  <Text style={styles.siteIconXText}>X</Text>
                </View>
                <View style={styles.siteTextCol}>
                  <Text style={styles.siteDomainBlocked}>XVideos.com</Text>
                  <Text style={styles.siteStatus}>Bloqué</Text>
                </View>
                <View style={styles.siteCheck}>
                  <Ionicons name="checkmark" size={14} color="#0B0B0B" />
                </View>
              </Animated.View>
            </View>

            <View style={styles.siteRowWrap}>
              <Animated.View
                style={[
                  styles.siteRowBlocking,
                  {
                    opacity: blockingOpacity,
                    transform: [{ translateY: blockingTranslateY }],
                  },
                ]}
              >
                <View style={styles.siteIconPornhub}>
                  <Text style={styles.siteIconPornhubText}>Porn</Text>
                  <Text style={styles.siteIconPornhubTextBold}>hub</Text>
                </View>
                <View style={styles.siteTextCol}>
                  <Text style={styles.siteDomain}>Pornhub.com</Text>
                  <Text style={styles.siteStatusBlocking}>Blocage…</Text>
                </View>
                <View style={styles.siteShield}>
                  <Ionicons name="shield-outline" size={18} color="#D6A93A" />
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.siteRowBlockedAlt,
                  {
                    opacity: blockedOpacity,
                    transform: [{ translateY: blockedTranslateY }],
                  },
                ]}
              >
                <View style={styles.siteIconPornhub}>
                  <Text style={styles.siteIconPornhubText}>Porn</Text>
                  <Text style={styles.siteIconPornhubTextBold}>hub</Text>
                </View>
                <View style={styles.siteTextCol}>
                  <Text style={styles.siteDomainBlocked}>Pornhub.com</Text>
                  <Text style={styles.siteStatus}>Bloqué</Text>
                </View>
                <View style={styles.siteCheck}>
                  <Ionicons name="checkmark" size={14} color="#0B0B0B" />
                </View>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Bloquez vos tentations</Text>
          <Text style={styles.message}>
            Restez protégé grâce à un blocage privé qui élimine les tentations et casse le cycle.
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
    paddingBottom: 6,
    gap: 14,
  },
  searchBar: {
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.65)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: -80,
    width: 160,
  },
  shimmerGradient: {
    flex: 1,
    borderRadius: 999,
  },
  blockCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.12)',
  },
  blockHeader: {
    marginBottom: 12,
  },
  blockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockHeaderIcon: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.9)',
  },
  blockHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  blockHeaderCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.45)',
  },
  siteRowWrapX: {
    height: 62,
    marginBottom: 12,
  },
  siteRowWrap: {
    height: 62,
    marginTop: 12,
  },
  siteRowBlocking: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  siteRowBlockedAlt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(214, 169, 58, 0.22)',
  },
  siteIconX: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteIconXText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FF2D2D',
  },
  siteIconPornhub: {
    width: 44,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteIconPornhubText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  siteIconPornhubTextBold: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFBF00',
    lineHeight: 12,
  },
  siteTextCol: {
    flex: 1,
  },
  siteDomain: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  siteDomainBlocked: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.72)',
    textDecorationLine: 'line-through',
  },
  siteStatus: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  siteStatusBlocking: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 215, 106, 0.85)',
    marginTop: 2,
  },
  siteCheck: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.9)',
  },
  siteShield: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.18)',
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
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
