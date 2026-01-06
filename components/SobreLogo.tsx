import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SobreLogoProps {
  fontSize?: number;
  color?: string;
  letterSpacing?: number;
}

export default function SobreLogo({ 
  fontSize = 24, 
  color = '#FFFFFF', 
  letterSpacing = 2 
}: SobreLogoProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.logoText, { fontSize, color, letterSpacing }]}>
        SØBRE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
});