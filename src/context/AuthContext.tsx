
"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  SessionProvider,
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from 'next-auth/react';

export interface AuthUser {
  uid: string;
  email: string | null | undefined;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authError: Error | null;
  setAuthError: React.Dispatch<React.SetStateAction<Error | null>>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

function InnerAuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState<Error | null>(null);

  const user: AuthUser | null = session?.user
    ? {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.name,
        photoURL: session.user.image,
      }
    : null;

  const loading = status === 'loading';

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      const error = new Error('Invalid email or password.');
      setAuthError(error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = new Error(body.error || 'Failed to create account.');
      setAuthError(error);
      throw error;
    }
    await signIn(email, password);
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    await nextAuthSignIn('google');
  };

  const doSignOut = async () => {
    setAuthError(null);
    await nextAuthSignOut({ redirect: false });
  };

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      authError,
      setAuthError,
      signOut: doSignOut,
      signIn,
      signUp,
      signInWithGoogle,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, loading, authError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
