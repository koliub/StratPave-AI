
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
  UserCredential
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // Ensure auth and db are correctly initialized and exported

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: AuthError | null;
  setAuthError: React.Dispatch<React.SetStateAction<AuthError | null>>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserCredential | void>;
  signUp: (email: string, password: string) => Promise<UserCredential | void>;
  signInWithGoogle: () => Promise<UserCredential | void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const handleUserInFirestore = async (firebaseUser: User) => {
    if (!firebaseUser) return;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user document
      try {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error creating user document in Firestore:", error);
        // Optionally set an error state here for UI feedback
      }
    } else {
      // Update existing user document (e.g., lastLogin)
      try {
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating user document in Firestore:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await handleUserInFirestore(firebaseUser);
      }
      setLoading(false);
      setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will call handleUserInFirestore
      return userCredential;
    } catch (error) {
      setAuthError(error as AuthError);
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will call handleUserInFirestore
      return userCredential;
    } catch (error) {
      setAuthError(error as AuthError);
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      // onAuthStateChanged will call handleUserInFirestore
      return userCredential;
    } catch (error) {
      setAuthError(error as AuthError);
      console.error("Google sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      // setUser(null) handled by onAuthStateChanged
    } catch (error) {
      setAuthError(error as AuthError);
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const contextValue = React.useMemo(() => ({
    user,
    loading,
    authError,
    setAuthError,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
  }), [user, loading, authError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
