import { useAuth } from '../../contexts/AuthContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { ThreadView } from '../thread/ThreadView';
import { BreadcrumbBar } from './BreadcrumbBar';
import { AncestorPeekPanel } from './AncestorPeekPanel';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSessionStore } from '../../store/sessionStore';
import { selectThreadAncestry } from '../../store/selectors';
import { NetworkBanner } from '../ui/NetworkBanner';
import { AuthExpiredBanner } from '../ui/AuthExpiredBanner';
import { SessionHistory } from '../history/SessionHistory';
import type { SessionListItem } from '../../api/sessions';

interface AppShellProps {
  onSignOut: () => void;
  user: AuthUser | null;
  sessions: SessionListItem[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function AppShell({ onSignOut, user, sessions, currentSessionId, onLoadSession, onNewChat }: AppShellProps) {
  const { getToken } = useAuth();
  const threads = useSessionStore(s => s.threads);
  const messages = useSessionStore(s => s.messages);
  const activeThreadId = useSessionStore(s => s.activeThreadId);
  const setActiveThread = useSessionStore(s => s.setActiveThread);
  const deleteThread = useSessionStore(s => s.deleteThread);
  const summarizeThread = useSessionStore(s => s.summarizeThread);
  const compactThread = useSessionStore(s => s.compactThread);

  // Ancestry = [root, ...ancestors, current] — exclude current (last element)
  const ancestry = activeThreadId ? selectThreadAncestry(threads, activeThreadId) : [];
  const ancestors = ancestry.slice(0, -1);

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-slate-100">
      <NetworkBanner />
      <AuthExpiredBanner />

      {/* Session history sidebar — always visible on sm+ screens */}
      <aside className="hidden sm:flex flex-col flex-shrink-0 w-48 border-r border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-stone-500 dark:text-slate-500 uppercase tracking-wide border-b border-stone-100 dark:border-zinc-800">
          Chats
        </div>
        <button
          onClick={onNewChat}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors font-medium"
        >
          + New Chat
        </button>
        <SessionHistory
          sessions={sessions}
          onLoadSession={onLoadSession}
          currentSessionId={currentSessionId}
          threads={threads}
          onNavigateThread={setActiveThread}
        />
      </aside>

      {/* Ancestor peek panels — oldest to newest, left to right */}
      {ancestors.map((thread, idx) => {
        const distFromParent = ancestors.length - 1 - idx;
        const w = distFromParent === 0 ? 180 : distFromParent === 1 ? 110 : 68;
        // The next thread in the ancestry chain tells us which message was selected in this ancestor
        const nextThread = ancestry[idx + 1];
        return (
          <div key={thread.id} className="hidden sm:block flex-shrink-0" style={{ width: w }}>
            <AncestorPeekPanel
              thread={thread}
              allMessages={messages}
              highlightMessageId={nextThread?.parentMessageId ?? undefined}
              childThreadId={nextThread?.id}
              width={w}
              onClick={() => setActiveThread(thread.id)}
              onNavigate={setActiveThread}
              onDelete={deleteThread}
              onSummarize={(threadId) => void summarizeThread(threadId, getToken)}
              onCompact={(threadId) => void compactThread(threadId, getToken)}
            />
          </div>
        );
      })}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header / breadcrumb bar */}
        <header className="h-12 bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-700 flex items-center px-4 flex-shrink-0 gap-2">
          <div className="flex-1 min-w-0">
            <BreadcrumbBar />
          </div>
          <ThemeToggle />
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <span className="text-sm text-stone-600 dark:text-slate-400 truncate max-w-32">
                {user.name}
              </span>
            )}
            <button
              onClick={onSignOut}
              className="text-sm px-3 py-1 rounded bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>
        {/* Thread view fills remaining height */}
        <main className="flex-1 overflow-hidden">
          <ThreadView />
        </main>
      </div>
    </div>
  );
}
