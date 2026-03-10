// frontend/src/contexts/AuthContext.tsx
// Replaces ClerkProvider + useAuth. Backed by Google OAuth via @react-oauth/google.
// Stores Google ID token in localStorage; exposes same getToken signature as Clerk.
import { createContext, useContext, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const TOKEN_KEY = 'google_id_token';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  isSignedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  getToken: () => Promise<string | null>;
  signIn: (credential: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decode JWT payload for display only — authorization is done on the backend
function decodeGoogleToken(credential: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]!));
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string | undefined,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeGoogleToken(stored) : null;
  });

  const signIn = useCallback((credential: string) => {
    localStorage.setItem(TOKEN_KEY, credential);
    setToken(credential);
    setUser(decodeGoogleToken(credential));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Same async signature as Clerk's getToken — no changes needed to api/ layer
  const getToken = useCallback(async () => token, [token]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <AuthContext.Provider value={{ isSignedIn: !!token, user, token, getToken, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
