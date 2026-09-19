import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, db, ProfileRecord } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: ProfileRecord | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null; needsVerification?: boolean }>;
  signUp: (email: string, pass: string) => Promise<{ error: Error | null; needsVerification?: boolean }>;
  signInAsGuest: (customName?: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInAsGuest: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

const DEMO_USER_KEY = 'chinnas_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserProfile = async (uId: string, email: string) => {
    try {
      const prof = await db.upsertProfile({ id: uId, email });
      setProfile(prof);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data?.session) {
          setSession(data.session);
          const u: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email || 'player@chinna.chess',
          };
          setUser(u);
          await loadUserProfile(u.id, u.email);
        } else {
          checkSavedGuestUser();
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          if (newSession?.user) {
            const authU: AuthUser = {
              id: newSession.user.id,
              email: newSession.user.email || 'player@chinna.chess',
            };
            setUser(authU);
            await loadUserProfile(authU.id, authU.email);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        setLoading(false);
        return () => {
          listener?.subscription.unsubscribe();
        };
      } else {
        checkSavedGuestUser();
        setLoading(false);
      }
    }

    function checkSavedGuestUser() {
      try {
        const saved = localStorage.getItem(DEMO_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as AuthUser;
          setUser(parsed);
          loadUserProfile(parsed.id, parsed.email);
        }
      } catch {
        // Ignore
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      // Demo authentication
      const demoId = 'demo_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
      const demoUser: AuthUser = { id: demoId, email, isGuest: false };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      await loadUserProfile(demoUser.id, demoUser.email);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const authU: AuthUser = { id: data.user.id, email: data.user.email || email };
      setUser(authU);
      await loadUserProfile(authU.id, authU.email);
    }
    return { error: null };
  };

  const signUp = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      // Demo sign up
      const demoId = 'demo_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
      const demoUser: AuthUser = { id: demoId, email, isGuest: false };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      await loadUserProfile(demoUser.id, demoUser.email);
      return { error: null, needsVerification: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (error) {
      return { error };
    }

    // Check if email confirmation is required
    const needsVerification = !data.session && Boolean(data.user);
    if (data.user && !needsVerification) {
      const authU: AuthUser = { id: data.user.id, email: data.user.email || email };
      setUser(authU);
      await loadUserProfile(authU.id, authU.email);
    }
    return { error: null, needsVerification };
  };

  const signInAsGuest = (customName = 'Grandmaster Chinna') => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUser: AuthUser = {
      id: 'guest_' + randomSuffix,
      email: `${customName.toLowerCase().replace(/\s+/g, '')}${randomSuffix}@chinna.chess`,
      isGuest: true,
    };
    setUser(guestUser);
    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(guestUser));
    } catch {
      // Ignore
    }
    loadUserProfile(guestUser.id, guestUser.email);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem(DEMO_USER_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
