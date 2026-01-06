import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Image, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { getUserScopedKey, migrateLegacyKey } from '@/utils/storage';
import { formatDateFrench } from '@/utils/date';

// Obtenir la largeur de l'écran
const { width: screenWidth } = Dimensions.get('window');

interface CalendarViewProps {
  sobrietyData: {
    startDate: string;
    daysSober: number;
    relapseHistory: Array<{
      date: string;
      daysSoberAtRelapse: number;
      reason?: string;
    }>;
  };
}

interface DayDetail {
  date: string;
  status: 'sober' | 'relapse' | 'future';
  note?: string;
}

interface DayData {
  date: Date;
  status: 'sober' | 'relapse' | 'future' | 'today';
  isCurrentMonth: boolean;
  dayNumber: number;
  row: number;
  col: number;
}

interface Sequence {
  days: DayData[];
  status: 'sober' | 'relapse';
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export default function CalendarView({ sobrietyData }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const { saveJournalEntry } = useFirestore();

  // Définition des paliers avec leurs cristaux
  const milestones = [
    { day: 1, title: "Allumage", image: "https://i.imgur.com/I0CDkDl.png" },
    { day: 3, title: "Stabilité", image: "https://i.imgur.com/cniGCsd.png" },
    { day: 7, title: "Cristal poli", image: "https://i.imgur.com/LNMqJ98.png" },
    { day: 14, title: "Clarté", image: "https://i.imgur.com/MKLuVcH.png" },
    { day: 21, title: "Momentum", image: "https://i.imgur.com/Vl6qAgW.png" },
    { day: 30, title: "Brillance", image: "https://i.imgur.com/MY22kz8.png" },
    { day: 45, title: "Maîtrise", image: "https://i.imgur.com/umTTlbn.png" },
    { day: 60, title: "Résilience", image: "https://i.imgur.com/nDgOpzY.png" },
    { day: 75, title: "Force", image: "https://i.imgur.com/GeKdi4a.png" },
    { day: 90, title: "Cristal légendaire", image: "https://i.imgur.com/hPEjBe0.png" }
  ];

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Navigation entre mois
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // LOGIQUE SIMPLIFIÉE : Obtenir le statut d'un jour
  const getDayStatus = (date: Date): 'sober' | 'relapse' | 'future' | 'today' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Aujourd'hui = statut spécial
    if (checkDate.getTime() === today.getTime()) {
      return 'today';
    }
    
    // Si le jour est dans le futur
    if (checkDate > today) {
      return 'future';
    }
    
    // Vérifier s'il y a eu une rechute ce jour précis
    const hasRelapseThisDay = sobrietyData.relapseHistory?.some(relapse => {
      const relapseDate = new Date(relapse.date);
      relapseDate.setHours(0, 0, 0, 0);
      return relapseDate.getTime() === checkDate.getTime();
    });
    
    if (hasRelapseThisDay) {
      return 'relapse';
    }
    
    // Trouver la dernière rechute (la plus récente)
    let lastRelapseDate = null;
    if (sobrietyData.relapseHistory && sobrietyData.relapseHistory.length > 0) {
      const sortedRelapses = [...sobrietyData.relapseHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      lastRelapseDate = new Date(sortedRelapses[0].date);
      lastRelapseDate.setHours(0, 0, 0, 0);
    }
    
    // Si aucune rechute dans l'historique, utiliser la date de début de la série actuelle
    if (!lastRelapseDate) {
      const startDate = new Date(sobrietyData.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Les jours depuis le début de la série (inclus) sont sobres
      if (checkDate >= startDate) {
        return 'sober';
      } else {
        return 'future'; // Avant le début = pas d'affichage
      }
    }
    
    // Il y a eu au moins une rechute : 
    // Les jours sobres = du lendemain de la dernière rechute jusqu'à hier
    const dayAfterLastRelapse = new Date(lastRelapseDate.getTime() + 24 * 60 * 60 * 1000);
    
    if (checkDate >= dayAfterLastRelapse) {
      return 'sober';
    } else {
      return 'future'; // Avant la série actuelle = pas d'affichage
    }
  };

  // Générer les jours du mois avec position grille
  const generateCalendarDays = (): DayData[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Trouver le lundi de la semaine du premier jour
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days: DayData[] = [];
    let currentDate = new Date(startDate);
    
    // Générer 6 semaines (42 jours) pour couvrir tous les cas
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const status = getDayStatus(currentDate);
        const isCurrentMonth = currentDate.getMonth() === month;
        
        days.push({
          date: new Date(currentDate),
          status,
          isCurrentMonth,
          dayNumber: currentDate.getDate(),
          row,
          col
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return days;
  };

  // Détecter les séquences consécutives de même statut
  const detectSequences = (days: DayData[]): Sequence[] => {
    const sequences: Sequence[] = [];
    const processedDays = new Set<string>();
    
    days.forEach((day, index) => {
      const dayKey = `${day.row}-${day.col}`;
      
      if (processedDays.has(dayKey) || 
          day.status === 'future' || 
          day.status === 'today' ||
          !day.isCurrentMonth) {
        return;
      }
      
      // Commencer une nouvelle séquence
      const sequence: DayData[] = [day];
      processedDays.add(dayKey);
      
      // Chercher les jours consécutifs avec le même statut
      let currentRow = day.row;
      let currentCol = day.col;
      
      // Regarder vers la droite dans la même ligne
      for (let nextCol = currentCol + 1; nextCol < 7; nextCol++) {
        const nextDay = days.find(d => d.row === currentRow && d.col === nextCol);
        if (nextDay && 
            nextDay.status === day.status && 
            nextDay.isCurrentMonth &&
            !processedDays.has(`${nextDay.row}-${nextDay.col}`)) {
          sequence.push(nextDay);
          processedDays.add(`${nextDay.row}-${nextDay.col}`);
        } else {
          break;
        }
      }
      
      // Si on est en fin de ligne, continuer sur la ligne suivante
      if (sequence[sequence.length - 1].col === 6) {
        let nextRow = currentRow + 1;
        let nextCol = 0;
        
        while (nextRow < 6) {
          const nextDay = days.find(d => d.row === nextRow && d.col === nextCol);
          if (nextDay && 
              nextDay.status === day.status && 
              nextDay.isCurrentMonth &&
              !processedDays.has(`${nextDay.row}-${nextDay.col}`)) {
            sequence.push(nextDay);
            processedDays.add(`${nextDay.row}-${nextDay.col}`);
            
            // Continuer vers la droite sur cette ligne
            for (let continueCol = nextCol + 1; continueCol < 7; continueCol++) {
              const continueDay = days.find(d => d.row === nextRow && d.col === continueCol);
              if (continueDay && 
                  continueDay.status === day.status && 
                  continueDay.isCurrentMonth &&
                  !processedDays.has(`${continueDay.row}-${continueDay.col}`)) {
                sequence.push(continueDay);
                processedDays.add(`${continueDay.row}-${continueDay.col}`);
              } else {
                break;
              }
            }
            
            // Si cette ligne ne se termine pas à la fin, arrêter
            if (sequence[sequence.length - 1].col !== 6) {
              break;
            }
            
            nextRow++;
            nextCol = 0;
          } else {
            break;
          }
        }
      }
      
      // Ajouter la séquence si elle contient plus d'un jour OU si c'est un jour de rechute
      if (sequence.length > 1 || day.status === 'relapse') {
        sequences.push({
          days: sequence,
          status: day.status,
          startRow: sequence[0].row,
          startCol: sequence[0].col,
          endRow: sequence[sequence.length - 1].row,
          endCol: sequence[sequence.length - 1].col
        });
      }
    });
    
    return sequences;
  };

  // Gérer le clic sur un jour
  const handleDayPress = async (day: DayData) => {
    if (day.status === 'future' || !day.isCurrentMonth) return;
    
    // Charger la note existante s'il y en a une
    try {
      const dateString = day.date.toISOString().split('T')[0];
      const noteKey = `dayNote_${dateString}`;
      const existingNote = await AsyncStorage.getItem(noteKey);
      
      setSelectedDay({
        date: dateString,
        status: day.status === 'today' ? 'sober' : day.status, // Traiter aujourd'hui comme sobre pour les notes
        note: existingNote || ''
      });
      setNote(existingNote || '');
      setShowModal(true);
    } catch (error) {
      if (__DEV__) console.error('Error loading day note:', error);
    }
  };

  // Sauvegarder une note
  const journalStorageKey = () => getUserScopedKey('journalEntries');

  const saveNote = async () => {
    if (!selectedDay) return;
    
    try {
      await migrateLegacyKey('journalEntries');
      // TOUJOURS sauvegarder dans le journal si il y a une note
      if (note.trim()) {
        const entryId = Date.now().toString();
        const journalEntry = {
          id: entryId,
          date: new Date(selectedDay.date).toISOString(),
          content: note,
          type: selectedDay.status === 'relapse' ? 'relapse_note' : 'calendar_note',
          mood: selectedDay.status === 'relapse' ? 'struggling' : 'okay',
          triggers: [],
          victories: '',
          challenges: selectedDay.status === 'relapse' ? note : ''
        };
        
        // Sauvegarder dans Firebase
        let syncResult;
        try {
          syncResult = await saveJournalEntry(journalEntry);
        } catch (error: any) {
          console.error('[Calendar] saveJournalEntry threw', error);
          syncResult = {
            error: error?.message ?? String(error ?? 'Unknown error'),
            firestoreId: entryId,
            entryId,
          };
        }

        const normalizedEntry = {
          ...journalEntry,
          firestoreId: syncResult?.firestoreId ?? entryId,
          syncStatus: syncResult?.error ? 'pending' : 'synced',
        };
        
        // Aussi sauvegarder localement dans AsyncStorage
        const storageKey = journalStorageKey();
        const entriesData = await AsyncStorage.getItem(storageKey);
        const legacyData = entriesData ?? (await AsyncStorage.getItem('journalEntries'));
        const rawEntries = legacyData ?? entriesData;
        const existingEntries = rawEntries ? JSON.parse(rawEntries) : [];
        const updatedEntries = [normalizedEntry, ...existingEntries];
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedEntries));
        if (legacyData && storageKey !== 'journalEntries') {
          await AsyncStorage.removeItem('journalEntries');
        }

        if (syncResult?.error) {
          Alert.alert(
            'Sauvegarde hors ligne',
            "La note est enregistrée localement mais n'a pas pu être synchronisée (connexion requise)."
          );
        } else {
          Alert.alert('✅ Enregistré dans journal', "Votre note est maintenant visible dans l'historique du journal.");
        }

        setShowModal(false);
        return;
      }
      
      setShowModal(false);
      Alert.alert('Note enregistrée', 'Aucune donnée à sauvegarder.');
    } catch (error) {
      if (__DEV__) console.error('Error saving note:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la note.');
    }
  };

  const calendarDays = generateCalendarDays();
  const sequences = detectSequences(calendarDays);

  // Calculer les jours de sobriété depuis le début
  const calculateDaysSinceCurrentStart = (date: Date) => {
    const currentStartDate = new Date(sobrietyData.startDate);
    currentStartDate.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < currentStartDate) return -1; // Avant le début de la série actuelle
    
    // CALCUL UNIFORME : Même logique que partout
    const elapsedMs = checkDate.getTime() - currentStartDate.getTime();
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    return Math.max(0, Math.floor(totalSeconds / 86400));
  };
  
  // Calculer les jours depuis l'inscription originale
  const calculateDaysSinceOriginalSignup = (date: Date) => {
    const originalStartDate = new Date(sobrietyData.originalSignupDate || sobrietyData.startDate);
    originalStartDate.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < originalStartDate) return -1; // Avant l'inscription
    
    // CALCUL UNIFORME : Même logique que partout
    const elapsedMs = checkDate.getTime() - originalStartDate.getTime();
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    return Math.max(0, Math.floor(totalSeconds / 86400));
  };

