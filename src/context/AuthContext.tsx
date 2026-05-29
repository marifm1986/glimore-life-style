'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser
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
  simulateRoleChange: (role: 'customer' | 'vendor' | 'admin') => void; // Dev Helper for dashboard previewing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and synchronize state
  useEffect(() => {
    // If we're in mock mode without real firebase credentials, initialize a mock customer
    if (typeof window !== 'undefined' && auth.app.options.apiKey === 'mock-api-key-for-glimore-style') {
      const savedMock = localStorage.getItem('glimore_mock_user');
      if (savedMock) {
        setUser(JSON.parse(savedMock));
      } else {
        const defaultUser: UserProfile = {
          uid: 'mock-customer-123',
          email: 'customer@glimore.style',
          displayName: 'Elena Rostova',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
          shippingAddress: {
            line1: '12 Luxury Boulevard',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'United States'
          }
        };
        setUser(defaultUser);
        localStorage.setItem('glimore_mock_user', JSON.stringify(defaultUser));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch custom profile details from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // Document doesn't exist yet, construct profile from auth record
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Glimore Valued Customer',
              role: 'customer',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
            setUser(newProfile);
          }
        } catch (e) {
          console.error("Error fetching user profile: ", e);
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
      if (auth.app.options.apiKey === 'mock-api-key-for-glimore-style') {
        // Simulating mock accounts for different users
        let mockRole: 'customer' | 'vendor' | 'admin' = 'customer';
        let mockName = 'Elena Rostova';
        let vendorId = undefined;

        if (email.includes('admin')) {
          mockRole = 'admin';
          mockName = 'Super Admin';
        } else if (email.includes('vendor')) {
          mockRole = 'vendor';
          mockName = 'Velasco Leatherworks';
          vendorId = 'vendor-velasco-99';
        }

        const simulatedUser: UserProfile = {
          uid: `mock-${mockRole}-uid`,
          email,
          displayName: mockName,
          role: mockRole,
          vendorId,
          createdAt: new Date(),
          updatedAt: new Date(),
          shippingAddress: {
            line1: '12 Luxury Boulevard',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'United States'
          }
        };

        setUser(simulatedUser);
        localStorage.setItem('glimore_mock_user', JSON.stringify(simulatedUser));
        
        // Setup secure session cookie mock
        document.cookie = `session=mock-session-cookie-token-${mockRole}; path=/; max-age=432000;`;
        setLoading(false);
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // Exchange ID token for server-side HTTP-only session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // User state will update via onAuthStateChanged
    } catch (e: any) {
      setLoading(false);
      throw new Error(e.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string, role: 'customer' | 'vendor' = 'customer') => {
    setLoading(true);
    try {
      if (auth.app.options.apiKey === 'mock-api-key-for-glimore-style') {
        const simulatedUser: UserProfile = {
          uid: `mock-${role}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          displayName: name,
          role,
          vendorId: role === 'vendor' ? `vendor-${Math.random().toString(36).substr(2, 5)}` : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(simulatedUser);
        localStorage.setItem('glimore_mock_user', JSON.stringify(simulatedUser));
        document.cookie = `session=mock-session-cookie-token-${role}; path=/; max-age=432000;`;
        setLoading(false);
        return;
      }

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

      // Write registration claims to Firestore database
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);

      // Exchange token for session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } catch (e: any) {
      setLoading(false);
      throw new Error(e.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (auth.app.options.apiKey === 'mock-api-key-for-glimore-style') {
        localStorage.removeItem('glimore_mock_user');
        setUser(null);
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        setLoading(false);
        return;
      }

      await fbSignOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUser(null);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      console.error('Logout error:', e);
    }
  };

  const simulateRoleChange = (targetRole: 'customer' | 'vendor' | 'admin') => {
    if (!user) return;
    const updated = {
      ...user,
      role: targetRole,
      displayName: targetRole === 'admin' ? 'Super Admin' : targetRole === 'vendor' ? 'Velasco Leatherworks' : 'Elena Rostova',
      vendorId: targetRole === 'vendor' ? 'vendor-velasco-99' : undefined
    };
    setUser(updated);
    localStorage.setItem('glimore_mock_user', JSON.stringify(updated));
    document.cookie = `session=mock-session-cookie-token-${targetRole}; path=/; max-age=432000;`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, simulateRoleChange }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
