import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Calendar, Heart, Brain, Target, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { getUserScopedKey, migrateLegacyKey } from '@/utils/storage';
import { formatDateFrench } from '@/utils/date';

export default function JournalHistoryScreen() {
  const { loadJournalEntries } = useFirestore();
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  // Recharger les entrées quand on revient sur la page (focus effect)
  const { useFocusEffect } = require('@react-navigation/native');
  const { useCallback } = require('react');
  
  useFocusEffect(
    useCallback(() => {
      console.log('Journal history focused - reloading entries');
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    console.log('=== Loading journal entries ===');
    try {
      // Charger depuis Firebase d'abord
      await migrateLegacyKey('journalEntries');
      const { data: firestoreEntries } = await loadJournalEntries();
      
      if (firestoreEntries && firestoreEntries.length > 0) {
        console.log('Using Firestore entries:', firestoreEntries.length);
        setEntries(firestoreEntries);
        await persistEntriesLocally(firestoreEntries);
      } else {
        // Fallback vers AsyncStorage
        console.log('Loading from AsyncStorage...');
        const storageKey = getUserScopedKey('journalEntries');
        const entriesData = await AsyncStorage.getItem(storageKey);
        const legacyData = entriesData ?? (await AsyncStorage.getItem('journalEntries'));
        if (entriesData) {
          const parsedEntries = JSON.parse(entriesData);
          console.log('Journal entries from AsyncStorage:', parsedEntries.length);
          setEntries(parsedEntries);
        } else if (legacyData) {
          const parsedEntries = JSON.parse(legacyData);
          setEntries(parsedEntries);
          await AsyncStorage.setItem(storageKey, legacyData);
          await AsyncStorage.removeItem('journalEntries');
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const persistEntriesLocally = async (currentEntries: any[]) => {
    try {
      const storageKey = getUserScopedKey('journalEntries');
      await AsyncStorage.setItem(storageKey, JSON.stringify(currentEntries));
    } catch (error) {
      console.error('Error persisting journal entries locally:', error);
    }
  };

  const formatDate = (dateString) => {
    return formatDateFrench(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEntryPress = (entry) => {
    router.push({
      pathname: '/journal',
      params: {
        entryId: entry.id,
        firestoreId: entry.firestoreId,
        content: entry.content || '',
        mood: entry.mood || '',
        triggers: JSON.stringify(entry.triggers || []),
        victories: entry.victories || '',
        challenges: entry.challenges || '',
        isEditing: 'true'
      }
    });
  };

  const getMoodEmoji = (moodId) => {
    const moods = {
      'great': '😊',
      'good': '🙂',
      'okay': '😐',
      'difficult': '😔',
      'struggling': '😰'
    };
    return moods[moodId] || '😐';
  };

  const createConciseSummary = (entry) => {
    let summary = '';
    
    // Prioriser le contenu principal "vos pensées du jour" (max 80 caractères)
    if (entry.content && entry.content.trim()) {
      summary = entry.content.length > 80 
        ? entry.content.substring(0, 80) + '...'
        : entry.content;
    }
    
    // Si pas de contenu principal mais des victoires
    else if (entry.victories && entry.victories.trim()) {
      summary = entry.victories.length > 60 
        ? entry.victories.substring(0, 60) + '...'
        : entry.victories;
    }
    
    // Si vraiment rien d'autre, utiliser les défis
    else if (entry.challenges && entry.challenges.trim()) {
      summary = entry.challenges.length > 60 
        ? entry.challenges.substring(0, 60) + '...'
        : entry.challenges;
    }
    
    // Message par défaut en dernier recours
    else {
      summary = 'Entrée de journal personnel';
    }
    
    return summary.toString().trim() || 'Entrée de journal personnel';
  };

  const handleBackPress = () => {
    router.replace('/(tabs)/index');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.spacer} />
      </View>

      {/* Background avec particules */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.particle, { top: '10%', left: '15%' }]} />
        <View style={[styles.particle, { top: '25%', right: '20%' }]} />
        <View style={[styles.particle, { top: '40%', left: '10%' }]} />
        <View style={[styles.particle, { top: '60%', right: '15%' }]} />
        <View style={[styles.particle, { top: '80%', left: '25%' }]} />
        <View style={[styles.particle, { top: '15%', left: '60%' }]} />
        <View style={[styles.particle, { top: '70%', right: '40%' }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Aucune entrée pour le moment</Text>
            <Text style={styles.emptyText}>
              Commencez à écrire dans votre journal pour voir l'historique ici.
            </Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {entries.map((entry) => (
              <TouchableOpacity 
                key={entry.id} 
                style={styles.entryCard}
                onPress={() => handleEntryPress(entry)}
                activeOpacity={0.8}
              >
                {/* Header de l'entrée */}
                <View style={styles.entryHeader}>
                  <View style={styles.entryDate}>
                    <Calendar size={16} color="#A3A3A3" />
                    <Text style={styles.entryDateText}>
                      {formatDate(entry.date)}
                    </Text>
                  </View>
                  <Text style={styles.entryMood}>
                    {getMoodEmoji(entry.mood)}
                  </Text>
                </View>
                
                {/* Résumé concis du contenu */}
                <Text style={styles.entrySummary}>
                  {createConciseSummary(entry)}
                </Text>
                
                {/* Indicateurs rapides */}
                <View style={styles.entryIndicators}>
                  {Boolean(entry.triggers && entry.triggers.length > 0) && (
                    <View style={styles.indicator}>
                      <AlertTriangle size={12} color="#F59E0B" />
                      <Text style={styles.indicatorText}>
                        {entry.triggers.length} déclencheur{entry.triggers.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  
                  {Boolean(entry.victories && entry.victories.trim()) && (
                    <View style={styles.indicator}>
                      <Target size={12} color="#FFD700" />
                      <Text style={styles.indicatorText}>Victoires</Text>
                    </View>
                  )}
                  
                  {Boolean(entry.challenges && entry.challenges.trim()) && (
                    <View style={styles.indicator}>
                      <Brain size={12} color="#DC2626" />
                      <Text style={styles.indicatorText}>Défis</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bouton New Entry fixe en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => router.push('/journal')}
          activeOpacity={0.9}
        >
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
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
   width: 40,
   height: 40,
   alignItems: 'center',
   justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  entriesContainer: {
    paddingBottom: 120, // Espace pour le bouton fixe
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  entryCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    marginLeft: 6,
  },
  entryMood: {
    fontSize: 24,
  },
  entrySummary: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 22,
    marginBottom: 12,
  },
  entryIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  indicatorText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    marginLeft: 4,
  },
  calendarNoteCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarNoteDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarNoteDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    marginLeft: 6,
  },
  calendarNoteBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  calendarNoteBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  calendarNoteSummary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: 40,
    zIndex: 2,
  },
  newEntryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  plusText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noteModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  noteModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  noteModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  noteModalCloseButton: {
    padding: 8,
  },
  noteContent: {
    maxHeight: 300,
  },
  noteText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
  },
});
