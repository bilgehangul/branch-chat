import { ThreadView } from '../thread/ThreadView';
import { BreadcrumbBar } from './BreadcrumbBar';
import { SpineStrip } from './SpineStrip';

export function AppShell() {
  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100">
      {/* Left spine strip — renders itself only at depth >= 1 */}
      <SpineStrip />
      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Breadcrumb bar */}
        <header className="h-12 border-b border-zinc-800 flex items-center px-4 flex-shrink-0">
          <BreadcrumbBar />
        </header>
        {/* Thread view fills remaining height */}
        <main className="flex-1 overflow-hidden">
          <ThreadView />
        </main>
      </div>
    </div>
  );
}
