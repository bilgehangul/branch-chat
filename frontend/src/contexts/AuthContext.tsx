// frontend/src/contexts/AuthContext.tsx
// Google OAuth authentication via @react-oauth/google.
// Stores Google ID token in localStorage; provides getToken for API authorization.
import { createContext, useContext, useState, useCallback } from 'react';
import { clearApiKey } from '../utils/cryptoStorage';

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

// Check if a JWT is expired by reading the exp claim
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat decode failure as expired
  }
}

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
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored;
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored || isTokenExpired(stored)) return null;
    return decodeGoogleToken(stored);
  });

  const signIn = useCallback((credential: string) => {
    localStorage.setItem(TOKEN_KEY, credential);
    setToken(credential);
    setUser(decodeGoogleToken(credential));
  }, []);

  const signOut = useCallback(() => {
    // Clear encrypted BYOK key from localStorage before removing auth state (PROV-14)
    const currentUser = user;
    if (currentUser?.sub) {
      clearApiKey(currentUser.sub);
      localStorage.removeItem(`byok_settings_${currentUser.sub}`);
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [user]);

  // Async getToken for API authorization header — auto-clears expired tokens
  const getToken = useCallback(async () => {
    if (token && isTokenExpired(token)) {
      signOut();
      return null;
    }
    return token;
  }, [token, signOut]);

  // GoogleOAuthProvider is in main.tsx (outside StrictMode to avoid double-init)
  return (
    <AuthContext.Provider value={{ isSignedIn: !!token, user, token, getToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
