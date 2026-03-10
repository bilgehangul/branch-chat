import { useRef, useState, useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { selectThreadAncestry } from '../../store/selectors';
import type { Thread } from '../../types/index';

export function BreadcrumbBar() {
  const threads = useSessionStore((s) => s.threads);
  const activeThreadId = useSessionStore((s) => s.activeThreadId);
  const setActiveThread = useSessionStore((s) => s.setActiveThread);

  const containerRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const ancestry = activeThreadId ? selectThreadAncestry(threads, activeThreadId) : [];
  const currentThread = ancestry[ancestry.length - 1];
  const ancestors = ancestry.slice(0, -1);

  const getCrumbLabel = (thread: Thread) =>
    thread.messageIds.length === 0 ? 'New Chat' : thread.title;

  // Collapse logic: if ancestry.length > 3, show first ancestor, "...", last 2 ancestors
  const shouldCollapse = ancestry.length > 3;
  const collapsedMiddle = shouldCollapse ? ancestry.slice(1, -2) : [];
  // visibleAncestors: first + last 2 when collapsing, or all ancestors when not
  const visibleAncestors = shouldCollapse
    ? [ancestors[0], ...ancestors.slice(-2)]
    : ancestors;

  // ResizeObserver — triggers re-render on container resize for dynamic collapse
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      // Data-length-based collapse — no forced state update needed
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  if (!activeThreadId || !currentThread) return null;

  const chevron = <span className="mx-2 text-slate-400 dark:text-zinc-600">›</span>;

  return (
    <div
      ref={containerRef}
      className="flex items-center h-full text-sm overflow-hidden relative"
    >
      {/* Visible ancestors */}
      {visibleAncestors.map((thread, idx) => {
        if (!thread) return null;
        const isFirst = idx === 0;
        const isCollapsedInsertPoint = shouldCollapse && isFirst;

        return (
          <span key={thread.id} className="flex items-center">
            <button
              className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 cursor-pointer truncate max-w-[120px]"
              onClick={() => setActiveThread(thread.id)}
            >
              {getCrumbLabel(thread)}
            </button>
            {chevron}
            {/* Insert ellipsis button after first ancestor when collapsing */}
            {isCollapsedInsertPoint && collapsedMiddle.length > 0 && (
              <span className="flex items-center relative">
                <button
                  className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 cursor-pointer px-1"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  ...
                </button>
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded shadow-lg z-50 py-1 min-w-[140px]">
                    {collapsedMiddle.map((collapsed) => (
                      <button
                        key={collapsed.id}
                        className="block w-full text-left px-3 py-1 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 truncate"
                        onClick={() => {
                          setActiveThread(collapsed.id);
                          setShowDropdown(false);
                        }}
                      >
                        {getCrumbLabel(collapsed)}
                      </button>
                    ))}
                  </div>
                )}
                {chevron}
              </span>
            )}
          </span>
        );
      })}

      {/* Current (non-clickable) crumb */}
      <span className="text-slate-900 dark:text-zinc-100 truncate max-w-[200px]">
        {getCrumbLabel(currentThread)}
      </span>
    </div>
  );
}
