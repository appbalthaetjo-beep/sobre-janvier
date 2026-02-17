import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

type ScriptMessage = {
  side: 'left' | 'right';
  text: string;
  typingBefore?: boolean;
};

const SCRIPT: ScriptMessage[] = [
  { side: 'left', text: 'POURQUOI PORNHUB EST DANS TON HISTORIQUE ?!?', typingBefore: false },
  { side: 'left', text: 'TU ME TROMPES ?!?!', typingBefore: false },
  { side: 'left', text: 'JE NE SUIS PAS ASSEZ BIEN POUR TOI ?', typingBefore: false },
  { side: 'right', text: "BÉBÉ, CE N’EST PAS CE QUE TU CROIS…", typingBefore: true },
  { side: 'right', text: 'C’EST FINI. VA TE METTRE EN COUPLE AVEC UNE PORNSTAR.', typingBefore: true },
];

const TYPING_DURATION_MS = 1500;
const BETWEEN_MESSAGES_MS = 900;

type DisplayedItem =
  | {
      id: string;
      type: 'typing';
      side: 'left' | 'right';
      anim: Animated.Value;
    }
  | {
      id: string;
      type: 'message';
      side: 'left' | 'right';
      text: string;
      anim: Animated.Value;
    };

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const make = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.25, duration: 280, useNativeDriver: true }),
          Animated.delay(140),
        ]),
      );

    const a1 = make(dot1, 0);
    const a2 = make(dot2, 120);
    const a3 = make(dot3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
}

function animateIn(anim: Animated.Value) {
  anim.setValue(0);
  Animated.timing(anim, {
    toValue: 1,
    duration: 420,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
}

export default function Slide3Screen() {
  const { triggerTap } = useHaptics();
  const [items, setItems] = useState<DisplayedItem[]>([]);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, []);

  const runScript = useMemo(() => {
    return async () => {
      let counter = 0;

      const pushItem = (item: Omit<DisplayedItem, 'id' | 'anim'>) => {
        const anim = new Animated.Value(0);
        const id = `msg-${Date.now()}-${counter++}`;
        const next = { ...item, id, anim } as DisplayedItem;
        setItems((prev) => [...prev, next]);
        animateIn(anim);
        return id;
      };

      const replaceItem = (targetId: string, item: Omit<DisplayedItem, 'id' | 'anim'>) => {
        const anim = new Animated.Value(0);
        const id = `msg-${Date.now()}-${counter++}`;
        const next = { ...item, id, anim } as DisplayedItem;
        setItems((prev) => prev.map((p) => (p.id === targetId ? next : p)));
        animateIn(anim);
        return id;
      };

      const wait = (ms: number) =>
        new Promise<void>((resolve) => {
          const t = setTimeout(() => {
            timeoutsRef.current = timeoutsRef.current.filter((value) => value !== t);
            resolve();
          }, ms);
          timeoutsRef.current.push(t);
        });

      while (isMountedRef.current) {
        setItems([]);
        await wait(300);

        for (const step of SCRIPT) {
          if (!isMountedRef.current) return;

          if (step.typingBefore) {
            const typingId = pushItem({ type: 'typing', side: step.side });
            await wait(TYPING_DURATION_MS);
            if (!isMountedRef.current) return;
            replaceItem(typingId, { type: 'message', side: step.side, text: step.text });
          } else {
            pushItem({ type: 'message', side: step.side, text: step.text });
          }

          await wait(BETWEEN_MESSAGES_MS);
        }

        await wait(1200);
      }
    };
  }, []);

  useEffect(() => {
    runScript().catch(() => {});
  }, [runScript]);

  const handleNext = () => {
    triggerTap('medium');
    router.push('/onboarding/slide-1');
  };

  return (
    <LinearGradient
      colors={['#F24B5D', '#F04C77', '#EF4A5C', '#F03D3D']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.imgur.com/35ceOTL.png' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.top}>
          <View style={styles.chatWrap}>
            {items.map((item, idx) => {
              const isRight = item.side === 'right';
              const bubbleStyle = [
                styles.bubble,
                isRight ? styles.bubbleRight : styles.bubbleLeft,
              ];

              const animatedStyle = {
                opacity: item.anim,
                transform: [
                  {
                    translateY: item.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              } as const;

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.row,
                    isRight ? styles.rowRight : styles.rowLeft,
                    animatedStyle,
                  ]}
                >
                  <View style={bubbleStyle}>
                    {item.type === 'typing' ? (
                      <TypingDots />
                    ) : (
                      <Text style={styles.bubbleText}>{item.text}</Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title}>Le porno détruit les relations.</Text>
          <Text style={styles.message}>
            Regarder du porno peut entraîner des difficultés d’érection, une baisse de libido et une perte d’attirance
            envers les autres.
          </Text>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 74,
    height: 74,
  },
  top: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingBottom: 16,
  },
  chatWrap: {
    gap: 10,
  },
  row: {
    width: '100%',
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleLeft: {
    backgroundColor: '#0A84FF',
  },
  bubbleRight: {
    backgroundColor: 'rgba(10,132,255,0.35)',
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  bottom: {
    paddingBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 34,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 18,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F03D3D',
  },
});
