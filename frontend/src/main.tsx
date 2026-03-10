import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { App } from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const isTestEnv = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith('pk_test_placeholder');

// In production PUBLISHABLE_KEY is always a real Clerk key.
// In CI / E2E the placeholder key is used so the Clerk SDK initialises without
// throwing — it only fails when making actual auth network calls, which never
// happen in E2E tests because all /api/* routes are mocked via page.route().
const root = createRoot(document.getElementById('root')!);

if (isTestEnv) {
  root.render(
    <StrictMode>
      <ThemeProvider>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? 'pk_test_placeholder_for_ci_only'}>
          <App />
        </ClerkProvider>
      </ThemeProvider>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <ThemeProvider>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY!}>
          <App />
        </ClerkProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
