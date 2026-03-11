// frontend/src/components/history/SessionHistory.tsx
// Lists the user's previous chat sessions as a folder-style tree.
// Active session shows child threads (depth > 0) indented beneath it.
import type { SessionListItem } from '../../api/sessions';
import type { Thread } from '../../types/index';

interface SessionHistoryProps {
  sessions: SessionListItem[];
  onLoadSession: (sessionId: string) => void;
  currentSessionId: string | null;
  threads?: Record<string, Thread>;
  onNavigateThread?: (threadId: string) => void;
}

export function SessionHistory({
  sessions,
  onLoadSession,
  currentSessionId,
  threads,
  onNavigateThread,
}: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-stone-500 dark:text-slate-500 px-3 py-2">
        No previous sessions
      </div>
    );
  }

  // Collect child threads (depth > 0) for the active session
  const childThreads: Thread[] = [];
  if (threads) {
    for (const t of Object.values(threads)) {
      if (t.depth > 0) {
        childThreads.push(t);
      }
    }
    // Threads are in insertion order from the store (oldest first)
  }

  return (
    <nav aria-label="Session history">
      <ul className="space-y-1 px-2">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const date = new Date(session.lastActivityAt).toLocaleDateString();
          return (
            <li key={session.id}>
              <button
                onClick={() => onLoadSession(session.id)}
                className={[
                  'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                  isActive
                    ? 'bg-stone-200 dark:bg-zinc-700 font-medium'
                    : 'hover:bg-stone-100 dark:hover:bg-zinc-800',
                ].join(' ')}
                title={session.title}
              >
                <div className="truncate">{session.title}</div>
                <div className="text-xs text-stone-400 dark:text-slate-500">{date}</div>
              </button>
              {/* Show child threads for active session */}
              {isActive && childThreads.length > 0 && (
                <ul className="ml-2 mt-1 space-y-0.5">
                  {childThreads.map((thread) => (
                    <li key={thread.id}>
                      <button
                        onClick={() => onNavigateThread?.(thread.id)}
                        className="w-full text-left pl-4 pr-2 py-1 rounded text-xs text-stone-600 dark:text-slate-400 truncate hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                        title={thread.title}
                      >
                        <span className="truncate block">- {thread.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
