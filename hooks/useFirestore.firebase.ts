import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { getOrCreatePublicUserId } from '@/utils/publicUser';
import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { User, onAuthStateChanged } from 'firebase/auth';

type FirestoreResult<T> = { data: T; error: string | null };
type FirestoreErrorOnly = { error: string | null };

const AUTH_RESOLVE_TIMEOUT = 5000;

async function waitForAuthenticatedUser(existing: User | null): Promise<User | null> {
  const immediate = existing ?? auth.currentUser;
  if (immediate) {
    return immediate;
  }

  try {
    return await new Promise<User>((resolve, reject) => {
      let unsubscribe = () => {};
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Utilisateur non connecté'));
      }, AUTH_RESOLVE_TIMEOUT);

      unsubscribe = onAuthStateChanged(
        auth,
        (authUser) => {
          if (authUser) {
            clearTimeout(timeoutId);
            unsubscribe();
            resolve(authUser);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(error);
        },
      );
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[Firestore] Failed to resolve authenticated user', error);
    }
    return null;
  }
}

export function useFirestoreFirebase() {
  const { user } = useAuth();

  const withUser = async (): Promise<User | null> => {
    const resolved = await waitForAuthenticatedUser((user as any) ?? null);
    return resolved ?? null;
  };

  const saveSobrietyData = async (data: any): Promise<FirestoreErrorOnly> => {
    const activeUser = await withUser();
    if (!activeUser) return { error: 'Utilisateur non connecté' };

    try {
      const { publicUserId } = await getOrCreatePublicUserId();
      const userRef = doc(db, 'users', activeUser.uid);
      await setDoc(
        userRef,
        {
          sobrietyData: {
            ...data,
            updatedAt: Timestamp.now(),
          },
          email: activeUser.email,
          uid: activeUser.uid,
          publicUserId,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const loadSobrietyData = async (): Promise<FirestoreResult<any>> => {
    const activeUser = await withUser();
    if (!activeUser) return { data: null, error: 'Utilisateur non connecté' };

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { data: userSnap.data().sobrietyData, error: null };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const saveUserData = async (data: any): Promise<FirestoreErrorOnly> => {
    const activeUser = await withUser();
    if (!activeUser) return { error: 'Utilisateur non connecté' };

    try {
      const { publicUserId } = await getOrCreatePublicUserId();
      if (__DEV__) {
        console.log('Firestore saveUserData called with:', Object.keys(data));
      }

      const userRef = doc(db, 'users', activeUser.uid);
      await setDoc(
        userRef,
        {
          ...data,
          email: activeUser.email,
          uid: activeUser.uid,
          publicUserId,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      return { error: null };
    } catch (error: any) {
      if (__DEV__) console.error('Firestore save error:', error);
      return { error: error.message };
    }
  };

  const loadUserData = async (): Promise<FirestoreResult<any>> => {
    const activeUser = await withUser();
    if (!activeUser) return { data: null, error: 'Utilisateur non connecté' };

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { data: userSnap.data(), error: null };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const saveJournalEntry = async (
    entry: any,
  ): Promise<{ error: string | null; firestoreId?: string; entryId?: string }> => {
    const activeUser = await withUser();
    if (!activeUser) return { error: 'Utilisateur non connecté' };

    try {
      const entryId = entry?.id ? String(entry.id) : Date.now().toString();
      const firestoreId = entry?.firestoreId ? String(entry.firestoreId) : entryId;
      const journalDoc = doc(db, 'users', activeUser.uid, 'journalEntries', firestoreId);

      const { firestoreId: _ignoreFirestoreId, ...rest } = entry ?? {};
      const payload: Record<string, any> = {
        ...rest,
        id: entryId,
        date: rest.date ?? new Date().toISOString(),
        updatedAt: Timestamp.now(),
      };

      if (!entry?.firestoreId) {
        payload.createdAt = Timestamp.now();
      }

      await setDoc(journalDoc, payload, { merge: true });

      return { error: null, firestoreId, entryId };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const loadJournalEntries = async (): Promise<FirestoreResult<any[]>> => {
    const activeUser = await withUser();
    if (!activeUser) return { data: [], error: 'Utilisateur non connecté' };

    try {
      const journalRef = collection(db, 'users', activeUser.uid, 'journalEntries');
      const q = query(journalRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const entries = querySnapshot.docs.map((snapshot) => {
        const raw = snapshot.data();
        const createdAt =
          raw?.createdAt?.toDate?.().toISOString?.() ?? raw?.createdAt ?? raw?.date ?? new Date().toISOString();
        const updatedAt = raw?.updatedAt?.toDate?.().toISOString?.() ?? raw?.updatedAt ?? createdAt;
        const storedId = raw?.id ? String(raw.id) : snapshot.id;

        return {
          firestoreId: snapshot.id,
          ...raw,
          id: storedId,
          date: raw?.date ?? createdAt,
          createdAt,
          updatedAt,
        };
      });

      return { data: entries, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  };

  const saveCompletedChallenges = async (challenges: string[]): Promise<FirestoreErrorOnly> => {
    const activeUser = await withUser();
    if (!activeUser) return { error: 'Utilisateur non connecté' };

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      await setDoc(
        userRef,
        {
          completedChallenges: challenges,
          challengesUpdatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const subscribeToCommunityPosts = (onPosts: (posts: any[]) => void, onError?: (error: Error) => void): (() => void) => {
    const postsRef = collection(db, 'communityPosts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Record<string, unknown>),
        }));
        onPosts(posts);
      },
      (error) => {
        if (__DEV__) {
          console.error('[Firestore] subscribeToCommunityPosts failed', error);
        }
        onError?.(error);
      },
    );
  };

  const fetchCommunityPostsOnce = async (): Promise<FirestoreResult<any[]>> => {
    try {
      const postsRef = collection(db, 'communityPosts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Record<string, unknown>),
      }));

      return { data: posts, error: null };
    } catch (error) {
      if (__DEV__) {
        console.error('[Firestore] fetchCommunityPostsOnce failed', error);
      }
      return { data: [], error: (error as any)?.message ?? String(error ?? 'Unknown error') };
    }
  };

  const createCommunityPost = async (
    content: string,
    metadata?: { authorName?: string; daysSober?: number },
  ): Promise<FirestoreResult<{ id: string } | null>> => {
    const activeUser = await withUser();
    if (!activeUser) return { data: null, error: 'Utilisateur non connecté' };

    try {
      const postsRef = collection(db, 'communityPosts');
      const docRef = await addDoc(postsRef, {
        authorId: activeUser.uid,
        authorName: metadata?.authorName ?? activeUser.displayName ?? 'Anonyme',
        content,
        daysSober: metadata?.daysSober ?? 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      return { data: { id: docRef.id }, error: null };
    } catch (error) {
      if (__DEV__) {
        console.error('[Firestore] createCommunityPost failed', error);
      }
      return { data: null, error: (error as any)?.message ?? String(error ?? 'Unknown error') };
    }
  };

  const toggleCommunityPostLike = async (postId: string, hasLiked: boolean): Promise<FirestoreErrorOnly> => {
    const activeUser = await withUser();
    if (!activeUser) return { error: 'Utilisateur non connecté' };

    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        likedBy: hasLiked ? arrayRemove(activeUser.uid) : arrayUnion(activeUser.uid),
      });
      return { error: null };
    } catch (error) {
      if (__DEV__) {
        console.error('[Firestore] toggleCommunityPostLike failed', error);
      }
      return { error: (error as any)?.message ?? String(error ?? 'Unknown error') };
    }
  };

  const addCommentToCommunityPost = async (): Promise<FirestoreResult<null>> => {
    return { data: null, error: 'Les commentaires sont désactivés pour le moment.' };
  };

  const loadCompletedChallenges = async (): Promise<FirestoreResult<string[]>> => {
    const activeUser = await withUser();
    if (!activeUser) return { data: [], error: 'Utilisateur non connecté' };

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().completedChallenges) {
        return { data: userSnap.data().completedChallenges, error: null };
      }

      return { data: [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  };

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
