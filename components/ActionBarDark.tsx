import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { HandHeart, Brain, RotateCcw, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface ActionBarDarkProps {
  onPledge: () => void;
  onMeditate: () => void;
  onReset: () => void;
  onMore: () => void;
}

export default function ActionBarDark({ onPledge, onMeditate, onReset, onMore }: ActionBarDarkProps) {
  const actions = [
    { icon: HandHeart, label: 'Engagement', onPress: onPledge },
    { icon: Brain, label: 'Méditer', onPress: onMeditate },
    { icon: RotateCcw, label: 'Reset', onPress: onReset },
    { icon: MoreHorizontal, label: 'Plus', onPress: onMore },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={action.onPress}
          >
            <Icon size={24} color="#F5F5F5" strokeWidth={1.5} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 24,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3', // Gris neutre
    marginTop: 8,
  },
});