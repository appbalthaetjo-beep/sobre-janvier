import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

import { applyCurrentShieldsNow, getBlockState, getScheduleSettings, setDailyUnlockedUntil } from 'expo-family-controls';
import EmotionSlider, { type DailyResetMood } from '@/src/components/EmotionSlider';
import TypewriterText from '@/src/components/TypewriterText';
import RichText from '@/src/components/RichText';
import { ensureDailyResetMorningReminderScheduled } from '@/src/dailyResetReminder';
import { DAILY_RESET_MOTIVATION_BY_DAY, DAILY_RESET_SCIENCE_BY_DAY } from '@/src/dailyResetDayMessages';
import { getAppOpenStreak } from '@/src/appOpenStreak';

type Step = 0 | 1 | 2 | 3 | 4;

const { width: screenWidth } = Dimensions.get('window');
const signatureAreaWidth = screenWidth - 48;
const signatureAreaHeight = 200;

type SignaturePoint = { x: number; y: number };

export default function DailyResetScreen() {
  const [step, setStep] = React.useState<Step>(0);
  const [mood, setMood] = React.useState<DailyResetMood>('bien');
  const [resetTime, setResetTime] = React.useState('08:00');
  const [daysSober, setDaysSober] = React.useState<number>(0);
  const [unlocking, setUnlocking] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const [step3ScienceDone, setStep3ScienceDone] = React.useState(false);
  const [step3MotivationDone, setStep3MotivationDone] = React.useState(false);
  const [step3ScienceBodyDone, setStep3ScienceBodyDone] = React.useState(false);
  const [step3MotivationBodyDone, setStep3MotivationBodyDone] = React.useState(false);
  const todayKey = getLocalDayKey();
  const communityStrongCount = React.useMemo(() => getDailyCommunityStrongCount(todayKey), [todayKey]);
  const [communityStrongCountAnimated, setCommunityStrongCountAnimated] = React.useState(0);
  const moodCounts = React.useMemo(() => getDailyMoodCounts(todayKey, communityStrongCount), [communityStrongCount, todayKey]);
  const [moodCountsAnimated, setMoodCountsAnimated] = React.useState(() => ({
    bien: 0,
    fort: 0,
    neutre: 0,
    fragile: 0,
  }));
  const [signaturePaths, setSignaturePaths] = React.useState<string[]>([]);
  const [currentSignaturePath, setCurrentSignaturePath] = React.useState<SignaturePoint[]>([]);
  const signaturePathRef = React.useRef<SignaturePoint[]>([]);
  const signatureMoveCountRef = React.useRef(0);
  const [appOpenStreak, setAppOpenStreak] = React.useState(0);
  const [appOpenStreakAnimated, setAppOpenStreakAnimated] = React.useState(0);
  const gateDidInitRef = React.useRef(false);
  const todayWeekIndex = React.useMemo(() => new Date().getDay(), []);
  const weekFilled = React.useMemo(
    () => getWeekFilledFromStreak({ todayWeekIndex, streakDays: appOpenStreak }),
    [appOpenStreak, todayWeekIndex]
  );

  React.useEffect(() => {
    if (step !== 0) return;
    setCommunityStrongCountAnimated(0);

    const durationMs = 900;
    const start = Date.now();
    let raf = 0;
    let lastHapticValue = 0;
    let lastHapticAt = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextValue = Math.round(communityStrongCount * eased);
      setCommunityStrongCountAnimated(nextValue);

      // Haptics: subtle "counting" feedback without spamming.
      // Buzz roughly every ~200 counts, throttled in time.
      const now = Date.now();
      if (nextValue - lastHapticValue >= 200 && now - lastHapticAt >= 60) {
        lastHapticValue = nextValue;
        lastHapticAt = now;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (t >= 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [communityStrongCount, step]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getScheduleSettings();
        setResetTime(settings.dailyResetTime ?? '08:00');
      } catch (error) {
        console.log('[DailyReset] getScheduleSettings failed', error);
      }

      // If the Daily Reset has already been completed for the current window, don't let
      // the user re-run the ritual (prod behavior). In dev, we allow replay via a button.
      try {
        const state = await getBlockState();
        const nowSec = Date.now() / 1000;
        const unlockedUntil = Number((state as any)?.dailyUnlockedUntil ?? 0);
        const isUnlockedNow = unlockedUntil > nowSec;
        if (!gateDidInitRef.current && isUnlockedNow) {
          gateDidInitRef.current = true;
          setUnlocked(true);
          setStep(4);
        }
      } catch (error) {
        console.log('[DailyReset] getBlockState failed', error);
      }

      try {
        const raw = await AsyncStorage.getItem('sobrietyData');
        if (raw) {
          const data = JSON.parse(raw);
          const startDate = new Date(data.startDate);
          const today = new Date();
          const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
          setDaysSober(Math.max(0, diff));
        } else {
          setDaysSober(0);
        }
      } catch (error) {
        console.log('[DailyReset] daysSober load failed', error);
      }
    };
    void load();
  }, []);

  React.useEffect(() => {
    if (step !== 2) return;
    setMoodCountsAnimated({ bien: 0, fort: 0, neutre: 0, fragile: 0 });

    const durationMs = 900;
    const start = Date.now();
    let raf = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setMoodCountsAnimated({
        bien: Math.round(moodCounts.bien * eased),
        fort: Math.round(moodCounts.fort * eased),
        neutre: Math.round(moodCounts.neutre * eased),
        fragile: Math.round(moodCounts.fragile * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moodCounts, step]);

  const dayNumber = React.useMemo(() => {
    const n = Math.max(1, Math.floor(daysSober) + 1);
    return Math.min(120, n);
  }, [daysSober]);

  const step3ScienceMarkup = React.useMemo(() => {
    const raw = DAILY_RESET_SCIENCE_BY_DAY[dayNumber] ?? DAILY_RESET_SCIENCE_BY_DAY[120] ?? '';
    return emphasizeText(raw, 'science').trim();
  }, [dayNumber]);

  const step3MotivationMarkup = React.useMemo(() => {
    const raw = DAILY_RESET_MOTIVATION_BY_DAY[dayNumber] ?? DAILY_RESET_MOTIVATION_BY_DAY[120] ?? '';
    return emphasizeText(raw, 'motivation').trim();
  }, [dayNumber]);

  React.useEffect(() => {
    if (step !== 3) return;
    setStep3ScienceDone(false);
    setStep3MotivationDone(false);
    setStep3ScienceBodyDone(false);
    setStep3MotivationBodyDone(false);
  }, [dayNumber, step]);

  React.useEffect(() => {
    if (step !== 4 || !unlocked) return;
    let isActive = true;
    let raf = 0;
    void getAppOpenStreak()
      .then((count) => {
        if (!isActive) return;
        setAppOpenStreak(count);
        setAppOpenStreakAnimated(0);

        const durationMs = 900;
        const start = Date.now();

        const tick = () => {
          const t = Math.min(1, (Date.now() - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          setAppOpenStreakAnimated(Math.max(0, Math.round(count * eased)));
          if (t >= 1) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          if (t < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      })
      .catch((error) => console.log('[DailyReset] getAppOpenStreak failed', error));
    return () => {
      isActive = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [step, unlocked]);

  const step3ScrollRef = React.useRef<ScrollView | null>(null);
  const lastStep3ScrollAtRef = React.useRef(0);
  const step3ScrollToBottom = React.useCallback(() => {
    const now = Date.now();
    if (now - lastStep3ScrollAtRef.current < 120) return;
    lastStep3ScrollAtRef.current = now;
    step3ScrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const moodIndex = React.useMemo(() => {
    if (mood === 'fragile') return 0;
    if (mood === 'neutre') return 1;
    if (mood === 'fort') return 3;
    return 2; // bien
  }, [mood]);

  const moodAnim = React.useRef(new Animated.Value(moodIndex)).current;
  React.useEffect(() => {
    if (step !== 1) return;
    Animated.timing(moodAnim, { toValue: moodIndex, duration: 220, useNativeDriver: false }).start();
  }, [moodAnim, moodIndex, step]);

  const step1BgColor = moodAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['#12307A', '#2A2E42', '#1E7A5A', '#1E9A52'],
  });
  const bgColor = step === 0 ? '#000000' : step === 1 ? step1BgColor : '#000000';

  const handleUnlock = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const nextUnlock = getNextResetTimestamp(resetTime);
      await setDailyUnlockedUntil(nextUnlock);
      await applyCurrentShieldsNow();
      await ensureDailyResetMorningReminderScheduled({ requestPermission: false });
      setUnlocked(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log('[DailyReset] unlock failed', error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUnlocking(false);
    }
  };

  const clearSignature = React.useCallback(() => {
    setSignaturePaths([]);
    setCurrentSignaturePath([]);
    signaturePathRef.current = [];
  }, []);

  const hasSignature = signaturePaths.length > 0 || currentSignaturePath.length > 0;

  const signaturePanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          signatureMoveCountRef.current = 0;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          signaturePathRef.current = [{ x: locationX, y: locationY }];
          setCurrentSignaturePath([{ x: locationX, y: locationY }]);
        },

        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const nextPoint = { x: locationX, y: locationY };
          signaturePathRef.current.push(nextPoint);
          setCurrentSignaturePath([...signaturePathRef.current]);

          signatureMoveCountRef.current += 1;
          if (signatureMoveCountRef.current % 8 === 0) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },

        onPanResponderRelease: () => {
          if (signaturePathRef.current.length > 1) {
            const pathString = createSVGPath(signaturePathRef.current);
            setSignaturePaths((prev) => [...prev, pathString]);
          }
          setCurrentSignaturePath([]);
          signaturePathRef.current = [];
        },
        onPanResponderTerminate: () => {
          setCurrentSignaturePath([]);
          signaturePathRef.current = [];
        },
      }),
    []
  );

  return (
    <Animated.View style={[styles.bg, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safe}>
        {step === 0 || step === 1 ? null : (
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daily Reset</Text>
            <View style={styles.headerRight} />
          </View>
        )}

        <View style={[styles.content, step === 2 ? styles.contentStep2 : null]}>
          {step === 0 ? (
            <View style={[styles.step, styles.communityStep]}>
              <View style={styles.communityTop}>
                <Text style={styles.communityEyes}>👀</Text>
                <Text style={styles.communityTitle}>Tu as rechuté ?</Text>
                <Text style={styles.communitySubtitle}>Dis-le à la communauté en faisant ton check-in.</Text>
              </View>

              <View style={styles.communityCenter}>
                <Text style={styles.communityNumber}>{communityStrongCountAnimated.toLocaleString('fr-FR')}</Text>
                <Text style={styles.communityCaption}>tiennent bon aujourd’hui</Text>
              </View>

              <View style={styles.communityButtons}>
                <TouchableOpacity
                  style={styles.communityOutlineButton}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(1);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.communityOutlineButtonText}>Non, je tiens bon 💪</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.communityDangerButton}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/relapse');
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.communityDangerButtonText}>Oui, j’ai rechuté</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={[styles.step, styles.stepMinimal]}>
              <View style={styles.stepMinimalTop}>
                <Text style={styles.moodTitle}>Comment tu te sens aujourd’hui ?</Text>
                <EmotionSlider value={mood} onChange={setMood} />
              </View>
              <View style={styles.stepMinimalBottom}>
                <TouchableOpacity style={styles.continueButton} onPress={() => setStep(2)} activeOpacity={0.9}>
                  <Text style={styles.continueButtonText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={[styles.step, styles.step2Screen]}>
              <View style={styles.step2Content}>
                <View style={styles.step2Main}>
                  <View style={styles.step2TitleRow}>
                    <Image
                      source={{ uri: 'https://i.imgur.com/Gq0mmt7.png' }}
                      style={styles.step2Logo}
                      resizeMode="contain"
                    />
                    <Text style={styles.step2Kicker}>croit en toi…</Text>
                  </View>
                  <View style={styles.step2List}>
                    <View style={styles.step2Row}>
                      <Text style={styles.step2RowEmoji}>🙂</Text>
                      <Text style={styles.step2RowLine}>
                        <Text style={styles.step2RowNumberInline}>{formatCountFr(moodCountsAnimated.bien)} </Text>
                        <Text style={styles.step2RowOthersInline}>autres</Text>
                      </Text>
                    </View>
                    <View style={styles.step2Row}>
                      <Text style={styles.step2RowEmoji}>💪</Text>
                      <Text style={styles.step2RowLine}>
                        <Text style={styles.step2RowNumberInline}>{formatCountFr(moodCountsAnimated.fort)} </Text>
                        <Text style={styles.step2RowOthersInline}>autres</Text>
                      </Text>
                    </View>
                    <View style={styles.step2Row}>
                      <Text style={styles.step2RowEmoji}>😐</Text>
                      <Text style={styles.step2RowLine}>
                        <Text style={styles.step2RowNumberInline}>{formatCountFr(moodCountsAnimated.neutre)} </Text>
                        <Text style={styles.step2RowOthersInline}>autres</Text>
                      </Text>
                    </View>
                    <View style={styles.step2Row}>
                      <Text style={styles.step2RowEmoji}>😞</Text>
                      <Text style={styles.step2RowLine}>
                        <Text style={styles.step2RowNumberInline}>{formatCountFr(moodCountsAnimated.fragile)} </Text>
                        <Text style={styles.step2RowOthersInline}>autres</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.step2Footer}>C’est dur, mais tu n’es pas seul.</Text>
                </View>

                <TouchableOpacity style={styles.step2Continue} onPress={() => setStep(3)} activeOpacity={0.9}>
                  <Text style={styles.step2ContinueText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={[styles.step, styles.step3Screen]}>
              <Text style={styles.step3Title}>Jour {dayNumber} atteint 🔥</Text>

              {(() => {
                const scienceBody = step3ScienceMarkup;
                const motivationBody = step3MotivationMarkup;

                return (
                  <>
                    <ScrollView
                      ref={(ref) => {
                        step3ScrollRef.current = ref;
                      }}
                      style={styles.step3Scroll}
                      contentContainerStyle={styles.step3ScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.step3Section}>
                        <Text style={styles.step3Lead}>Ce qui veut dire que… 🧠</Text>
                        {!step3ScienceBodyDone ? (
                          <TypewriterText
                            key={`sci-${dayNumber}`}
                            text={stripRichMarkup(scienceBody)}
                            haptics="char"
                            hapticsImpact="medium"
                            style={styles.step3Body}
                            onProgress={step3ScrollToBottom}
                            onDone={() => {
                              setStep3ScienceBodyDone(true);
                              setStep3ScienceDone(true);
                            }}
                            speedMsPerChar={34}
                          />
                        ) : (
                          <RichText
                            text={scienceBody}
                            style={styles.step3Body}
                            boldStyle={styles.step3BodyBold}
                            highlightStyle={styles.step3BodyHighlight}
                          />
                        )}
                      </View>

                      {step3ScienceDone ? (
                        <View style={styles.step3Section}>
                          <Text style={styles.step3Lead}>Alors… ✨</Text>
                          {!step3MotivationBodyDone ? (
                            <TypewriterText
                              key={`mot-${dayNumber}`}
                              text={stripRichMarkup(motivationBody)}
                              haptics="char"
                              hapticsImpact="medium"
                              style={styles.step3Body}
                              onProgress={step3ScrollToBottom}
                              onDone={() => {
                                setStep3MotivationBodyDone(true);
                                setStep3MotivationDone(true);
                              }}
                              speedMsPerChar={34}
                            />
                          ) : (
                            <RichText
                              text={motivationBody}
                              style={styles.step3Body}
                              boldStyle={styles.step3BodyBold}
                              highlightStyle={styles.step3BodyHighlight}
                            />
                          )}
                        </View>
                      ) : null}

                      {step3ScienceDone && step3MotivationDone ? (
                        <TouchableOpacity style={styles.step3Continue} onPress={() => setStep(4)} activeOpacity={0.9}>
                          <Text style={styles.step3ContinueText}>Continuer</Text>
                        </TouchableOpacity>
                      ) : null}
                    </ScrollView>
                  </>
                );
              })()}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.step}>
              {!unlocked ? (
                <>
                  <Text style={styles.title}>Signez votre engagement</Text>
                  <Text style={styles.subtitle}>Promets-toi qu’aujourd’hui tu restes aligné.</Text>

                  <View style={styles.signatureSection}>
                    <View style={styles.signatureContainer}>
                      <View style={styles.signatureArea} pointerEvents="box-only" {...signaturePanResponder.panHandlers}>
                        <Svg width={signatureAreaWidth} height={signatureAreaHeight} style={styles.svgSignature}>
                          {signaturePaths.map((d, index) => (
                            <Path
                              // eslint-disable-next-line react/no-array-index-key
                              key={index}
                              d={d}
                              stroke="#000000"
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          ))}
                          {currentSignaturePath.length > 1 ? (
                            <Path
                              d={createSVGPath(currentSignaturePath)}
                              stroke="#000000"
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          ) : null}
                        </Svg>

                        {!hasSignature ? (
                          <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>✍️</Text>
                            <Text style={styles.placeholderSubtext}>Dessine ta signature ici</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {hasSignature ? (
                      <TouchableOpacity style={styles.clearButton} onPress={clearSignature} activeOpacity={0.9}>
                        <Text style={styles.clearButtonText}>Effacer</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, (!hasSignature || unlocking) && styles.primaryButtonDisabled]}
                    onPress={handleUnlock}
                    disabled={!hasSignature || unlocking}
                  >
                    {unlocking ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Déverrouiller mes apps pour aujourd’hui</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.streakWrap}>
                    <Text style={styles.streakFlameEmoji}>🔥</Text>
                    <Text style={styles.streakCount}>{appOpenStreakAnimated}</Text>
                    <Text style={styles.streakLabel}>jours de suite</Text>
                    <Text style={styles.streakSub}>Excellent. Continue à construire ton habitude quotidienne.</Text>
                    <View style={styles.weekCard}>
                      <View style={styles.weekLabels}>
                        {WEEK_LABELS.map((label, idx) => (
                          <Text key={label} style={[styles.weekLabel, idx === todayWeekIndex ? styles.weekLabelToday : null]}>
                            {label}
                          </Text>
                        ))}
                      </View>
                      <View style={styles.weekDots}>
                        {WEEK_LABELS.map((_, idx) => {
                          const filled = weekFilled[idx] === true;
                          const isToday = idx === todayWeekIndex;
                          return (
                            <View
                              // eslint-disable-next-line react/no-array-index-key
                              key={idx}
                              style={[
                                styles.weekDot,
                                filled ? styles.weekDotFilled : null,
                                isToday ? styles.weekDotToday : null,
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.primaryButtonText}>Continuer</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function createSVGPath(points: SignaturePoint[]): string {
  if (points.length === 0) return '';
  let path = `M${points[0]?.x},${points[0]?.y}`;
  for (let i = 1; i < points.length; i += 1) {
    path += ` L${points[i]?.x},${points[i]?.y}`;
  }
  return path;
}

const WEEK_LABELS = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'] as const;

function getWeekFilledFromStreak({ todayWeekIndex, streakDays }: { todayWeekIndex: number; streakDays: number }) {
  const filled = new Array<boolean>(7).fill(false);
  const n = Math.max(0, Math.min(7, Math.floor(streakDays)));
  const today = ((todayWeekIndex % 7) + 7) % 7;
  if (n <= 0) return filled;

  for (let i = 0; i < n; i += 1) {
    const idx = (today - i + 7) % 7;
    filled[idx] = true;
  }
  return filled;
}

function getLocalDayKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDailyCommunityStrongCount(dayKey: string) {
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) | 0;
  }
  const min = 3000;
  const max = 5500;
  const span = max - min + 1;
  const mod = Math.abs(hash) % span;
  return min + mod;
}

function makePrng(seed: number) {
  let state = seed | 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

function getDailyMoodCounts(dayKey: string, total: number) {
  // Base weights skew positive but still realistic.
  const base = { bien: 0.34, fort: 0.36, neutre: 0.18, fragile: 0.12 };
  let seed = 0;
  const key = `${dayKey}:moods`;
  for (let i = 0; i < key.length; i += 1) seed = (seed * 33 + key.charCodeAt(i)) | 0;
  const rnd = makePrng(seed);

  const jitter = () => (rnd() - 0.5) * 0.06; // +/- 3%
  let bien = base.bien + jitter();
  let fort = base.fort + jitter();
  let neutre = base.neutre + jitter();
  let fragile = base.fragile + jitter();

  // Clamp to keep it plausible.
  bien = Math.max(0.26, Math.min(0.44, bien));
  fort = Math.max(0.26, Math.min(0.44, fort));
  neutre = Math.max(0.12, Math.min(0.28, neutre));
  fragile = Math.max(0.06, Math.min(0.22, fragile));

  const sum = bien + fort + neutre + fragile;
  bien /= sum;
  fort /= sum;
  neutre /= sum;
  fragile /= sum;

  const raw = {
    bien: bien * total,
    fort: fort * total,
    neutre: neutre * total,
    fragile: fragile * total,
  };

  const out = {
    bien: Math.floor(raw.bien),
    fort: Math.floor(raw.fort),
    neutre: Math.floor(raw.neutre),
    fragile: Math.floor(raw.fragile),
  };

  let remainder = total - (out.bien + out.fort + out.neutre + out.fragile);
  const order = (['bien', 'fort', 'neutre', 'fragile'] as const).sort((a, b) => (raw[b] % 1) - (raw[a] % 1));
  let idx = 0;
  while (remainder > 0) {
    const k = order[idx % order.length];
    out[k] += 1;
    remainder -= 1;
    idx += 1;
  }

  return out;
}

function formatCountFr(value: number) {
  // Avoid line breaks caused by narrow no-break spaces on some fonts.
  return new Intl.NumberFormat('fr-FR').format(value).replace(/\u202F/g, '\u00A0');
}

function getNextResetTimestamp(time: string) {
  const [hours, minutes] = time.split(':').map((val) => parseInt(val, 10));
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(hours, minutes, 0, 0);
  return target.getTime() / 1000;
}

function stripRichMarkup(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

function splitMarkup(markup: string) {
  const cleaned = markup.trim();
  const parts = cleaned.split(/\n\s*\n/);
  if (parts.length >= 2) {
    return { headline: parts[0].trim(), body: parts.slice(1).join('\n\n').trim() };
  }
  const firstLine = cleaned.split('\n')[0] ?? cleaned;
  const rest = cleaned.slice(firstLine.length).trim();
  return { headline: firstLine.trim(), body: rest || ' ' };
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type EmphasisMode = 'science' | 'motivation';

function emphasizeText(text: string, mode: EmphasisMode) {
  const highlightKeywords =
    mode === 'science'
      ? [
          'dopamine',
          'cortex prÃ©frontal',
          'systÃ¨me de rÃ©compense',
          'plasticitÃ© neuronale',
          'stress',
          'attention',
          'motivation',
          'triggers',
          'libido',
        ]
      : ['contrÃ´le', 'alignÃ©', 'libertÃ©', 'choix', 'prÃ©sent', 'confiance', 'courage'];

  const boldKeywords =
    mode === 'science'
      ? ['contrÃ´le', 'impulsions', 'concentration', 'dÃ©cisions']
      : ['aujourdâ€™hui', 'maintenant'];

  let out = text;

  for (const kw of highlightKeywords) {
    const re = new RegExp(escapeRegExp(kw), 'gi');
    out = out.replace(re, (m) => `**${m}**`);
  }

  for (const kw of boldKeywords) {
    const re = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi');
    out = out.replace(re, (m) => `*${m}*`);
  }

  return out;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  headerRight: { width: 42 },
  content: { flex: 1, paddingHorizontal: 18, paddingBottom: 18 },
  contentStep2: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  step: { flex: 1, justifyContent: 'center' },
  stepMinimal: {
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  stepMinimalTop: {
    flex: 1,
    justifyContent: 'center',
  },
  moodTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 18,
  },
  stepMinimalBottom: {
    paddingBottom: 22,
  },
  communityStep: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 22,
  },
  communityTop: {
    alignItems: 'center',
    gap: 8,
  },
  communityEyes: {
    fontSize: 30,
    opacity: 0.95,
  },
  communityTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  communitySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  communityCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  communityNumber: {
    fontSize: 76,
    lineHeight: 82,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  communityCaption: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  communityButtons: {
    gap: 12,
    marginTop: 6,
  },
  communityOutlineButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.65)',
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
  },
  communityOutlineButtonText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  communityDangerButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  communityDangerButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#1C1C1E',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  immersiveText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    marginBottom: 26,
  },
  step2Screen: {
    backgroundColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  step2Content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  step2Kicker: {
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'left',
    marginTop: 0,
    marginBottom: 0,
    letterSpacing: 0.2,
  },
  step2List: {
    gap: 16,
    marginBottom: 26,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
  },
  step2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  step2RowEmoji: {
    width: 38,
    textAlign: 'center',
    fontSize: 30,
  },
  step2Main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  step2TitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 32,
  },
  step2Logo: {
    width: 160,
    height: 54,
  },
  step2RowLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step2RowNumberInline: {
    fontSize: 48,
    lineHeight: 52,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  step2RowOthersInline: {
    fontSize: 22,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Inter-Bold',
  },
  step2Footer: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 14,
  },
  step2Scroll: {
    flex: 1,
  },
  step2ScrollContent: {
    paddingBottom: 18,
  },
  step2Headline: {
    fontSize: 38,
    lineHeight: 44,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'left',
    marginBottom: 16,
  },
  step2HeadlineHighlight: {
    color: '#FFD700',
    fontFamily: 'Inter-Bold',
  },
  step2Body: {
    fontSize: 22,
    lineHeight: 32,
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
  },
  step2Continue: {
    marginTop: 22,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
  },
  step2ContinueText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  block: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  blockTitle: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginBottom: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  blockText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  blockTextBold: {
    fontFamily: 'Inter-SemiBold',
  },
  blockTextHighlight: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
  },
  step3Screen: {
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  step3Title: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'left',
    marginBottom: 18,
  },
  step3Scroll: {
    flex: 1,
  },
  step3ScrollContent: {
    paddingBottom: 18,
  },
  step3Section: {
    marginBottom: 34,
  },
  step3Lead: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },
  step3Body: {
    fontSize: 22,
    lineHeight: 32,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
  },
  step3BodyBold: {
    fontFamily: 'Inter-SemiBold',
  },
  step3BodyHighlight: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
  },
  step3Continue: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
  },
  step3ContinueText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  signatureSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  signatureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: signatureAreaWidth + 32,
    height: signatureAreaHeight + 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  signatureArea: {
    width: signatureAreaWidth,
    height: signatureAreaHeight,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgSignature: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  streakWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  streakFlameEmoji: {
    fontSize: 110,
    lineHeight: 120,
    marginBottom: 14,
  },
  streakCount: {
    fontSize: 56,
    lineHeight: 62,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  streakLabel: {
    marginTop: 2,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter-SemiBold',
  },
  streakSub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  weekCard: {
    marginTop: 18,
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    width: 26,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'lowercase',
  },
  weekLabelToday: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Inter-SemiBold',
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  weekDotFilled: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  weekDotToday: {
    borderColor: 'rgba(255,215,0,0.7)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  commitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  commitTextCol: { flex: 1 },
  commitText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  commitSubText: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});

