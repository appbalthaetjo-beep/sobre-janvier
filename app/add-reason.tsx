import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { getUserScopedKey, migrateLegacyKey } from '@/utils/storage';

interface Reason {
  id: string;
  text: string;
  createdAt: string;
}

export default function AddReasonScreen() {
  const { saveUserData, loadUserData } = useFirestore();
  const [reasonText, setReasonText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveReason = async () => {
    const trimmedText = reasonText.trim();
    
    if (!trimmedText) {
      Alert.alert('Erreur', 'Veuillez écrire votre raison avant de la sauvegarder.');
      return;
    }

    if (trimmedText.length < 5) {
      Alert.alert('Erreur', 'Votre raison doit contenir au moins 5 caractères.');
      return;
    }

    setSaving(true);

    try {
      // Charger les raisons existantes
      await migrateLegacyKey('userReasons');
      const { data: userData } = await loadUserData();
      const existingReasons = userData?.reasons || [];

      // Créer la nouvelle raison
      const newReason: Reason = {
        id: Date.now().toString(),
        text: trimmedText,
        createdAt: new Date().toISOString()
      };

      // Ajouter à la liste
      const updatedReasons = [...existingReasons, newReason];

      // Sauvegarder dans Firebase
      await saveUserData({ reasons: updatedReasons });
      
      // Aussi sauvegarder localement comme backup
      const storageKey = getUserScopedKey('userReasons');
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedReasons));
      if (storageKey !== 'userReasons') {
        await AsyncStorage.removeItem('userReasons');
      }

      // Retourner à la page des raisons
      router.back();
      
    } catch (error) {
      console.error('Error saving reason:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder votre raison. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = reasonText.trim().length >= 5 && !saving;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Nouvelle raison</Text>
          <TouchableOpacity 
            onPress={handleSaveReason} 
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            disabled={!canSave}
          >
            <Check size={24} color={canSave ? "#FFD700" : "#666666"} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Pourquoi voulez-vous changer ?</Text>
            <Text style={styles.instructionText}>
              Écrivez une raison personnelle et significative. Elle vous motivera dans les moments difficiles.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Je veux retrouver ma confiance en moi..."
              placeholderTextColor="#666666"
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
              autoFocus
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {reasonText.length}/200 caractères
              </Text>
            </View>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Conseils pour une bonne raison :</Text>
            <Text style={styles.tipsText}>
              • Soyez spécifique et personnel{'\n'}
              • Concentrez-vous sur ce que vous voulez gagner{'\n'}
              • Utilisez des mots qui vous touchent émotionnellement{'\n'}
              • Pensez à l'impact sur votre vie quotidienne
            </Text>
          </View>
        </View>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.saveReasonButton, !canSave && styles.saveReasonButtonDisabled]}
            onPress={handleSaveReason}
            disabled={!canSave}
          >
            <Text style={[styles.saveReasonButtonText, !canSave && styles.saveReasonButtonTextDisabled]}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder ma raison'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  instructionContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  tipsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  saveReasonButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveReasonButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  saveReasonButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  saveReasonButtonTextDisabled: {
    color: '#666666',
  },
});
