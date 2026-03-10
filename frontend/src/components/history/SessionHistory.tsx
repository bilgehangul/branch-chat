// frontend/src/components/history/SessionHistory.tsx
// Lists the user's previous chat sessions (root threads).
// Clicking a session loads it into the Zustand store via onLoadSession callback.
import type { SessionListItem } from '../../api/sessions';

interface SessionHistoryProps {
  sessions: SessionListItem[];
  onLoadSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

export function SessionHistory({ sessions, onLoadSession, currentSessionId }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-stone-500 dark:text-slate-500 px-3 py-2">
        No previous sessions
      </div>
    );
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
