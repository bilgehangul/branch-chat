import { UserButton } from '@clerk/clerk-react';
import { ThreadView } from '../thread/ThreadView';
import { BreadcrumbBar } from './BreadcrumbBar';
import { AncestorPeekPanel } from './AncestorPeekPanel';
import { useSessionStore } from '../../store/sessionStore';
import { selectThreadAncestry } from '../../store/selectors';

export function AppShell() {
  const threads = useSessionStore(s => s.threads);
  const messages = useSessionStore(s => s.messages);
  const activeThreadId = useSessionStore(s => s.activeThreadId);
  const setActiveThread = useSessionStore(s => s.setActiveThread);

  // Ancestry = [root, ...ancestors, current] — exclude current (last element)
  const ancestry = activeThreadId ? selectThreadAncestry(threads, activeThreadId) : [];
  const ancestors = ancestry.slice(0, -1);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Ancestor peek panels — oldest to newest, left to right */}
      {ancestors.map((thread, idx) => {
        // immediate parent (last) = 160px, one before = 96px, rest = 64px
        const distFromParent = ancestors.length - 1 - idx;
        const w = distFromParent === 0 ? 160 : distFromParent === 1 ? 96 : 64;
        return (
          <AncestorPeekPanel
            key={thread.id}
            thread={thread}
            allMessages={messages}
            width={w}
            onClick={() => setActiveThread(thread.id)}
          />
        );
      })}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header / breadcrumb bar */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 gap-2">
          <div className="flex-1 min-w-0">
            <BreadcrumbBar />
          </div>
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