  // Calculer les jours depuis le début de la série actuelle
  const calculateDaysSinceStart = (date: Date) => {
    const startDate = new Date(sobrietyData.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < startDate) return -1; // Avant le début
    
    // CALCUL UNIFORME : Même logique que partout
    const elapsedMs = checkDate.getTime() - startDate.getTime();
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    return Math.max(0, Math.floor(totalSeconds / 86400));
  };

  // Vérifier si un jour est un palier et s'il est débloqué
  const getMilestoneForDay = (date: Date) => {
    const daysSinceCurrentStart = calculateDaysSinceCurrentStart(date);
    if (daysSinceCurrentStart < 1) return null;
    
    const milestone = milestones.find(m => m.day === daysSinceCurrentStart);
    if (!milestone) return null;
    
    // Le cristal n'est visible que si le palier est atteint dans la série actuelle
    // Le cristal n'est visible que si l'utilisateur a VRAIMENT atteint ce palier
    // dans sa série actuelle (pas juste calculé depuis une date)
    const isUnlocked = sobrietyData.daysSober >= milestone.day;
    
    return {
      ...milestone,
      isUnlocked,
      daysSinceStart: daysSinceCurrentStart
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sober': return '#10B981'; // Vert émeraude plus vibrant
      case 'relapse': return '#DC2626'; // Rouge plus intense
      case 'today': return '#6B7280'; // Gris neutre pour aujourd'hui
      case 'future': return '#4B5563';
      default: return '#4B5563';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Calculer le style pour les formes de séquence
  // Obtenir le style de fond pour chaque jour individuellement
  const getDayBackgroundStyle = (day: DayData) => {
    if (!day.isCurrentMonth) return {};
    
    switch (day.status) {
      case 'sober':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.4)',
          borderRadius: 8,
        };
      case 'relapse':
        return {
          backgroundColor: 'rgba(220, 38, 38, 0.4)',
          borderRadius: 8,
        };
      case 'today':
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.3)',
          borderRadius: 8,
        };
      default:
        return {};
    }
  };

  return (
    <View style={styles.container}>
      {/* Header de navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.weekDaysHeader}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.weekDayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grille du calendrier avec formes de séquences */}
      <View style={styles.calendarContainer}>
        {/* Grille des jours */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <TouchableOpacity
                style={[
                  styles.dayCell,
                  getDayBackgroundStyle(day), // Background coloré directement sur la cellule
                  !day.isCurrentMonth && styles.dayCellOtherMonth,
                  isToday(day.date) && styles.dayCellToday
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                {(() => {
                  const milestone = getMilestoneForDay(day.date);
                  
                  // Si c'est aujourd'hui, afficher un point neutre
                  if (day.status === 'today') {
                    return (
                      <View style={styles.todayDot} />
                    );
                  }
                  
                  // Si c'est un jour de palier, afficher cristal/cadenas
                  if (milestone && day.isCurrentMonth) {
                    if (milestone.isUnlocked) {
                      return (
                        <Image
                          source={{ uri: milestone.image }}
                          style={styles.crystalInPlace}
                          resizeMode="contain"
                        />
                      );
                    } else {
                      return (
                        <Text style={styles.lockInPlace}>🔒</Text>
                      );
                    }
                  } else {
                    // Jour normal : afficher le numéro
                    return (
                      <Text style={[
                        styles.dayNumber,
                        !day.isCurrentMonth && styles.dayNumberOtherMonth,
                        isToday(day.date) && styles.dayNumberToday
                      ]}>
                        {day.dayNumber}
                      </Text>
                    );
                  }
                })()}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {
            backgroundColor: '#10B981',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 2,
          }]} />
          <Text style={styles.legendText}>Sobre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { 
            backgroundColor: '#DC2626',
            shadowColor: '#DC2626',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 2,
          }]} />
          <Text style={styles.legendText}>Rechute</Text>
        </View>
      </View>

      {/* Modal de détail du jour */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Calendar size={20} color="#FFFFFF" />
                <Text style={styles.modalTitle}>
                  {selectedDay && formatDateFrench(selectedDay.date, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseButton}>
                <X size={20} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            {/* Statut du jour */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: selectedDay ? getStatusColor(selectedDay.status) : '#4B5563' }
              ]}>
                <Text style={styles.statusText}>
                  {selectedDay?.status === 'sober' ? '🟩 Jour sobre' : '🟥 Rechute'}
                </Text>
              </View>
            </View>

            {/* Input pour note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>
                {selectedDay?.status === 'relapse' ? 'Réflexion sur cette rechute :' : 'Note personnelle :'}
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder={
                  selectedDay?.status === 'relapse' 
                    ? "Qu'avez-vous appris de cette expérience ?" 
                    : "Comment s'est passée cette journée ?"
                }
                placeholderTextColor="#666666"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Boutons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveNoteButton}
                onPress={saveNote}
              >
                <Check size={16} color="#000000" />
                <Text style={styles.saveNoteButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
    paddingVertical: 8,
  },
  calendarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 10,
  },
  dayContainer: {
    width: '14.28%', // 7 jours par semaine
    alignItems: 'center',
  },
  dayCell: {
    height: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    zIndex: 10,
  },
  dayNumberOtherMonth: {
    color: '#666666',
  },
  dayNumberToday: {
    color: '#FFD700',
    fontWeight: '700',
  },
  crystalInPlace: {
    width: 24,
    height: 24,
  },
  lockInPlace: {
    fontSize: 16,
    color: '#6B7280',
  },
  signupStar: {
    fontSize: 16,
    color: '#FFD700',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginTop: 2,
  },
  todayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  modalCloseButton: {
    padding: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  noteContainer: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  saveNoteButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveNoteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
