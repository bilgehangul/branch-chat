import { useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignOutButton, UserButton } from '@clerk/clerk-react';
import { AppShell } from './components/layout/AppShell';
import { DemoChat } from './components/demo/DemoChat';

// Will be created in Plan 02 — store/sessionStore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _useSessionStore: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _useSessionStore = require('./store/sessionStore').useSessionStore;
} catch {
  _useSessionStore = () => ({ clearSession: () => {} });
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
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

function LogoutButton() {
  const clearSession = _useSessionStore((s: { clearSession: () => void }) => s.clearSession);

  return (
    <SignOutButton>
      <button
        onClick={() => clearSession()}
        className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-md transition-colors"
      >
        Sign out
      </button>
    </SignOutButton>
  );
}

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SignedIn>
        <div className="flex flex-col h-screen">
          <div className="flex justify-end items-center px-4 h-12 border-b border-zinc-800 bg-zinc-900 absolute top-0 right-0 left-0 z-10">
            <div className="flex items-center gap-2">
              <UserButton />
              <LogoutButton />
            </div>
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
