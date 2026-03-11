// frontend/src/components/history/SessionHistory.tsx
// Lists the user's previous chat sessions as a folder-style tree.
// Active session shows child threads hierarchically nested beneath the root.
import type { SessionListItem } from '../../api/sessions';
import type { Thread } from '../../types/index';

interface SessionHistoryProps {
  sessions: SessionListItem[];
  onLoadSession: (sessionId: string) => void;
  currentSessionId: string | null;
  threads?: Record<string, Thread>;
  onNavigateThread?: (threadId: string) => void;
}

/**
 * Recursive component that renders a thread and its children with indentation.
 */
function ThreadNode({
  thread,
  threads,
  onNavigateThread,
}: {
  thread: Thread;
  threads: Record<string, Thread>;
  onNavigateThread?: (threadId: string) => void;
}) {
  // Indentation increases with depth: depth 1 = pl-4, depth 2 = pl-6, depth 3 = pl-8, depth 4 = pl-10
  const paddingLeft = thread.depth * 2 + 2; // depth 1 -> pl-4, depth 2 -> pl-6, etc.
  const plClass = `pl-${paddingLeft}`;

  // Resolve children from childThreadIds
  const children = thread.childThreadIds
    .map((id) => threads[id])
    .filter(Boolean);

  return (
    <>
      <li>
        <button
          onClick={() => onNavigateThread?.(thread.id)}
          className={`w-full text-left ${plClass} pr-2 py-1 rounded text-xs text-stone-600 dark:text-slate-400 truncate hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors`}
          title={thread.title}
        >
          <span className="truncate block">
            {'\u2514'} {thread.title}
          </span>
        </button>
      </li>
      {children.map((child) => (
        <ThreadNode
          key={child.id}
          thread={child}
          threads={threads}
          onNavigateThread={onNavigateThread}
        />
      ))}
    </>
  );
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

  // Build hierarchical tree: find root threads (depth === 0) for active session
  const rootThreads: Thread[] = [];
  if (threads) {
    for (const t of Object.values(threads)) {
      if (t.depth === 0) {
        rootThreads.push(t);
      }
    }
  }

  // For the active session, get the live title from the Zustand root thread
  const liveRootThread = rootThreads.length > 0 ? rootThreads[0] : null;
  const liveTitle =
    liveRootThread &&
    liveRootThread.title &&
    liveRootThread.title !== 'New chat'
      ? liveRootThread.title
      : null;

  // Collect all child threads (depth > 0) from root threads' children recursively
  const childThreadsExist =
    threads &&
    Object.values(threads).some((t) => t.depth > 0);

  return (
    <nav aria-label="Session history">
      <ul className="space-y-1 px-2">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const date = new Date(session.lastActivityAt).toLocaleDateString();
          // For the active session, use live Zustand title if available
          const displayTitle = isActive && liveTitle ? liveTitle : session.title;
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
                title={displayTitle}
              >
                <div className="truncate">{displayTitle}</div>
                <div className="text-xs text-stone-400 dark:text-slate-500">{date}</div>
              </button>
              {/* Show child threads hierarchically for active session */}
              {isActive && childThreadsExist && threads && (
                <ul className="ml-2 mt-1 space-y-0.5">
                  {rootThreads.map((root) =>
                    root.childThreadIds
                      .map((id) => threads[id])
                      .filter(Boolean)
                      .map((child) => (
                        <ThreadNode
                          key={child.id}
                          thread={child}
                          threads={threads}
                          onNavigateThread={onNavigateThread}
                        />
                      ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
