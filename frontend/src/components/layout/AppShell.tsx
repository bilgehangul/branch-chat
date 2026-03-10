import { UserButton, useAuth } from '@clerk/clerk-react';
import { ThreadView } from '../thread/ThreadView';
import { BreadcrumbBar } from './BreadcrumbBar';
import { AncestorPeekPanel } from './AncestorPeekPanel';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSessionStore } from '../../store/sessionStore';
import { selectThreadAncestry } from '../../store/selectors';
import { NetworkBanner } from '../ui/NetworkBanner';
import { AuthExpiredBanner } from '../ui/AuthExpiredBanner';

export function AppShell() {
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
          <UserButton />
        </header>
        {/* Thread view fills remaining height */}
        <main className="flex-1 overflow-hidden">
          <ThreadView />
        </main>
      </div>
    </div>
  );
}
