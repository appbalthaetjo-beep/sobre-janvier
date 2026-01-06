import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, BookOpen } from 'lucide-react-native';

// Import all modules statically for Metro bundler
import module1 from '@/data/modules/module1.json';
import module2 from '@/data/modules/module2.json';
import module3 from '@/data/modules/module3.json';
import module4 from '@/data/modules/module4.json';
import module5 from '@/data/modules/module5.json';

// Create modules lookup
const modules = {
  1: module1,
  2: module2,
  3: module3,
  4: module4,
  5: module5,
};

interface Lesson {
  id: number;
  title: string;
  content: string;
  duration: string;
}

export default function LessonDetailScreen() {
  const params = useLocalSearchParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessonContent();
  }, []);

  const loadLessonContent = async () => {
    try {
      const lessonId = parseInt(params.lessonId as string);
      const moduleId = Math.ceil(lessonId / 5); // Déterminer le module (1-5)
      
      // Charger le module approprié depuis le lookup statique
      const moduleData = modules[moduleId as keyof typeof modules];
      const lessonData = moduleData.lessons.find((l: Lesson) => l.id === lessonId);
      
      if (lessonData) {
        setLesson(lessonData);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la leçon...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Leçon non trouvée</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leçon {lesson.id}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre de la leçon */}
        <View style={styles.titleSection}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          
          {/* Durée */}
          <View style={styles.durationContainer}>
            <Clock size={16} color="#FFD700" />
            <Text style={styles.durationText}>{lesson.duration}</Text>
          </View>
          
          {/* Résumé */}
          {lesson.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{lesson.summary}</Text>
            </View>
          )}
        </View>

        {/* Contenu de la leçon */}
        <View style={styles.contentSection}>
          <View style={styles.contentContainer}>
            <BookOpen size={20} color="#FFD700" />
            <Text style={styles.contentTitle}>Contenu de la leçon</Text>
          </View>
          
          <Text style={styles.lessonContent}>{lesson.content}</Text>
        </View>

        {/* Action pratique */}
        {lesson.action && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>💡 Action pratique</Text>
            <View style={styles.actionContainer}>
              <Text style={styles.actionText}>{lesson.action}</Text>
            </View>
          </View>
        )}

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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerBackButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginLeft: 8,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contentSection: {
    marginBottom: 32,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  lessonContent: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionSection: {
    marginBottom: 32,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 16,
  },
  actionContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});