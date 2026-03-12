import { useEffect, useRef, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SettingsModal } from './components/settings/SettingsModal';
import { AppShell } from './components/layout/AppShell';
import { DemoAppShell } from './components/demo/DemoAppShell';
import { useSessionStore } from './store/sessionStore';
import { SignInButton } from './components/auth/SignInButton';
import { fetchSessions, loadSession, createSessionOnBackend } from './api/sessions';
import type { SessionListItem } from './api/sessions';
import type { Thread, Message } from './types/index';
import { DEMO_SESSION, DEMO_THREADS, DEMO_MESSAGES, DEMO_ROOT_THREAD_ID } from './components/demo/demoData';

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
        <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-100">Sign in to ContextDive Chat</h2>
        <SignInButton />
      </div>
    </div>
  );
}

function AppInner() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [sessionsList, setSessionsList] = useState<SessionListItem[]>([]);
  const { isSignedIn, user, signOut, getToken } = useAuth();
  const session = useSessionStore((s) => s.session);
  const createSession = useSessionStore((s) => s.createSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  // On sign-in: fetch session history, hydrate from most recent or create new session
  useEffect(() => {
    if (!isSignedIn || !user?.sub) return;

    const initSession = async () => {
      const sessions = await fetchSessions(getToken);
      setSessionsList(sessions);

      if (sessions.length > 0) {
        // Load the most recent session
        const latest = sessions[0]!;
        const data = await loadSession(latest.id, getToken);
        if (data) {
          const threadsRecord: Record<string, Thread> = {};
          for (const t of data.threads) {
            threadsRecord[t.id] = {
              ...t,
              depth: t.depth as 0 | 1 | 2 | 3 | 4,
            };
          }
          const messagesRecord: Record<string, Message> = {};
          for (const m of data.messages) {
            messagesRecord[m.id] = {
              ...m,
              annotations: m.annotations as Message['annotations'],
              childLeads: m.childLeads as Message['childLeads'],
            };
          }
          useSessionStore.getState().hydrateSession({
            session: data.session,
            threads: threadsRecord,
            messages: messagesRecord,
            activeThreadId: data.threads.find(t => t.depth === 0)?.id ?? null,
          });
        } else {
          // Failed to load — fall back to new in-memory session
          createSession(user.sub);
        }
      } else {
        // No prior sessions — create fresh session in Zustand and on backend
        createSession(user.sub);
        // Wait a tick for Zustand state to update
        setTimeout(async () => {
          const storeState = useSessionStore.getState();
          const storeSession = storeState.session;
          if (storeSession) {
            const rootThread = Object.values(storeState.threads).find(t => t.depth === 0);
            if (rootThread) {
              await createSessionOnBackend(
                { sessionId: storeSession.id, rootThreadId: rootThread.id },
                getToken
              );
            }
          }
        }, 0);
      }
    };

    void initSession();
  }, [isSignedIn, user?.sub]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear Zustand store on sign-out
  useEffect(() => {
    if (!isSignedIn) {
      clearSession();
      setSessionsList([]);
    }
  }, [isSignedIn, clearSession]);

  // Close sign-in modal when user signs in
  useEffect(() => {
    if (isSignedIn) setIsSignInModalOpen(false);
  }, [isSignedIn]);

  // Hydrate Zustand store with demo data when not signed in
  const demoHydratedRef = useRef(false);
  useEffect(() => {
    if (isSignedIn) {
      demoHydratedRef.current = false;
      return;
    }
    // Only hydrate when store is empty (no session) and not already hydrated
    const storeSession = useSessionStore.getState().session;
    if (!storeSession && !demoHydratedRef.current) {
      demoHydratedRef.current = true;
      useSessionStore.getState().hydrateSession({
        session: DEMO_SESSION,
        threads: DEMO_THREADS,
        messages: DEMO_MESSAGES,
        activeThreadId: DEMO_ROOT_THREAD_ID,
      });
    }
  }, [isSignedIn]);

  // Load a session from history
  const handleLoadSession = async (sessionId: string) => {
    const data = await loadSession(sessionId, getToken);
    if (!data) return;

    const threadsRecord: Record<string, Thread> = {};
    for (const t of data.threads) {
      threadsRecord[t.id] = {
        ...t,
        depth: t.depth as 0 | 1 | 2 | 3 | 4,
      };
    }
    const messagesRecord: Record<string, Message> = {};
    for (const m of data.messages) {
      messagesRecord[m.id] = {
        ...m,
        annotations: m.annotations as Message['annotations'],
        childLeads: m.childLeads as Message['childLeads'],
      };
    }
    useSessionStore.getState().hydrateSession({
      session: data.session,
      threads: threadsRecord,
      messages: messagesRecord,
      activeThreadId: data.threads.find(t => t.depth === 0)?.id ?? null,
    });

    // Refresh session list to pick up any title changes from backend
    const updatedSessions = await fetchSessions(getToken);
    setSessionsList(updatedSessions);
  };

  // Start a new chat: clear current session, create fresh one, persist to backend, refresh list
  const handleNewChat = async () => {
    if (!user?.sub) return;
    clearSession();
    createSession(user.sub);
    // Wait a tick for Zustand state to update
    await new Promise(resolve => setTimeout(resolve, 0));
    const storeState = useSessionStore.getState();
    const storeSession = storeState.session;
    if (storeSession) {
      const rootThread = Object.values(storeState.threads).find(t => t.depth === 0);
      if (rootThread) {
        await createSessionOnBackend(
          { sessionId: storeSession.id, rootThreadId: rootThread.id },
          getToken
        );
      }
    }
    // Refresh session list
    const updatedSessions = await fetchSessions(getToken);
    setSessionsList(updatedSessions);
  };

  // Remove a session from the local list (after backend delete)
  const handleRemoveSession = (sessionId: string) => {
    setSessionsList(prev => prev.filter(s => s.id !== sessionId));
  };

  if (isSignedIn) {
    return (
      <AppShell
        onSignOut={signOut}
        user={user}
        sessions={sessionsList}
        currentSessionId={session?.id ?? null}
        onLoadSession={handleLoadSession}
        onNewChat={handleNewChat}
        onRemoveSession={handleRemoveSession}
      />
    );
  }

  return (
    <>
      <DemoAppShell onSignInClick={() => setIsSignInModalOpen(true)} />
      <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
    </>
  );
}

export function App() {
  const { user } = useAuth();
  return (
    <SettingsProvider userId={user?.sub ?? null}>
      <SettingsModal />
      <AppInner />
    </SettingsProvider>
  );
}

export default App;
