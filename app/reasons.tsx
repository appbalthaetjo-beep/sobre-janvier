import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirestore } from '@/hooks/useFirestore';
import { getUserScopedKey, migrateLegacyKey } from '@/utils/storage';

interface Reason {
  id: string;
  text: string;
  createdAt: string;
}

export default function ReasonsScreen() {
  const { saveUserData, loadUserData } = useFirestore();
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    try {
      // Charger depuis Firebase d'abord
      await migrateLegacyKey('userReasons');
      const { data: firestoreData } = await loadUserData();
      
      if (firestoreData && firestoreData.reasons) {
        setReasons(firestoreData.reasons);
      } else {
        // Fallback vers AsyncStorage
        const storageKey = getUserScopedKey('userReasons');
        const reasonsData = await AsyncStorage.getItem(storageKey);
        const legacyData = reasonsData ?? (await AsyncStorage.getItem('userReasons'));
        const raw = reasonsData ?? legacyData;
        if (raw) {
          setReasons(JSON.parse(raw));
          if (!reasonsData && legacyData) {
            await AsyncStorage.setItem(storageKey, legacyData);
            if (storageKey !== 'userReasons') {
              await AsyncStorage.removeItem('userReasons');
            }
          }
        } else {
          // Ajouter quelques raisons par défaut
          const defaultReasons: Reason[] = [
            {
              id: '1',
              text: 'Je veux retrouver ma confiance en moi',
              createdAt: new Date().toISOString()
            },
            {
              id: '2', 
              text: 'Je veux améliorer mes relations',
              createdAt: new Date().toISOString()
            }
          ];
          setReasons(defaultReasons);
          await saveReasons(defaultReasons);
        }
      }
    } catch (error) {
      console.error('Error loading reasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReasons = async (newReasons: Reason[]) => {
    try {
      // Sauvegarder dans Firebase
      await saveUserData({ reasons: newReasons });
      
      // Aussi sauvegarder localement comme backup
      const storageKey = getUserScopedKey('userReasons');
      await AsyncStorage.setItem(storageKey, JSON.stringify(newReasons));
      if (storageKey !== 'userReasons') {
        await AsyncStorage.removeItem('userReasons');
      }
    } catch (error) {
      console.error('Error saving reasons:', error);
    }
  };

  const handleAddReason = () => {
    router.push('/add-reason');
  };

  const handleReasonPress = (reason: Reason) => {
    router.push({
      pathname: '/reflect-reason',
      params: { 
        reasonId: reason.id,
        reasonText: reason.text 
      }
    });
  };

  const renderReason = ({ item }: { item: Reason }) => (
    <TouchableOpacity
      style={styles.reasonCard}
      onPress={() => handleReasonPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.reasonIcon}>
        <Heart size={20} color="#FFD700" />
      </View>
      <Text style={styles.reasonText}>{item.text}</Text>
      <View style={styles.reasonArrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes raisons</Text>
        <TouchableOpacity onPress={handleAddReason} style={styles.addButton}>
          <Plus size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Introduction */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Pourquoi voulez-vous changer ?</Text>
          <Text style={styles.introText}>
            Vos raisons sont votre force. Relisez-les quand la motivation faiblit.
          </Text>
        </View>

        {/* Reasons List */}
        {reasons.length > 0 ? (
          <FlatList
            data={reasons}
            renderItem={renderReason}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reasonsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Heart size={48} color="#666666" />
            <Text style={styles.emptyTitle}>Aucune raison pour le moment</Text>
            <Text style={styles.emptyText}>
              Commencez par ajouter votre première raison de vouloir changer.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddReason}
            >
              <Plus size={16} color="#000000" />
              <Text style={styles.emptyButtonText}>Ajouter ma première raison</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Button (fixed at bottom when list exists) */}
        {reasons.length > 0 && (
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={handleAddReason}
          >
            <Plus size={24} color="#000000" />
            <Text style={styles.floatingAddText}>Ajouter une raison</Text>
          </TouchableOpacity>
        )}
      </View>
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
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  introContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
  },
  reasonsList: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  reasonCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reasonIcon: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 8,
    marginRight: 16,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  reasonArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingAddText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
  },
});
