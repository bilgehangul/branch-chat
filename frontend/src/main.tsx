// frontend/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { App } from './App';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
if (!googleClientId) {
  console.warn('[main] VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work');
}

// GoogleOAuthProvider is OUTSIDE StrictMode to prevent double-initialization
// of Google's Identity Services script, which causes duplicate popups.
createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  </GoogleOAuthProvider>
);
