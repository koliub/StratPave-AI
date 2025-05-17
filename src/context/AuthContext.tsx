// src/context/AuthContext.tsx
"use client"; // This is a Client Component

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Assuming you'll use Firestore too
// Assuming you have your Firebase app initialized in a separate file
// import { firebaseApp } from '../lib/firebase'; // Adjust the import path as necessary

// Get Firebase instances (ensure firebaseApp is initialized elsewhere)
const auth = getAuth(); // If you initialized with an app: getAuth(firebaseApp);
const db = getFirestore(); // If you initialized with an app: getFirestore(firebaseApp);


// Define the shape of our Auth Context
interface AuthContextType {
  user: User | null; // null when signed out, User object when signed in
  loading: boolean; // true while checking auth state
  // authError: Error | null; // Optional: Add for handling auth errors
  signOut: () => Promise<void>; // Function to sign the user out
  signIn: (email: string, password: string) => Promise<void>; // Added signIn function
  signUp: (email: string, password: string) => Promise<void>; // Added signUp function
}

// Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as we check auth state
  // const [authError, setAuthError] = useState<Error | null>(null); // Optional

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Auth state is now known
      // setAuthError(null); // Clear any previous error on state change
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs only once on mount

  // Implement the signOut function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // setUser(null); // onAuthStateChanged listener will handle setting user to null
      // setAuthError(null); // Clear errors on successful sign out
    } catch (error: any) { // Use 'any' or a more specific type for error if known
      console.error("Error signing out:", error);
      // setAuthError(error); // Set error state
      throw error; // Re-throw to allow components using signOut to catch
    }
  };

  // Add placeholder functions for sign in/up for now
  // You will implement these later with your chosen methods (email/password, Google, etc.)
  const signIn = async (email: string, password: string) => {
      console.log("Sign In called with:", email, password);
      // Implement Firebase sign in logic here
  };

  const signUp = async (email: string, password: string) => {
      console.log("Sign Up called with:", email, password);
      // Implement Firebase sign up logic here
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    loading,
    // authError, // Include error if added
    signOut,
    signIn,
    signUp,
  }), [user, loading, signOut, signIn, signUp]); // Add authError, signIn, signUp to deps array if included

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
