import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, ProfileRecord } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  profile: ProfileRecord | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInAsGuest: (customName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export function formatFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address format is invalid.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify your credentials and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily restricted. Please wait a moment.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return (error as Error)?.message || 'Authentication operation failed.';
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInAsGuest: async () => {},
  signOut: async () => {},
  updateDisplayName: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from Firestore or local fallback
  const syncProfile = async (uId: string, email: string, displayName?: string) => {
    try {
      const prof = await db.upsertProfile({
        id: uId,
        email,
        display_name: displayName || email.split('@')[0] || 'Sorcerer',
      });
      setProfile(prof);
    } catch (err) {
      console.warn('Failed to sync profile:', err);
    }
  };

  // Firebase auth state observer
  useEffect(() => {
    let unsubscribeProfileListener: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      if (unsubscribeProfileListener) {
        unsubscribeProfileListener();
        unsubscribeProfileListener = null;
      }

      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        const isGuest = currentFirebaseUser.isAnonymous;
        const email = currentFirebaseUser.email || (isGuest ? `guest_${currentFirebaseUser.uid.slice(0, 6)}@chinna.chess` : 'sorcerer@chinna.chess');
        const displayName = currentFirebaseUser.displayName || (isGuest ? 'Guest Grandmaster' : email.split('@')[0]);

        const authU: AuthUser = {
          id: currentFirebaseUser.uid,
          email,
          displayName,
          isGuest,
        };
        setUser(authU);

        // Ensure baseline profile exists in Cloud Firestore
        await syncProfile(currentFirebaseUser.uid, email, displayName);

        // Subscribe to real-time Cloud Firestore updates for this user's profile
        try {
          const profileDocRef = doc(firestore, 'profiles', currentFirebaseUser.uid);
          unsubscribeProfileListener = onSnapshot(
            profileDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as ProfileRecord);
              }
            },
            (err) => {
              console.warn('Profile snapshot subscription warning:', err);
            }
          );
        } catch (err) {
          console.warn('Firestore subscription init error:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileListener) {
        unsubscribeProfileListener();
      }
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error: Error | null }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;
      const resolvedEmail = fbUser.email || email.trim();
      const resolvedName = fbUser.displayName || resolvedEmail.split('@')[0] || 'Sorcerer';

      const authU: AuthUser = {
        id: fbUser.uid,
        email: resolvedEmail,
        displayName: resolvedName,
        isGuest: false,
      };
      setUser(authU);
      await syncProfile(fbUser.uid, resolvedEmail, resolvedName);
      return { error: null };
    } catch (err) {
      const friendlyMessage = formatFirebaseError(err);
      return { error: new Error(friendlyMessage) };
    }
  };

  const signUp = async (email: string, pass: string, displayName?: string): Promise<{ error: Error | null }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;
      const effectiveName = displayName?.trim() || email.trim().split('@')[0] || 'Sorcerer';

      // Update Firebase Auth user profile
      try {
        await firebaseUpdateProfile(fbUser, { displayName: effectiveName });
      } catch {
        // Non-blocking
      }

      const authU: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || email.trim(),
        displayName: effectiveName,
        isGuest: false,
      };
      setUser(authU);

      // Create permanent starting profile document in Cloud Firestore
      await db.upsertProfile({
        id: fbUser.uid,
        email: authU.email,
        display_name: effectiveName,
        domain_expansions: 0,
        domain_area: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        games_played: 0,
        aura_grade: 'Grade 4 Novice',
        recent_domains: [],
      });

      return { error: null };
    } catch (err) {
      const friendlyMessage = formatFirebaseError(err);
      return { error: new Error(friendlyMessage) };
    }
  };

  const signInAsGuest = async (customName = 'Grandmaster Guest') => {
    try {
      const cred = await signInAnonymously(auth);
      const fbUser = cred.user;
      const guestName = `${customName} #${fbUser.uid.slice(-4).toUpperCase()}`;

      try {
        await firebaseUpdateProfile(fbUser, { displayName: guestName });
      } catch {
        // Non-blocking
      }

      const guestUser: AuthUser = {
        id: fbUser.uid,
        email: `guest_${fbUser.uid.slice(0, 6)}@chinna.chess`,
        displayName: guestName,
        isGuest: true,
      };
      setUser(guestUser);
      await syncProfile(fbUser.uid, guestUser.email, guestName);
    } catch (err) {
      console.warn('Anonymous guest sign in error, fallback to local guest session:', err);
      const fallbackId = 'guest_' + Math.random().toString(36).substring(2, 9);
      const guestUser: AuthUser = {
        id: fallbackId,
        email: `${fallbackId}@chinna.chess`,
        displayName: customName,
        isGuest: true,
      };
      setUser(guestUser);
      await syncProfile(fallbackId, guestUser.email, customName);
    }
  };

  const updateDisplayName = async (name: string): Promise<{ error: Error | null }> => {
    if (!auth.currentUser || !user) {
      return { error: new Error('User is not signed in') };
    }
    const cleanName = name.trim();
    if (!cleanName) {
      return { error: new Error('Display name cannot be empty.') };
    }

    try {
      await firebaseUpdateProfile(auth.currentUser, { displayName: cleanName });
      setUser((prev) => (prev ? { ...prev, displayName: cleanName } : null));

      await db.upsertProfile({
        id: user.id,
        email: user.email,
        display_name: cleanName,
      });

      return { error: null };
    } catch (err) {
      return { error: new Error((err as Error)?.message || 'Failed to update name.') };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUser(null);
    setFirebaseUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const latest = await db.getProfile(user.id);
      if (latest) setProfile(latest);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        profile,
        loading,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        updateDisplayName,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
