import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const PAD = 12;
const CLARIO = 'https://i.imgur.com/yWky9d2.png';

type Rect = { x: number; y: number; w: number; h: number };

export default function BlockerGuide({
  hl,
  onConfigure,
  onSkip,
}: {
  hl: Rect;
  onConfigure: () => void;
  onSkip: () => void;
}) {
  const sx = hl.x - PAD;
  const sy = hl.y - PAD;
  const sw = hl.w + PAD * 2;
  const sh = hl.h + PAD * 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay 4 rects */}
      <View style={[s.dark, { top: 0, left: 0, right: 0, height: Math.max(0, sy) }]} />
      <View style={[s.dark, { top: sy + sh, left: 0, right: 0, bottom: 0 }]} />
      <View style={[s.dark, { top: sy, left: 0, width: Math.max(0, sx), height: sh }]} />
      <View style={[s.dark, { top: sy, left: sx + sw, right: 0, height: sh }]} />

      {/* Bordure dorée */}
      <View style={[s.border, { top: sy, left: sx, width: sw, height: sh, borderRadius: 16 }]} />

      {/* Carte en haut */}
      <View style={s.card} pointerEvents="box-none">
        <View style={s.topRow}>
          <View style={s.clarioRow}>
            <Image source={{ uri: CLARIO }} style={s.avatar} />
            <Text style={s.name}>Clario</Text>
          </View>
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.skip}>Passer</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.body}>
          Configure ton bloqueur d'apps maintenant. C'est ton outil le plus puissant contre les rechutes.
        </Text>
        <TouchableOpacity style={s.btn} onPress={onConfigure} activeOpacity={0.82}>
          <Text style={s.btnText}>Configurer maintenant →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dark: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.85)' },
  border: { position: 'absolute', borderWidth: 2, borderColor: '#FFD700' },
  card: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clarioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFD700' },
  name: { fontSize: 13, color: '#FFD700', fontFamily: 'Inter-SemiBold' },
  skip: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter-Medium', textDecorationLine: 'underline' },
  body: { fontSize: 14, color: '#ffffff', fontFamily: 'Inter-Regular', lineHeight: 21 },
  btn: { backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnText: { fontSize: 14, color: '#000000', fontFamily: 'Inter-SemiBold' },
});
