'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'customer' | 'vendor') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Glimore Member',
              role: 'customer',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
            setUser(newProfile);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn('[auth] Session cookie creation failed:', body.error || res.status);
        }
      } catch (sessionErr) {
        console.warn('[auth] Session API unreachable:', sessionErr);
      }
    } catch (e: any) {
      setLoading(false);
      throw new Error(e.message || 'Login failed');
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: 'customer' | 'vendor' = 'customer'
  ) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email,
        displayName: name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        vendorId: role === 'vendor' ? `vendor-${credential.user.uid.slice(0, 6)}` : undefined,
      };

      await setDoc(doc(db, 'users', credential.user.uid), newProfile);

      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn('[auth] Session cookie creation failed:', body.error || res.status);
        }
      } catch (sessionErr) {
        console.warn('[auth] Session API unreachable:', sessionErr);
      }
    } catch (e: any) {
      setLoading(false);
      throw new Error(e.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUser(null);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
