import { BreadcrumbBar } from '../layout/BreadcrumbBar';
import { AncestorPeekPanel } from '../layout/AncestorPeekPanel';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SessionHistory } from '../history/SessionHistory';
import { DemoThreadView } from './DemoThreadView';
import { DEMO_SESSION } from './demoData';
import { useSessionStore } from '../../store/sessionStore';
import { selectThreadAncestry } from '../../store/selectors';
import { useResizableSidebar } from '../../hooks/useResizableSidebar';

interface DemoAppShellProps {
  onSignInClick: () => void;
}

/**
 * DemoAppShell -- mirrors AppShell layout for unauthenticated demo mode.
 *
 * Uses the same real components (SessionHistory, BreadcrumbBar, AncestorPeekPanel)
 * reading from the Zustand store that has been hydrated with demo data.
 * No API calls, no auth hooks.
 */
export function DemoAppShell({ onSignInClick }: DemoAppShellProps) {
  const threads = useSessionStore(s => s.threads);
  const messages = useSessionStore(s => s.messages);
  const activeThreadId = useSessionStore(s => s.activeThreadId);
  const setActiveThread = useSessionStore(s => s.setActiveThread);
  const { width: sidebarWidth, onMouseDown: onResizeMouseDown, onTouchStart: onResizeTouchStart, isResizing } = useResizableSidebar();

  // Ancestry for ancestor peek panels
  const ancestry = activeThreadId ? selectThreadAncestry(threads, activeThreadId) : [];
  const ancestors = ancestry.slice(0, -1);

  // Build a single session entry for the sidebar
  const demoSessions = [{
    id: DEMO_SESSION.id,
    title: 'How does photosynthesis work?',
    createdAt: DEMO_SESSION.createdAt,
    lastActivityAt: DEMO_SESSION.createdAt,
    messageCount: 4,
  }];

  return (
    <div className={`flex h-screen bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-slate-100${isResizing ? ' select-none cursor-col-resize' : ''}`}>

      {/* Sidebar */}
      <aside
        className="hidden sm:flex flex-col flex-shrink-0 relative border-r border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-y-auto"
        style={{ width: sidebarWidth }}
      >
        <div className="px-3 py-2 text-xs font-semibold text-stone-500 dark:text-slate-500 uppercase tracking-wide border-b border-stone-100 dark:border-zinc-800">
          Chats
        </div>
        <button
          onClick={onSignInClick}
          className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors font-medium"
        >
          + New Chat
        </button>
        <SessionHistory
          sessions={demoSessions}
          onLoadSession={() => {}}
          currentSessionId={DEMO_SESSION.id}
          threads={threads}
          onNavigateThread={setActiveThread}
          activeThreadId={activeThreadId}
          onRenameSession={() => {}}
          onDeleteSession={() => {}}
        />
        {/* Drag handle for resizing */}
        <div
          onMouseDown={onResizeMouseDown}
          onTouchStart={onResizeTouchStart}
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-400/50${isResizing ? ' bg-blue-400/60' : ''}`}
        />
      </aside>

      {/* Ancestor peek panels */}
      {ancestors.map((thread, idx) => {
        const distFromParent = ancestors.length - 1 - idx;
        const w = distFromParent === 0 ? 180 : distFromParent === 1 ? 110 : 68;
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
              onDelete={() => {}}
              onSummarize={() => {}}
              onCompact={() => {}}
            />
          </div>
        );
      })}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="h-12 bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-700 flex items-center px-4 flex-shrink-0 gap-2">
          <div className="flex-1 min-w-0">
            <BreadcrumbBar />
          </div>
          <ThemeToggle />
          <button
            onClick={onSignInClick}
            className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium"
          >
            Sign in
          </button>
        </header>

        {/* Thread view */}
        <main className="flex-1 overflow-hidden">
          <DemoThreadView onSignInClick={onSignInClick} />
        </main>
      </div>
    </div>
  );
}
