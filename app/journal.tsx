import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Check, Calendar, Heart, Brain, Target, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { getUserScopedKey, migrateLegacyKey } from '@/utils/storage';
import { formatDateFrench } from '@/utils/date';

export default function JournalScreen() {
  const params = useLocalSearchParams();
  const { saveJournalEntry, loadJournalEntries } = useFirestore();
  const [journalEntry, setJournalEntry] = useState('');
  const [mood, setMood] = useState('');
  const [triggers, setTriggers] = useState([]);
  const [victories, setVictories] = useState('');
  const [challenges, setChallenges] = useState('');
  const [entries, setEntries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryFirestoreId, setEditingEntryFirestoreId] = useState<string | null>(null);

  const getStorageKey = () => getUserScopedKey('journalEntries');

  const moods = [
    { id: 'great', emoji: '😊', label: 'Excellent' },
    { id: 'good', emoji: '🙂', label: 'Bien' },
    { id: 'okay', emoji: '😐', label: 'Correct' },
    { id: 'difficult', emoji: '😔', label: 'Difficile' },
    { id: 'struggling', emoji: '😰', label: 'En lutte' },
  ];

  const commonTriggers = [
    'Stress', 'Ennui', 'Solitude', 'Réseaux sociaux', 
    'Tard le soir', 'Procrastination', 'Fatigue', 'Anxiété'
  ];

  useEffect(() => {
    loadEntries();
    loadEntryFromParams();
  }, []);

  const loadEntryFromParams = () => {
    if (params.isEditing === 'true' && params.entryId) {
      setIsEditing(true);
      setEditingEntryId(params.entryId as string);
      setEditingEntryFirestoreId((params.firestoreId as string) || null);
      setJournalEntry(params.content as string || '');
      setMood(params.mood as string || '');
      setTriggers(params.triggers ? JSON.parse(params.triggers as string) : []);
      setVictories(params.victories as string || '');
      setChallenges(params.challenges as string || '');
    }
  };

  const loadEntries = async () => {
    try {
      await migrateLegacyEntriesIfNeeded();
      const { data: firestoreEntries } = await loadJournalEntries();

      if (firestoreEntries && firestoreEntries.length > 0) {
        setEntries(firestoreEntries);
        await persistEntriesLocally(firestoreEntries);
        return;
      }

      const storageKey = getStorageKey();
      const entriesData = await AsyncStorage.getItem(storageKey);
      const legacyData = entriesData ?? (await AsyncStorage.getItem('journalEntries'));

      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        setEntries(parsed);
        await persistEntriesLocally(parsed);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const persistEntriesLocally = async (currentEntries: any[]) => {
    try {
      const storageKey = getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(currentEntries));
    } catch (error) {
      console.error('Error persisting journal entries locally:', error);
    }
  };

  const migrateLegacyEntriesIfNeeded = async () => {
    await migrateLegacyKey('journalEntries');
  };

  const saveEntry = async () => {
    if (!journalEntry.trim() && !mood) {
      Alert.alert('Erreur', 'Veuillez au moins écrire quelque chose ou sélectionner votre humeur.');
      return;
    }

    const entryId = isEditing && editingEntryId ? editingEntryId : Date.now().toString();
    const baseEntry = {
      id: entryId,
      date: new Date().toISOString(),
      content: journalEntry,
      mood,
      triggers,
      victories,
      challenges,
      firestoreId: editingEntryFirestoreId || undefined,
    };

    let syncResult: Awaited<ReturnType<typeof saveJournalEntry>>;
    try {
      syncResult = await saveJournalEntry(baseEntry);
    } catch (error: any) {
      console.error('[Journal] saveJournalEntry threw', error);
      syncResult = {
        error: error?.message ?? String(error ?? 'Unknown error'),
        firestoreId: baseEntry.firestoreId ?? entryId,
        entryId,
      };
    }

    const firestoreId = syncResult?.firestoreId ?? baseEntry.firestoreId ?? entryId;
    const normalizedEntry = {
      ...baseEntry,
      firestoreId,
      syncStatus: syncResult?.error ? 'pending' : 'synced',
    };

    if (isEditing) {
      const updatedEntries = entries.map(entry =>
        entry.id?.toString() === editingEntryId ? normalizedEntry : entry
      );
      await persistEntriesLocally(updatedEntries);
      setEntries(updatedEntries);

      if (syncResult?.error) {
        Alert.alert(
          'Sauvegarde hors ligne',
          "L'entrée est enregistrée localement mais n'a pas pu être synchronisée (connexion requise)."
        );
      } else {
        Alert.alert('Succès', 'Votre entrée a été mise à jour !');
      }

      resetFormState();
      return;
    }

    const updatedEntries = [normalizedEntry, ...entries];
    await persistEntriesLocally(updatedEntries);
    setEntries(updatedEntries);
    await migrateLegacyEntriesIfNeeded();

    if (syncResult?.error) {
      Alert.alert(
        'Sauvegarde hors ligne',
        "L'entrée est enregistrée localement mais n'a pas pu être synchronisée (connexion requise)."
      );
    }

    resetFormState();
    router.replace('/journal-history');
  };

  const resetFormState = () => {
    setJournalEntry('');
    setMood('');
    setTriggers([]);
    setVictories('');
    setChallenges('');
    setIsEditing(false);
    setEditingEntryId(null);
    setEditingEntryFirestoreId(null);
  };

  const toggleTrigger = (trigger) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const formatDate = (dateString) => {
    return formatDateFrench(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (moodId) => {
    const mood = moods.find(m => m.id === moodId);
    return mood ? mood.emoji : '😐';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Modifier l\'entrée' : 'Journal Personnel'}
        </Text>
        <TouchableOpacity onPress={saveEntry} style={styles.saveButton}>
          <Check size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment vous sentez-vous aujourd'hui ?</Text>
          <View style={styles.moodContainer}>
            {moods.map((moodOption) => (
              <TouchableOpacity
                key={moodOption.id}
                style={[
                  styles.moodButton,
                  mood === moodOption.id && styles.moodButtonSelected
                ]}
                onPress={() => setMood(moodOption.id)}
              >
                <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  mood === moodOption.id && styles.moodLabelSelected
                ]}>
                  {moodOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Journal Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos pensées du jour</Text>
          <TextInput
            style={styles.journalInput}
            placeholder="Écrivez librement vos pensées, sentiments, expériences du jour..."
            placeholderTextColor="#666666"
            value={journalEntry}
            onChangeText={setJournalEntry}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Triggers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Déclencheurs rencontrés</Text>
          <View style={styles.triggersContainer}>
            {commonTriggers.map((trigger) => (
              <TouchableOpacity
                key={trigger}
                style={[
                  styles.triggerChip,
                  triggers.includes(trigger) && styles.triggerChipSelected
                ]}
                onPress={() => toggleTrigger(trigger)}
              >
                <Text style={[
                  styles.triggerText,
                  triggers.includes(trigger) && styles.triggerTextSelected
                ]}>
                  {trigger}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Victories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Victoires et réussites</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Quelles victoires avez-vous remportées aujourd'hui ?"
            placeholderTextColor="#666666"
            value={victories}
            onChangeText={setVictories}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis et difficultés</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Quels défis avez-vous rencontrés ?"
            placeholderTextColor="#666666"
            value={challenges}
            onChangeText={setChallenges}
            multiline
            numberOfLines={3}
          />
        </View>


        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Conseils pour votre journal</Text>
          <Text style={styles.tipsText}>
            • Soyez honnête avec vous-même{'\n'}
            • Notez vos émotions sans jugement{'\n'}
            • Identifiez vos déclencheurs pour mieux les éviter{'\n'}
            • Célébrez vos petites victoires{'\n'}
            • Utilisez ce journal pour voir vos progrès
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  moodButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2A2A2A',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  moodLabelSelected: {
    color: '#FFD700',
  },
  journalInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    color: '#FFFFFF',
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  triggerChipSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  triggerTextSelected: {
    color: '#FFD700',
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#FFFFFF',
  },
  noEntriesContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  noEntriesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
});
