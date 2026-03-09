import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from '@clerk/clerk-react';
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
  const { isSignedIn } = useAuth();
  const clearSession = useSessionStore((s) => s.clearSession);

  // Clear Zustand store whenever the user signs out (handles UserButton sign-out)
  useEffect(() => {
    if (isSignedIn === false) clearSession();
  }, [isSignedIn, clearSession]);

  return (
    <>
      <SignedIn>
        <div className="flex flex-col h-screen">
          <div className="flex justify-end items-center px-4 h-12 border-b border-zinc-800 bg-zinc-900 absolute top-0 right-0 left-0 z-10">
            <UserButton />
          </div>
          <AppShell />
        </div>
      </SignedIn>
      <SignedOut>
        <DemoChat onSignInClick={() => setIsModalOpen(true)} />
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </SignedOut>
    </>
  );
}

export default App;
