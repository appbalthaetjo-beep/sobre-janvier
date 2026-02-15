import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Send } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: Date;
  likedBy: string[];
}

export default function CommunityScreen() {
  const DISCORD_INVITE = 'https://discord.gg/hYu3WP7D';
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'ranking'>('feed');
  const listRef = useRef<FlatList<CommunityPost>>(null);
  const shouldScrollToTopRef = useRef(false);

  const {
    subscribeToCommunityPosts,
    createCommunityPost,
    toggleCommunityPostLike,
  } = useFirestore();
  const subscribeRef = useRef(subscribeToCommunityPosts);
  const sortByCreatedAt = (list: CommunityPost[]) =>
    [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  useEffect(() => {
    subscribeRef.current = subscribeToCommunityPosts;
  }, [subscribeToCommunityPosts]);

  useEffect(() => {
    const unsubscribe = subscribeRef.current(
      (incoming) => {
        const next = sortByCreatedAt(incoming.map(normalizePost));
        setPosts(next);
      },
      (error) => {
        console.warn('[Community] subscribe error', error);
        Alert.alert('Erreur', "Impossible de charger les messages maintenant.");
      },
    );

    return () => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn('[Community] unsubscribe failed', error);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollToTopRef.current || activeTab !== 'feed') {
      return;
    }
    shouldScrollToTopRef.current = false;
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [posts, activeTab]);

  const canSendPost = Boolean(user) && inputValue.trim().length > 0 && !sending;

  const handleSendPost = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connecte-toi pour partager ta progression.');
      return;
    }
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    try {
      setSending(true);
      const metadata = user.displayName ? { authorName: user.displayName } : undefined;
      const { data, error } = await createCommunityPost(trimmed, metadata);
      if (error) {
        Alert.alert('Erreur', error);
        return;
      }
      if (data?.post) {
        shouldScrollToTopRef.current = true;
        setPosts((prev) => sortByCreatedAt([...prev, normalizePost(data.post)]));
      }
      setInputValue('');
    } catch (error: any) {
      Alert.alert('Erreur', error?.message ?? 'Impossible de publier pour le moment.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connecte-toi pour réagir.');
      return;
    }
    const hasLiked = post.likedBy.includes(user.uid);
    try {
      const { error } = await toggleCommunityPostLike(post.id, hasLiked);
      if (error) {
        Alert.alert('Erreur', error);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error?.message ?? 'Impossible de réagir pour le moment.');
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAuthorInitial(item.authorId, item.authorName)}</Text>
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.postAuthor}>{formatAuthor(item.authorId, item.authorName)}</Text>
            <Text style={styles.postTimestamp}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={activeTab === 'feed' ? posts : []}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <View style={styles.headerTop}>
                <View style={styles.headerTextBlock}>
                  <Text style={styles.heading}>Communauté</Text>
                  <Text style={styles.subtitle}>Ensemble, nous sommes plus forts</Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="link"
                  accessibilityLabel="Rejoindre le Discord"
                  onPress={() => Linking.openURL(DISCORD_INVITE)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="discord" size={32} color="#7289da" />
                </TouchableOpacity>
              </View>

              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'feed' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('feed')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'feed' && styles.tabButtonTextActive]}>
                    Fil d'actualité
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'ranking' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('ranking')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'ranking' && styles.tabButtonTextActive]}>
                    Classement
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.highlightCard}>
                <Text style={styles.highlightText}>Vous êtes plus fort que vos tentations.</Text>
              </View>

              {activeTab === 'feed' ? (
                <View style={styles.shareCard}>
                  <Text style={styles.shareTitle}>Partagez votre progression</Text>
                  <View style={styles.shareInputRow}>
                    <TextInput
                      style={styles.shareInput}
                      placeholder="Je viens de commencer, je vous tiens au courant 💪"
                      placeholderTextColor="#B0B0B0"
                      value={inputValue}
                      onChangeText={setInputValue}
                      editable={!sending}
                      maxLength={500}
                      multiline
                      textAlignVertical="top"
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      style={[styles.shareSendButton, !canSendPost && styles.shareSendButtonDisabled]}
                      onPress={handleSendPost}
                      disabled={!canSendPost}
                    >
                      <Send size={18} color={canSendPost ? '#000000' : '#555555'} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderCard}>
                  <Text style={styles.placeholderTitle}>Classement à venir</Text>
                  <Text style={styles.placeholderText}>
                    Nous travaillons sur un classement pour célébrer vos plus belles progressions. Reste connecté !
                  </Text>
                </View>
              )}

              {activeTab === 'feed' && posts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Encore aucun message</Text>
                  <Text style={styles.emptyDescription}>
                    Publie ton premier message pour inspirer la communauté.
                  </Text>
                </View>
              )}

              {activeTab === 'ranking' && (
                <View style={styles.rankingSoonCard}>
                  <Text style={styles.rankingSoonTitle}>Bientôt disponible</Text>
                  <Text style={styles.rankingSoonText}>
                    Le classement apparaîtra ici pour suivre vos progrès et célébrer vos victoires communes.
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function normalizePost(raw: any): CommunityPost {
  const likedBy = Array.isArray(raw?.likedBy) ? (raw.likedBy as string[]) : [];

  return {
    id: String(raw?.id ?? ''),
    authorId: String(raw?.authorId ?? ''),
    authorName:
      typeof raw?.authorName === 'string' && raw.authorName.trim().length > 0 ? raw.authorName : 'Utilisateur',
    authorAvatar: typeof raw?.authorAvatar === 'string' ? raw.authorAvatar : null,
    content: typeof raw?.content === 'string' ? raw.content : '',
    createdAt: normalizeDate(raw?.createdAt),
    likedBy,
  };
}

function normalizeDate(value?: any): Date {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch (error) {
      // ignore
    }
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function formatAuthor(authorId: string, authorName: string): string {
  if (authorName && authorName !== 'Utilisateur') {
    return authorName;
  }
  if (!authorId) {
    return 'Membre';
  }
  return 'Utilisateur';
}

function getAuthorInitial(authorId: string, authorName: string): string {
  const label = formatAuthor(authorId, authorName);
  const initial = label.trim().charAt(0).toUpperCase();
  return initial || 'U';
}

function formatDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'maintenant';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'maintenant';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 32 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#A3A3A3',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFD700',
  },
  tabButtonText: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Medium',
  },
  tabButtonTextActive: {
    color: '#000000',
  },
  highlightCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    padding: 16,
    marginBottom: 16,
  },
  highlightText: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  shareCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    padding: 18,
    marginBottom: 24,
  },
  shareTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  shareInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  shareInput: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    minHeight: 54,
    maxHeight: 120,
  },
  shareSendButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSendButtonDisabled: {
    backgroundColor: '#2F2F2F',
  },
  placeholderCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    padding: 20,
    marginBottom: 24,
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#A3A3A3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  postCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  postTimestamp: {
    color: '#A3A3A3',
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    color: '#F5F5F5',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#6B6B6B',
    fontSize: 12,
  },
  statTextActive: {
    color: '#FFD700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#A3A3A3',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  rankingSoonCard: {
    backgroundColor: '#141414',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 24,
    marginTop: 12,
  },
  rankingSoonTitle: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  rankingSoonText: {
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
