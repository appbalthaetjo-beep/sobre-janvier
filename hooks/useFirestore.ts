import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { supabase } from '@/lib/supabase';
import { getOrCreatePublicUserId } from '@/utils/publicUser';

type FirestoreResult<T> = { data: T; error: string | null };
type FirestoreErrorOnly = { error: string | null };

const COMMUNITY_TABLE = 'community_messages';

export function useFirestore() {
  if (USE_SUPABASE_AUTH) {
    const ok: FirestoreErrorOnly = { error: null };
    const mapSupabaseMessage = (row: any) => {
      const createdAtRaw = row?.created_at ? new Date(row.created_at) : new Date();
      const createdAt = Number.isNaN(createdAtRaw.getTime()) ? new Date() : createdAtRaw;

      return {
        id: String(row?.id ?? ''),
        authorId: typeof row?.public_user_id === 'string' ? row.public_user_id : String(row?.public_user_id ?? ''),
        authorName: row?.author_name?.trim?.() ? row.author_name.trim() : 'Utilisateur',
        authorAvatar: row?.author_avatar ?? null,
        content: typeof row?.content === 'string' ? row.content : '',
        createdAt,
        likedBy: [],
      };
    };

    const sortByCreatedAt = (posts: any[]) =>
      [...posts].sort((a, b) => {
        const aTime = a?.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a?.createdAt ?? 0).getTime();
        const bTime = b?.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b?.createdAt ?? 0).getTime();
        return aTime - bTime;
      });

    const saveSobrietyData = async (_data: any): Promise<FirestoreErrorOnly> => ok;
    const loadSobrietyData = async (): Promise<FirestoreResult<any>> => ({ data: null, error: null });

    const saveUserData = async (_data: any): Promise<FirestoreErrorOnly> => ok;
    const loadUserData = async (): Promise<FirestoreResult<any>> => ({ data: null, error: null });

    const saveJournalEntry = async (
      _entry: any,
    ): Promise<{ error: string | null; firestoreId?: string; entryId?: string }> => ({ error: null });
    const loadJournalEntries = async (): Promise<FirestoreResult<any[]>> => ({ data: [], error: null });

    const saveCompletedChallenges = async (_challenges: string[]): Promise<FirestoreErrorOnly> => ok;
    const loadCompletedChallenges = async (): Promise<FirestoreResult<string[]>> => ({ data: [], error: null });

    const fetchCommunityPostsOnce = async (): Promise<FirestoreResult<any[]>> => {
      try {
        const { data, error } = await supabase
          .from(COMMUNITY_TABLE)
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          return { data: [], error: error.message };
        }

        if (__DEV__) {
          console.log('[community] supabase fetch rows', data?.length ?? 0, data);
        }

        const posts = data?.map(mapSupabaseMessage) ?? [];

        return { data: posts, error: null };
      } catch (error: any) {
        return { data: [], error: error?.message ?? String(error ?? 'Unknown error') };
      }
    };

    const subscribeToCommunityPosts = (
      onPosts: (posts: any[]) => void,
      onError?: (error: Error) => void,
    ): (() => void) => {
      let active = true;
      let currentPosts: any[] = [];

      const pushPosts = (posts: any[]) => {
        if (!active) return;
        currentPosts = sortByCreatedAt(posts);
        onPosts(currentPosts);
      };

      fetchCommunityPostsOnce()
        .then(({ data, error }) => {
          if (error) {
            onError?.(new Error(error));
            return;
          }
          pushPosts(data);
        })
        .catch((error) => onError?.(error as Error));

      let channel: any = null;
      try {
        channel = supabase
          .channel('community')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: COMMUNITY_TABLE },
            (payload) => {
              const mapped = mapSupabaseMessage(payload.new);
              const next = [...currentPosts.filter((p) => p.id !== mapped.id), mapped];
              pushPosts(next);
            },
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              onError?.(new Error('Realtime subscription error'));
            }
          });
      } catch (error) {
        onError?.(error as Error);
      }

      return () => {
        active = false;
        if (channel?.unsubscribe) {
          try {
            void channel.unsubscribe();
          } catch {
            // ignore
          }
        }
        if (channel && typeof supabase.removeChannel === 'function') {
          try {
            void supabase.removeChannel(channel);
          } catch {
            // ignore
          }
        }
      };
    };

    const createCommunityPost = async (
      content: string,
      metadata?: { authorName?: string; daysSober?: number },
    ): Promise<FirestoreResult<{ id: string; post?: any } | null>> => {
      try {
        const trimmed = (content ?? '').trim();
        if (!trimmed) {
          return { data: null, error: 'Message vide' };
        }

        const { publicUserId, fullName, avatarUrl } = await getOrCreatePublicUserId({
          fullName: metadata?.authorName,
        });
        const authorName = metadata?.authorName ?? fullName ?? 'Utilisateur';

        const { data, error } = await supabase
          .from(COMMUNITY_TABLE)
          .insert({
            public_user_id: publicUserId,
            author_name: authorName,
            author_avatar: avatarUrl ?? null,
            content: trimmed,
          })
          .select('*')
          .single();

        if (error) {
          return { data: null, error: error.message };
        }

        const mapped = mapSupabaseMessage(data);
        return { data: { id: mapped.id, post: mapped }, error: null };
      } catch (error: any) {
        return { data: null, error: error?.message ?? String(error ?? 'Unknown error') };
      }
    };

    const toggleCommunityPostLike = async (): Promise<FirestoreErrorOnly> => ok;

    const addCommentToCommunityPost = async (): Promise<FirestoreResult<null>> => ({
      data: null,
      error: 'Les commentaires sont désactivés pour le moment.',
    });

    return {
      saveSobrietyData,
      loadSobrietyData,
      saveUserData,
      loadUserData,
      saveJournalEntry,
      loadJournalEntries,
      saveCompletedChallenges,
      loadCompletedChallenges,
      subscribeToCommunityPosts,
      fetchCommunityPostsOnce,
      createCommunityPost,
      toggleCommunityPostLike,
      addCommentToCommunityPost,
    };
  }

  // Évite d'importer Firebase/Firestore quand Supabase Auth est actif.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFirestoreFirebase } = require('./useFirestore.firebase');
  return useFirestoreFirebase();
}
