
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
    console.log("Firestore: handleUserInFirestore started for user:", firebaseUser.uid);
    if (!firebaseUser) {
      console.log("Firestore: handleUserInFirestore received null user.");
      return;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    
    try {
      console.log("Firestore: Attempting getDoc for user:", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      console.log("Firestore: getDoc finished for user:", firebaseUser.uid, "Exists:", userSnap.exists());

      if (!userSnap.exists()) {
        // Create new user document
        console.log("Firestore: Creating new user document for", firebaseUser.uid);
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log("Firestore: New user document created for", firebaseUser.uid);
      } else {
        // Update existing user document (e.g., lastLogin)
        console.log("Firestore: Updating lastLogin for user", firebaseUser.uid);
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        console.log("Firestore: User document updated for", firebaseUser.uid);
      }
    } catch (error) {
      console.error("Firestore: Error in handleUserInFirestore for user", firebaseUser.uid, ":", error);
      // Decide if this error should affect the loading state. Probably not blocking setLoading(false).
    }
     console.log("Firestore: handleUserInFirestore finished for user:", firebaseUser.uid);
  };

  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    const startTime = performance.now(); // Start timing

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const authStateChangedTime = performance.now();
      console.log(`AuthContext: onAuthStateChanged fired at ${authStateChangedTime.toFixed(2)}ms. User:`, firebaseUser ? firebaseUser.uid : null);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log("AuthContext: User logged in, starting Firestore operation.");
        try {
          await handleUserInFirestore(firebaseUser);
        } catch (error) {
           console.error("AuthContext: Error in handleUserInFirestore within onAuthStateChanged", error);
        }
      }
      
      const endTime = performance.now(); // End timing
      console.log("AuthContext: Setting loading to false.");
      setLoading(false);
      setAuthError(null);
      console.log(`AuthContext: Loading transition finished at ${endTime.toFixed(2)}ms. Total time: ${(endTime - startTime).toFixed(2)}ms`);
    });
    return () => {
      console.log("AuthContext: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    console.log("AuthContext: Attempting sign up.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Sign up successful.");
      return userCredential;
    } catch (error) {
      console.error("AuthContext: Sign up error:", error);
      setAuthError(error as AuthError);
      throw error;
    } finally {
      console.log("AuthContext: Sign up process finished.");
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    console.log("AuthContext: Attempting sign in.");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Sign in successful.");
      return userCredential;
    } catch (error) {
      console.error("AuthContext: Sign in error:", error);
      setAuthError(error as AuthError);
      throw error;
    } finally {
       console.log("AuthContext: Sign in process finished.");
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    setLoading(true);
    setAuthError(null);
    console.log("AuthContext: Attempting Google sign in.");
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      console.log("AuthContext: Google sign in successful.");
      return userCredential;
    } catch (error) {
      console.error("AuthContext: Google sign in error:", error);
      setAuthError(error as AuthError);
      throw error;
    } finally {
      console.log("AuthContext: Google sign in process finished.");
    }
  };

  const signOut = async () => {
    setAuthError(null);
    console.log("AuthContext: Attempting sign out.");
    try {
      await firebaseSignOut(auth);
      console.log("AuthContext: Sign out successful.");
    } catch (error) {
      console.error("AuthContext: Error signing out:", error);
      setAuthError(error as AuthError);
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
