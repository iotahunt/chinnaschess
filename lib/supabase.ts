import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { firestore } from './firebase';
import { OperationType, handleFirestoreError } from './firestore-errors';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

// Read env variables supported in Expo Web and Vite
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: Record<string, string> }).env?.EXPO_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: Record<string, string> }).env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client if credentials aren't configured yet to prevent crashing
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface ProfileRecord {
  id: string;
  email: string;
  domain_expansions: number;
  created_at: string;
}

export interface GameRecord {
  id: string;
  room_code: string;
  white_user_id: string;
  black_user_id: string | null;
  fen: string;
  status: 'waiting' | 'active' | 'finished';
  winner_id: string | null;
  white_aura: number;
  black_aura: number;
  created_at?: string;
  updated_at?: string;
}

// Local In-Memory / LocalStorage Mock Store as secondary local cache
const LOCAL_STORAGE_KEY_GAMES = 'chinnas_chess_games_db';
const LOCAL_STORAGE_KEY_PROFILES = 'chinnas_chess_profiles_db';

type GameSubscriptionCallback = (game: GameRecord) => void;
const activeSubscriptions = new Map<string, Set<GameSubscriptionCallback>>();

function getLocalGames(): Record<string, GameRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_GAMES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalGames(games: Record<string, GameRecord>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_GAMES, JSON.stringify(games));
  } catch {
    // Ignore storage issues
  }
}

function getLocalProfiles(): Record<string, ProfileRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProfiles(profiles: Record<string, ProfileRecord>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch {
    // Ignore
  }
}

export function notifyLocalGameSubscribers(game: GameRecord) {
  const listeners = activeSubscriptions.get(game.id);
  if (listeners) {
    listeners.forEach((cb) => cb(game));
  }
}

