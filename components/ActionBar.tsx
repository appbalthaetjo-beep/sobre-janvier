import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { HandHeart, Brain, RotateCcw, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface ActionBarProps {
  onPledge: () => void;
  onMeditate: () => void;
  onReset: () => void;
  onMore: () => void;
}

export default function ActionBar({ onPledge, onMeditate, onReset, onMore }: ActionBarProps) {
  const actions = [
    { icon: HandHeart, label: 'Pledge', onPress: onPledge, color: '#EC4899' },
    { icon: Brain, label: 'Méditer', onPress: onMeditate, color: '#8B5CF6' },
    { icon: RotateCcw, label: 'Reset', onPress: onReset, color: '#F59E0B' },
    { icon: MoreHorizontal, label: 'Plus', onPress: onMore, color: '#6B7280' },
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
            <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
              <Icon size={20} color={action.color} />
            </View>
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
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 24,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backdropFilter: 'blur(10px)',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
});