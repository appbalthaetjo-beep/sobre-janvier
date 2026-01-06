import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerFeedbackListener, FeedbackRequest } from '@/utils/feedback';
import { useFirestore } from '@/hooks/useFirestore';
import { getAppMetadata } from '@/utils/reviewPrompts';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

const CATEGORIES = ['Motivation', 'Contenus', 'Interface', 'Bugs', 'Prix'];

interface FeedbackModalHostProps {
  visible: boolean;
  onClose: () => void;
  request: FeedbackRequest | null;
}

function FeedbackModal({ visible, onClose, request }: FeedbackModalHostProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const { submitInternalFeedback } = useFirestore();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      setSelectedCategories([]);
      setMessage(request?.presetMessage ?? '');
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, request]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed && selectedCategories.length === 0) {
      Alert.alert('Merci', 'Sélectionne une catégorie ou écris un message pour nous aider.');
      return;
    }

    const { appVersion, platform } = getAppMetadata();
    const { error } = await submitInternalFeedback({
      context: request?.context ?? 'unspecified',
      message: trimmed,
      categories: selectedCategories,
      appVersion,
      platform,
    });

    if (error) {
      Alert.alert('Erreur', error);
      return;
    }

    console.log(
      `feedback:submitted(${request?.context ?? 'unspecified'},${selectedCategories.join('|') || 'none'},${appVersion},${platform})`,
    );
    Alert.alert('Merci', 'Ton message a bien été envoyé.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ton avis nous aide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Dis-nous comment améliorer SOBRE. Tout retour est lu par l’équipe.
          </Text>

          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => {
              const active = selectedCategories.includes(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => handleToggleCategory(category)}
                >
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.messageInput}
            placeholder="Raconte-nous ce qui pourrait être mieux…"
            placeholderTextColor="#A1A1AA"
            multiline
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

export default function FeedbackModalHost() {
  const [visible, setVisible] = useState(false);
  const [request, setRequest] = useState<FeedbackRequest | null>(null);

  useEffect(() => {
    const unregister = registerFeedbackListener((incoming) => {
      setRequest(incoming);
      setVisible(true);
    });

    return unregister;
  }, []);

  const handleClose = () => {
    setVisible(false);
    setRequest(null);
  };

  return <FeedbackModal visible={visible} onClose={handleClose} request={request} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#09090B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 8,
  },
  modalSubtitle: {
    color: '#A1A1AA',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1F1F23',
  },
  categoryChipActive: {
    backgroundColor: '#FFD700',
  },
  categoryText: {
    color: '#E4E4E7',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  categoryTextActive: {
    color: '#111111',
  },
  messageInput: {
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    minHeight: 110,
    maxHeight: 180,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