// Unified Database and Realtime layer:
// Uses built-in server API + SSE for instant cross-device play anywhere,
// with optional Supabase synchronization.
export const db = {
  // Profiles
  async getProfile(userId: string): Promise<ProfileRecord | null> {
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return data as ProfileRecord;
      }
    } catch {
      // Fallback
    }

    try {
      const snap = await getDoc(doc(firestore, 'profiles', userId));
      if (snap.exists()) {
        return snap.data() as ProfileRecord;
      }
    } catch {
      // Fallback
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data as ProfileRecord;
      } catch {
        // Fallback
      }
    }

    const profiles = getLocalProfiles();
    return profiles[userId] || null;
  },

  async upsertProfile(profile: Partial<ProfileRecord> & { id: string; email: string }): Promise<ProfileRecord> {
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        const profiles = getLocalProfiles();
        profiles[profile.id] = data;
        saveLocalProfiles(profiles);
        setDoc(doc(firestore, 'profiles', profile.id), data, { merge: true }).catch(() => {});
        return data as ProfileRecord;
      }
    } catch {
      // Fallback
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            email: profile.email,
            domain_expansions: profile.domain_expansions ?? 0,
          })
          .select()
          .single();
        if (!error && data) {
          setDoc(doc(firestore, 'profiles', profile.id), data, { merge: true }).catch(() => {});
          return data as ProfileRecord;
        }
      } catch {
        // Fallback
      }
    }

    const profiles = getLocalProfiles();
    const existing = profiles[profile.id];
    const updated: ProfileRecord = {
      id: profile.id,
      email: profile.email,
      domain_expansions: profile.domain_expansions ?? existing?.domain_expansions ?? 0,
      created_at: existing?.created_at || new Date().toISOString(),
    };
    profiles[profile.id] = updated;
    saveLocalProfiles(profiles);
    setDoc(doc(firestore, 'profiles', profile.id), updated, { merge: true }).catch(() => {});
    return updated;
  },

  async incrementDomainExpansion(userId: string): Promise<number> {
    let nextCount = 1;
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}/domain-expansion`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        nextCount = data.domain_expansions;
      }
    } catch {
      // Fallback
    }

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('profiles').select('domain_expansions').eq('id', userId).single();
        const current = data?.domain_expansions ?? 0;
        const next = current + 1;
        await supabase.from('profiles').update({ domain_expansions: next }).eq('id', userId);
        nextCount = next;
      } catch {
        // Fallback
      }
    }

    const profiles = getLocalProfiles();
    if (profiles[userId]) {
      profiles[userId].domain_expansions = (profiles[userId].domain_expansions || 0) + 1;
      nextCount = profiles[userId].domain_expansions;
      saveLocalProfiles(profiles);
    }

    // Also persist to Firestore
    setDoc(
      doc(firestore, 'profiles', userId),
      {
        domain_expansions: nextCount,
        domain_area: nextCount * 67,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});

    return nextCount;
  },

  // Games
  async createGame(params: {
    roomCode: string;
    whiteUserId: string;
    startingFen: string;
  }): Promise<GameRecord> {
    let resultGame: GameRecord | null = null;

    // 1. Try server API
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        resultGame = (await res.json()) as GameRecord;
      }
    } catch (err) {
      console.warn('Backend server unreachable, trying fallback...', err);
    }

    // 2. Try Supabase if configured
    if (!resultGame && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('games')
          .insert({
            room_code: params.roomCode,
            white_user_id: params.whiteUserId,
            black_user_id: null,
            fen: params.startingFen,
            status: 'waiting',
            white_aura: 0,
            black_aura: 0,
          })
          .select()
          .single();
        if (!error && data) resultGame = data as GameRecord;
      } catch (err) {
        console.warn('Supabase error:', err);
      }
    }

    // 3. Fallback to local store if needed
    if (!resultGame) {
      resultGame = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'game_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        room_code: params.roomCode.trim().toUpperCase(),
        white_user_id: params.whiteUserId,
        black_user_id: null,
        fen: params.startingFen,
        status: 'waiting',
        winner_id: null,
        white_aura: 0,
        black_aura: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const games = getLocalGames();
    games[resultGame.id] = resultGame;
    saveLocalGames(games);
    notifyLocalGameSubscribers(resultGame);

    // Sync to Firestore & backend server
    try {
      await setDoc(doc(firestore, 'games', resultGame.id), resultGame, { merge: true });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `games/${resultGame.id}`);
      }
      console.warn('Firestore game sync fallback:', err);
    }

    // Keep server memory primed
    fetch('/api/games/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultGame),
    }).catch(() => {});

    return resultGame;
  },

  async findGameByRoomCode(roomCode: string): Promise<GameRecord | null> {
    const code = roomCode.trim().toUpperCase();

    // 1. Try server API
    try {
      const res = await fetch(`/api/games/code/${encodeURIComponent(code)}`);
      if (res.ok) {
        const game = (await res.json()) as GameRecord;
        return game;
      }
    } catch (err) {
      console.warn('Server lookup failed, checking secondary sources:', err);
    }

    // 2. Try Firestore
    try {
      const q = query(collection(firestore, 'games'), where('room_code', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const game = snap.docs[0].data() as GameRecord;
        // Prime server memory
        fetch('/api/games/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(game),
        }).catch(() => {});
        return game;
      }
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, 'games');
      }
    }

    // 3. Try Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('room_code', code)
          .single();
        if (!error && data) return data as GameRecord;
      } catch (err) {
        console.warn('Supabase findGame error:', err);
      }
    }

    // 4. Fallback to local store
    const games = getLocalGames();
    const match = Object.values(games).find((g) => g.room_code === code);
    return match || null;
  },

  async joinGame(gameId: string, blackUserId: string): Promise<GameRecord | null> {
    let joinedGame: GameRecord | null = null;

    // 1. Direct Cloud Firestore join (Cross-device, Vercel & mobile instant sync)
    try {
      const docRef = doc(firestore, 'games', gameId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const existingData = snap.data() as GameRecord;
        if (existingData.black_user_id && existingData.black_user_id !== blackUserId) {
          throw new Error('This room already has two players.');
        }
        joinedGame = {
          ...existingData,
          black_user_id: blackUserId,
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        await setDoc(docRef, joinedGame, { merge: true });
      }
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `games/${gameId}`);
      }
      if (err instanceof Error && err.message.includes('already has two players')) {
        throw err;
      }
      console.warn('Firestore direct join error:', err);
    }

    // 2. Try server API if Express server is active
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blackUserId }),
      });
      if (res.ok) {
        const serverGame = (await res.json()) as GameRecord;
        if (!joinedGame) joinedGame = serverGame;
      }
    } catch {
      // Server optional on static hosting like Vercel
    }

    // 3. Fallback to Supabase if configured
    if (!joinedGame && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('games')
          .update({
            black_user_id: blackUserId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', gameId)
          .select()
          .single();
        if (!error && data) joinedGame = data as GameRecord;
      } catch (err) {
        console.warn('Supabase joinGame error:', err);
      }
    }

    // 4. Fallback local store
    if (!joinedGame) {
      const games = getLocalGames();
      const game = games[gameId];
      if (game) {
        game.black_user_id = blackUserId;
        game.status = 'active';
        game.updated_at = new Date().toISOString();
        games[gameId] = game;
        joinedGame = game;
      }
    }

    // 5. Cache locally & broadcast updates
    if (joinedGame) {
      const games = getLocalGames();
      games[gameId] = joinedGame;
      saveLocalGames(games);
      notifyLocalGameSubscribers(joinedGame);

      // Keep server memory primed if available
      fetch('/api/games/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinedGame),
      }).catch(() => {});
    }

    return joinedGame;
  },

  async getGame(gameId: string): Promise<GameRecord | null> {
    // 1. Try Firestore first
    try {
      const snap = await getDoc(doc(firestore, 'games', gameId));
      if (snap.exists()) {
        const game = snap.data() as GameRecord;
        const games = getLocalGames();
        games[game.id] = game;
        saveLocalGames(games);
        return game;
      }
    } catch {
      // Fallback
    }

    // 2. Try server API
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
      if (res.ok) {
        const game = (await res.json()) as GameRecord;
        const games = getLocalGames();
        games[game.id] = game;
        saveLocalGames(games);
        return game;
      }
    } catch {
      // Fallback
    }

    // 3. Try Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
        if (!error && data) return data as GameRecord;
      } catch {
        // Fallback
      }
    }

    // 4. Fallback to local store
    const games = getLocalGames();
    return games[gameId] || null;
  },

  async updateGameState(params: {
    gameId: string;
    fen: string;
    whiteAura: number;
    blackAura: number;
    status?: 'waiting' | 'active' | 'finished';
    winnerId?: string | null;
  }): Promise<GameRecord | null> {
    const updatePayload: Partial<GameRecord> = {
      fen: params.fen,
      white_aura: params.whiteAura,
      black_aura: params.blackAura,
      updated_at: new Date().toISOString(),
    };
    if (params.status) updatePayload.status = params.status;
    if (params.winnerId !== undefined) updatePayload.winner_id = params.winnerId;

    let updatedGame: GameRecord | null = null;

    // 1. Direct Firestore write (Universal cloud persistence)
    try {
      const docRef = doc(firestore, 'games', params.gameId);
      await setDoc(docRef, updatePayload, { merge: true });
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        updatedGame = snap.data() as GameRecord;
      }
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.UPDATE, `games/${params.gameId}`);
      }
      console.warn('Firestore updateGameState warning:', err);
    }

    // 2. Try server API if present
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(params.gameId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (res.ok) {
        const serverGame = (await res.json()) as GameRecord;
        if (!updatedGame) updatedGame = serverGame;
      }
    } catch {
      // server optional
    }

    // 3. Try Supabase
    if (!updatedGame && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('games')
          .update(updatePayload)
          .eq('id', params.gameId)
          .select()
          .single();
        if (!error && data) updatedGame = data as GameRecord;
      } catch (err) {
        console.warn('Supabase updateGameState error:', err);
      }
    }

    // 4. Fallback to local store
    if (!updatedGame) {
      const games = getLocalGames();
      if (games[params.gameId]) {
        updatedGame = { ...games[params.gameId], ...updatePayload };
      }
    }

    // 5. Update local cache and notify subscribers
    if (updatedGame) {
      const games = getLocalGames();
      games[params.gameId] = updatedGame;
      saveLocalGames(games);
      notifyLocalGameSubscribers(updatedGame);
    }

    return updatedGame;
  },

  subscribeToGame(gameId: string, onUpdate: GameSubscriptionCallback): () => void {
    // 1. Register local event listener
    if (!activeSubscriptions.has(gameId)) {
      activeSubscriptions.set(gameId, new Set());
    }
    activeSubscriptions.get(gameId)!.add(onUpdate);

    // 2. Server-Sent Events (SSE) stream for instant real-time sync across any device
    let eventSource: EventSource | null = null;
    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        eventSource = new EventSource(`/api/games/${encodeURIComponent(gameId)}/stream`);
        eventSource.onmessage = (event) => {
          try {
            const gameData = JSON.parse(event.data);
            if (gameData && gameData.id === gameId) {
              onUpdate(gameData as GameRecord);
            }
          } catch (err) {
            console.error('Error parsing SSE game update:', err);
          }
        };
        eventSource.onerror = () => {
          // SSE reconnects automatically
        };
      } catch (err) {
        console.warn('Could not establish SSE:', err);
      }
    }

    // 3. Firestore onSnapshot real-time listener
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      unsubscribeFirestore = onSnapshot(
        doc(firestore, 'games', gameId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as GameRecord;
            const games = getLocalGames();
            games[gameId] = data;
            saveLocalGames(games);
            onUpdate(data);
          }
        },
        (error) => {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
          } else {
            console.warn('Firestore snapshot error:', error);
          }
        }
      );
    } catch (err) {
      console.warn('Firestore subscription error:', err);
    }

    // 4. Fallback periodic polling every 2.5 seconds to guarantee sync even on mobile background tabs
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
        if (res.ok) {
          const game = (await res.json()) as GameRecord;
          onUpdate(game);
          return;
        }
      } catch {
        // Ignore polling errors
      }
      try {
        const snap = await getDoc(doc(firestore, 'games', gameId));
        if (snap.exists()) {
          const fresh = snap.data() as GameRecord;
          onUpdate(fresh);
        }
      } catch {
        // Ignore
      }
    }, 2500);

    // 5. Supabase Realtime channel if configured
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel(`game:${gameId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'games',
              filter: `id=eq.${gameId}`,
            },
            (payload) => {
              if (payload.new) {
                onUpdate(payload.new as GameRecord);
              }
            }
          )
          .subscribe();
      } catch {
        // Ignore
      }
    }

    // Cleanup when component unmounts
    return () => {
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      const subs = activeSubscriptions.get(gameId);
      if (subs) {
        subs.delete(onUpdate);
        if (subs.size === 0) activeSubscriptions.delete(gameId);
      }
      if (channel && isSupabaseConfigured) {
        supabase.removeChannel(channel);
      }
    };
  },
};
