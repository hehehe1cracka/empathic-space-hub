import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { ref, set, onValue, off, serverTimestamp, onDisconnect } from 'firebase/database';
import { auth, database, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  status: 'online' | 'offline';
  lastSeen: number | null;
  createdAt: number;
  safetyMode: boolean;
  dailyUsageLimit: number; // in minutes
  todayUsage: number; // in minutes
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Set up presence system
        const userStatusRef = ref(database, `users/${user.uid}/status`);
        const userLastSeenRef = ref(database, `users/${user.uid}/lastSeen`);
        
        // Set online status
        await set(userStatusRef, 'online');
        
        // Set up disconnect handler
        onDisconnect(userStatusRef).set('offline');
        onDisconnect(userLastSeenRef).set(serverTimestamp());
        
        // Listen for user profile changes
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.val() as UserProfile);
          }
        });
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    
    // Create user profile in RTDB
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      status: 'online',
      lastSeen: null,
      createdAt: Date.now(),
      safetyMode: false,
      dailyUsageLimit: 120, // 2 hours default
      todayUsage: 0,
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, googleProvider);
    
    // Check if user profile exists, if not create one
    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          status: 'online',
          lastSeen: null,
          createdAt: Date.now(),
          safetyMode: false,
          dailyUsageLimit: 120,
          todayUsage: 0,
        });
      }
    }, { onlyOnce: true });
  };

  const logout = async () => {
    if (user) {
      // Set offline status before signing out
      const userStatusRef = ref(database, `users/${user.uid}/status`);
      const userLastSeenRef = ref(database, `users/${user.uid}/lastSeen`);
      await set(userStatusRef, 'offline');
      await set(userLastSeenRef, serverTimestamp());
    }
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, { ...userProfile, ...data });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
