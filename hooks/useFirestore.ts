import { USE_SUPABASE_AUTH } from '@/lib/auth/authConfig';
import { SUPABASE_DEBUG, decodeJwtClaims, supabase } from '@/lib/supabase';
import { getOrCreatePublicUserId } from '@/utils/publicUser';

type FirestoreResult<T> = { data: T; error: string | null };
type FirestoreErrorOnly = { error: string | null };

const COMMUNITY_TABLE = 'community_messages';
const COMMUNITY_FEED_RPC = 'community_feed';
const COMMUNITY_WHOAMI_RPC = 'community_whoami';
const COMMUNITY_FETCH_LIMIT = 50;
const COMMUNITY_POLL_INTERVAL_MS = 15000;

let hasLoggedCommunityAuthContext = false;

function toErrorMessage(error: unknown): string {
  return (error as any)?.message ?? String(error ?? 'Unknown error');
}

function isRpcMissing(error: any) {
  const code = error?.code;
  return code === 'PGRST202' || code === '42883';
}

function normalizeRpcRows(data: unknown): any[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}

function toStringTail(value: unknown, tailLength = 10): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value.slice(-tailLength);
}

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

    const logCommunityAuthContext = async (label: string) => {
      if (hasLoggedCommunityAuthContext) {
        return;
      }

      hasLoggedCommunityAuthContext = true;

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn(`[Community][Supabase] ${label}: getSession error`, sessionError);
        }

        const accessToken = sessionData?.session?.access_token ?? null;
        const claims = decodeJwtClaims(accessToken);

        console.log(`[Community][Supabase] ${label}: auth context`, {
          url: SUPABASE_DEBUG.url,
          configured: SUPABASE_DEBUG.configured,
          anonKeyPrefix: SUPABASE_DEBUG.anonKeyPrefix,
          anonKeySuffix: SUPABASE_DEBUG.anonKeySuffix,
          hasSession: Boolean(sessionData?.session),
          sessionUserId: sessionData?.session?.user?.id ?? null,
          sessionRole: claims?.role ?? null,
          sessionSubSuffix: toStringTail(claims?.sub),
          tokenExp: claims?.exp ?? null,
        });

        const { data: whoAmIData, error: whoAmIError } = await supabase.rpc(COMMUNITY_WHOAMI_RPC);
        if (whoAmIError) {
          if (isRpcMissing(whoAmIError)) {
            console.warn('[Community][Supabase] whoami RPC is missing. Run supabase/sql/community_messages.sql');
            return;
          }
          console.warn('[Community][Supabase] whoami RPC error', {
            code: whoAmIError.code ?? null,
            message: whoAmIError.message ?? null,
            details: whoAmIError.details ?? null,
          });
          return;
        }

        const whoAmIRow = normalizeRpcRows(whoAmIData)[0] ?? null;
        console.log('[Community][Supabase] whoami RPC', whoAmIRow);
      } catch (error) {
        console.warn(`[Community][Supabase] ${label}: auth context unexpected error`, error);
      }
    };

    const fetchCommunityPostsViaRpc = async (): Promise<{ data: any[]; error: string | null; missingRpc: boolean }> => {
      try {
        const { data, error } = await supabase.rpc(COMMUNITY_FEED_RPC, { p_limit: COMMUNITY_FETCH_LIMIT });
        console.log('[Community][Supabase] community_feed RPC response', {
          data,
          error: error
            ? {
                code: error.code ?? null,
                message: error.message ?? null,
                details: error.details ?? null,
              }
            : null,
        });

        if (error) {
          if (isRpcMissing(error)) {
            return { data: [], error: null, missingRpc: true };
          }

          console.warn('[Community][Supabase] community_feed RPC failed', {
            code: error.code ?? null,
            message: error.message ?? null,
            details: error.details ?? null,
          });
          return { data: [], error: error.message ?? 'community_feed RPC failed', missingRpc: false };
        }

        const rows = normalizeRpcRows(data);
        const posts = rows.map(mapSupabaseMessage);
        return { data: posts, error: null, missingRpc: false };
      } catch (error) {
        console.warn('[Community][Supabase] community_feed RPC exception', {
          message: (error as any)?.message ?? String(error ?? 'Unknown error'),
          name: (error as any)?.name ?? null,
          stack: (error as any)?.stack ?? null,
          error,
        });
        return { data: [], error: toErrorMessage(error), missingRpc: false };
      }
    };

    const fetchCommunityPostsViaTable = async (): Promise<FirestoreResult<any[]>> => {
      try {
        const { data, error, count } = await supabase
          .from(COMMUNITY_TABLE)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(COMMUNITY_FETCH_LIMIT);
        console.log('[Community][Supabase] table feed fallback response', {
          data,
          error: error
            ? {
                code: error.code ?? null,
                message: error.message ?? null,
                details: error.details ?? null,
              }
            : null,
          count: count ?? null,
        });

        console.log('[Community][Supabase] table feed fallback', {
          rows: data?.length ?? 0,
          count: count ?? null,
          error: error?.message ?? null,
        });

        if (error) {
          return { data: [], error: error.message };
        }

        return { data: (data ?? []).map(mapSupabaseMessage), error: null };
      } catch (error) {
        console.warn('[Community][Supabase] table feed fallback exception', {
          message: (error as any)?.message ?? String(error ?? 'Unknown error'),
          name: (error as any)?.name ?? null,
          stack: (error as any)?.stack ?? null,
          error,
        });
        return { data: [], error: toErrorMessage(error) };
      }
    };

    const fetchCommunityPostsOnce = async (): Promise<FirestoreResult<any[]>> => {
      await logCommunityAuthContext('fetchCommunityPostsOnce');

      const rpcResult = await fetchCommunityPostsViaRpc();
      if (!rpcResult.missingRpc) {
        console.log('[Community][Supabase] feed source', {
          source: 'rpc',
          rows: rpcResult.data.length,
          error: rpcResult.error,
        });
        return { data: rpcResult.data, error: rpcResult.error };
      }

      console.warn('[Community][Supabase] community_feed RPC missing, using table fallback.');
      return fetchCommunityPostsViaTable();
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

      const syncFeed = async (source: 'initial' | 'poll') => {
        try {
          const { data, error } = await fetchCommunityPostsOnce();
          if (error) {
            if (source === 'initial') {
              onError?.(new Error(error));
            } else {
              console.warn('[Community][Supabase] poll fetch failed', error);
            }
            return;
          }

          if (source === 'initial') {
            console.log('[Community][Supabase] initial feed result', { count: data.length });
          }

          pushPosts(data);
        } catch (error) {
          if (source === 'initial') {
            console.warn('[Community][Supabase] initial fetch exception', {
              message: (error as any)?.message ?? String(error ?? 'Unknown error'),
              name: (error as any)?.name ?? null,
              stack: (error as any)?.stack ?? null,
              error,
            });
            onError?.(error as Error);
          } else {
            console.warn('[Community][Supabase] poll fetch unexpected error', {
              message: (error as any)?.message ?? String(error ?? 'Unknown error'),
              name: (error as any)?.name ?? null,
              stack: (error as any)?.stack ?? null,
              error,
            });
          }
        }
      };

      void syncFeed('initial');

      const pollTimer = setInterval(() => {
        void syncFeed('poll');
      }, COMMUNITY_POLL_INTERVAL_MS);

      let channel: any = null;
      try {
        channel = supabase
          .channel('community')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: COMMUNITY_TABLE },
            (payload) => {
              console.log('[Community][Supabase] realtime INSERT payload', payload?.new);
              const mapped = mapSupabaseMessage(payload.new);
              const next = [...currentPosts.filter((p) => p.id !== mapped.id), mapped];
              pushPosts(next);
            },
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('[Community][Supabase] realtime CHANNEL_ERROR');
              onError?.(new Error('Realtime subscription error'));
            } else {
              console.log('[Community][Supabase] realtime status', status);
            }
          });
      } catch (error) {
        onError?.(error as Error);
      }

      return () => {
        active = false;
        clearInterval(pollTimer);

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

        await logCommunityAuthContext('createCommunityPost');

        const { publicUserId, fullName, avatarUrl } = await getOrCreatePublicUserId({
          fullName: metadata?.authorName,
        });
        const authorName = metadata?.authorName ?? fullName ?? 'Utilisateur';

        const payload = {
          public_user_id: publicUserId,
          author_name: authorName,
          author_avatar: avatarUrl ?? null,
          content: trimmed,
        };

        const { error } = await supabase.from(COMMUNITY_TABLE).insert(payload);

        if (error) {
          console.warn('[Community][Supabase] insert failed', {
            code: error.code ?? null,
            message: error.message ?? null,
            details: error.details ?? null,
          });
          return { data: null, error: error.message };
        }

        const optimisticPost = {
          id: `local-${Date.now()}`,
          authorId: publicUserId,
          authorName,
          authorAvatar: avatarUrl ?? null,
          content: trimmed,
          createdAt: new Date(),
          likedBy: [],
        };

        const refreshed = await fetchCommunityPostsOnce();
        if (!refreshed.error && refreshed.data.length > 0) {
          const inserted = refreshed.data.find((post) => post.authorId === publicUserId && post.content === trimmed);
          if (inserted) {
            return { data: { id: inserted.id, post: inserted }, error: null };
          }
        }

        return { data: { id: optimisticPost.id, post: optimisticPost }, error: null };
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

  // Evite d'importer Firebase/Firestore quand Supabase Auth est actif.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFirestoreFirebase } = require('./useFirestore.firebase');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFirestoreFirebase();
}
