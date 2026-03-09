export function AppShell() {
  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      <header className="h-12 border-b border-zinc-800 flex items-center px-4">
        {/* Breadcrumb bar — Phase 3 */}
      </header>
      <main className="flex-1 overflow-y-auto">
        {/* Thread view — Phase 3 */}
        <div className="max-w-[720px] mx-auto py-8 text-zinc-400 text-sm">
          Start a conversation...
        </div>
      </main>
      <footer className="border-t border-zinc-800 p-4">
        {/* Chat input — Phase 3 */}
      </footer>
    </div>
  );
}
