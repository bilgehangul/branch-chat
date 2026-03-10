import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { DemoChat } from './components/demo/DemoChat';
import { useSessionStore } from './store/sessionStore';
import { SignInButton } from './components/auth/SignInButton';

function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-100">Sign in to DeepDive Chat</h2>
        <SignInButton />
      </div>
    </div>
  );
}

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSignedIn, user, signOut } = useAuth();
  const session = useSessionStore((s) => s.session);
  const createSession = useSessionStore((s) => s.createSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  // Initialize in-memory session when user signs in (MongoDB hydration added in Plan 07-04)
  useEffect(() => {
    if (isSignedIn && user?.sub && !session) {
      createSession(user.sub);
    }
  }, [isSignedIn, user?.sub, session, createSession]);

  // Clear Zustand store on sign-out
  useEffect(() => {
    if (!isSignedIn) clearSession();
  }, [isSignedIn, clearSession]);

  // Close modal when user signs in
  useEffect(() => {
    if (isSignedIn) setIsModalOpen(false);
  }, [isSignedIn]);

  if (isSignedIn) {
    return <AppShell onSignOut={signOut} user={user} />;
  }

  return (
    <>
      <DemoChat onSignInClick={() => setIsModalOpen(true)} />
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default App;
