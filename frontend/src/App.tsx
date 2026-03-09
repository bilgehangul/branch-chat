import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { AppShell } from './components/layout/AppShell';
import { DemoChat } from './components/demo/DemoChat';
import { useSessionStore } from './store/sessionStore';

function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSignedIn, userId } = useAuth();
  const session = useSessionStore((s) => s.session);
  const createSession = useSessionStore((s) => s.createSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  // Initialize session when user signs in
  useEffect(() => {
    if (isSignedIn && userId && !session) {
      createSession(userId);
    }
  }, [isSignedIn, userId, session, createSession]);

  // Clear Zustand store whenever the user signs out (handles UserButton sign-out)
  useEffect(() => {
    if (isSignedIn === false) clearSession();
  }, [isSignedIn, clearSession]);

  return (
    <>
      <SignedIn>
        <AppShell />
      </SignedIn>
      <SignedOut>
        <DemoChat onSignInClick={() => setIsModalOpen(true)} />
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </SignedOut>
    </>
  );
}

export default App;
