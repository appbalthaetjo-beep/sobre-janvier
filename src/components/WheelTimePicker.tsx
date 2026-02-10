import React from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // must be odd
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

function pad2(value: number) {
  return value.toString().padStart(2, '0');
}

function buildRange(max: number, step = 1) {
  const values: string[] = [];
  for (let i = 0; i < max; i += step) values.push(pad2(i));
  return values;
}

export function getHourValues() {
  return buildRange(24, 1);
}

export function getMinuteValues(step = 5) {
  return buildRange(60, step);
}

type Props = {
  value: string;
  values: string[];
  onChange: (value: string) => void;
  accessibilityLabel?: string;
};

export function WheelPicker({ value, values, onChange, accessibilityLabel }: Props) {
  const listRef = React.useRef<FlatList<string>>(null);

  const paddedValues = React.useMemo(() => {
    const padding = Array.from({ length: PADDING_ITEMS }, () => '');
    return [...padding, ...values, ...padding];
  }, [values]);

  const valueIndex = React.useMemo(() => {
    const idx = values.indexOf(value);
    return idx >= 0 ? idx : 0;
  }, [value, values]);

  const initialIndex = valueIndex;

  React.useEffect(() => {
    // Keep list position in sync if parent updates value.
    const index = values.indexOf(value);
    if (index < 0) return;
    listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
  }, [value, values]);

  const emitSelection = React.useCallback(
    (offsetY: number) => {
      // Because we add top padding items, the CENTERED value index is simply
      // the scroll offset index (0 => values[0] is centered).
      const idx = Math.round(offsetY / ITEM_HEIGHT);
      const next = values[Math.min(values.length - 1, Math.max(0, idx))];
      if (next && next !== value) onChange(next);
    },
    [onChange, value, values],
  );

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    emitSelection(e.nativeEvent.contentOffset.y);
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Sometimes momentum doesn't fire (slow drag), so treat end drag as selection too.
    emitSelection(e.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.wrapper} accessibilityLabel={accessibilityLabel}>
      <FlatList
        ref={listRef}
        data={paddedValues}
        keyExtractor={(_, index) => String(index)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEndDrag}
        renderItem={({ item, index }) => {
          const isPadding = item === '';
          return (
            <View style={styles.item}>
              <Text style={[styles.text, isPadding && styles.textPadding]}>{item || ' '}</Text>
            </View>
          );
        }}
      />
      <View pointerEvents="none" style={styles.centerHighlight} />
      <View pointerEvents="none" style={styles.fadeTop} />
      <View pointerEvents="none" style={styles.fadeBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: '#0B0B0B',
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  textPadding: {
    color: 'transparent',
  },
  centerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * PADDING_ITEMS,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
  },
  fadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ITEM_HEIGHT * PADDING_ITEMS,
    backgroundColor: 'rgba(11,11,11,0.85)',
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ITEM_HEIGHT * PADDING_ITEMS,
    backgroundColor: 'rgba(11,11,11,0.85)',
  },
});
