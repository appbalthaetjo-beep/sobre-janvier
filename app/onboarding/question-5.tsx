import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { useFirestore } from '@/hooks/useFirestore';
import { useHaptics } from '@/hooks/useHaptics';

type Choice = { id: string; label: string };

const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;

export default function Question5Screen() {
  const { saveUserData } = useFirestore();
  const { triggerTap } = useHaptics();
  const listRef = useRef<FlatList<Choice> | null>(null);

  const choices = useMemo<Choice[]>(
    () => [
      { id: '12-moins', label: '12 ans ou moins' },
      { id: '13-16', label: '13–16 ans' },
      { id: '17-24', label: '17–24 ans' },
      { id: '25-plus', label: '25 ans ou plus' },
    ],
    [],
  );

  const [selectedIndex, setSelectedIndex] = useState(1);
  const snapOffsets = useMemo(() => choices.map((_, index) => index * ITEM_HEIGHT), [choices]);

  const persistSelection = useCallback(
    async (choiceId: string) => {
      try {
        const existingAnswers = await AsyncStorage.getItem('quizAnswers');
        const answers = existingAnswers ? JSON.parse(existingAnswers) : {};
        answers.firstExposure = choiceId;
        await AsyncStorage.setItem('quizAnswers', JSON.stringify(answers));

        try {
          await saveUserData({ quizAnswers: answers });
          console.log(`✅ Quiz answer saved to Firebase: firstExposure = ${choiceId}`);
        } catch (error) {
          console.error('❌ Error saving quiz answer to Firebase:', error);
        }
      } catch (error) {
        console.error('Error saving quiz answer:', error);
      }
    },
    [saveUserData],
  );

  const clampIndex = useCallback(
    (value: number) => Math.max(0, Math.min(choices.length - 1, value)),
    [choices.length],
  );

  const updateSelectedFromOffset = useCallback(
    (offsetY: number) => {
      const nextIndex = clampIndex(Math.round(offsetY / ITEM_HEIGHT));
      setSelectedIndex(nextIndex);
    },
    [clampIndex],
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateSelectedFromOffset(e.nativeEvent.contentOffset.y);
    },
    [updateSelectedFromOffset],
  );

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateSelectedFromOffset(e.nativeEvent.contentOffset.y);
    },
    [updateSelectedFromOffset],
  );

  const handleScrollBeginDrag = useCallback(() => {
    triggerTap('light');
  }, [triggerTap]);

  const selectedChoice = choices[selectedIndex];
  const canContinue = Boolean(selectedChoice);

  const handleContinue = async () => {
    if (!selectedChoice) return;
    triggerTap('medium');
    await persistSelection(selectedChoice.id);
    router.push('/onboarding/question-6');
  };

  const handleBack = () => {
    triggerTap('light');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/question-4');
  };

  const renderItem = ({ item, index }: { item: Choice; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <View style={[styles.item, isSelected ? styles.itemSelected : styles.itemUnselected]}>
        <Text style={[styles.itemText, isSelected ? styles.itemTextSelected : styles.itemTextUnselected]}>
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <ProgressBar currentStep={5} totalSteps={7} />
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>
            À quel âge avez-vous découvert du contenu explicite pour la première fois ?
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerHighlight} pointerEvents="none" />
          <FlatList
            ref={(ref) => {
              listRef.current = ref;
            }}
            data={choices}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            bounces={false}
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            contentContainerStyle={styles.listContent}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            initialScrollIndex={selectedIndex}
            overScrollMode="never"
          />
        </View>

        <Text style={styles.hint}>Faites défiler pour choisir.</Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        >
          <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
            Continuer
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 14,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionSection: {
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 38,
    maxWidth: 340,
  },
  pickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
  },
  pickerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (ITEM_HEIGHT * VISIBLE_ITEMS) / 2 - ITEM_HEIGHT / 2,
    height: ITEM_HEIGHT,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  listContent: {
    paddingVertical: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  itemSelected: {
    opacity: 1,
  },
  itemUnselected: {
    opacity: 0.28,
  },
  itemText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  itemTextSelected: {
    color: '#FFFFFF',
  },
  itemTextUnselected: {
    color: '#FFFFFF',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 22,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.35,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  continueButtonTextDisabled: {
    color: '#000000',
  },
});
