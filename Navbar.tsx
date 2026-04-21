import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot for real-time profile updates (e.g. role changes)
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // New user, wait for role selection
            setProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: null,
              photoURL: user.photoURL,
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  const updateRole = async (role: UserRole) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
