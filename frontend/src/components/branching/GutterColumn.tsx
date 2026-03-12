/**
 * GutterColumn (Branch Pill Components)
 *
 * Simplified pill components for CSS Grid inline layout.
 * Pills are rendered inline in grid cells by MessageList — no JS measurement,
 * no absolute positioning. CSS Grid handles alignment natively.
 *
 * Exports:
 * - BranchPillCell: renders all pills for a message in a flex column
 * - LeadPill: individual pill button with preview card and context menu
 *
 * Requirements: PILL-01, PILL-02, BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11
 */

import { useState, useRef, useEffect } from 'react';
import type { Thread, Message, ChildLead } from '../../types/index';
import { ConfirmDialog } from '../ui/ConfirmDialog';

// ── Context menu ─────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  threadId: string;
  onDelete: (threadId: string) => void;
  onClose: () => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
}

function ThreadContextMenu({ x, y, threadId, onDelete, onClose, onSummarize, onCompact }: ContextMenuProps) {
  const [pendingDelete, setPendingDelete] = useState(false);

  return (
    <>
      <div
        style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
        className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px] text-sm"
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
          aria-label="Delete thread"
          onClick={() => setPendingDelete(true)}
        >
          Delete thread
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
          aria-label="Summarize thread"
          onClick={() => { onSummarize(threadId); onClose(); }}
        >
          Summarize
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
          aria-label="Compact thread"
          onClick={() => { onCompact(threadId); onClose(); }}
        >
          Compact
        </button>
      </div>
      {pendingDelete && (
        <ConfirmDialog
          title="Delete thread?"
          body="This thread and all its messages will be removed. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { onDelete(threadId); onClose(); }}
          onCancel={() => setPendingDelete(false)}
        />
      )}
    </>
  );
}

// ── DescendantPill ────────────────────────────────────────────────────────

function DescendantPill({
  threadId,
  threads,
  onNavigate,
  depth,
}: {
  threadId: string;
  threads: Record<string, Thread>;
  onNavigate: (threadId: string) => void;
  depth: number;
}) {
  const thread = threads[threadId];
  if (!thread || depth > 3) return null;
  return (
    <div style={{ paddingLeft: depth * 10 }}>
      <button
        className="flex items-center gap-1 w-full px-2 py-1 rounded text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
        aria-label={`Navigate to branch: ${threads[threadId]?.title ?? 'Untitled'}`}
        onClick={e => { e.stopPropagation(); onNavigate(threadId); }}
      >
        <span className="text-slate-300 dark:text-zinc-500 flex-shrink-0 text-xs">&#8627;</span>
        <span className="truncate flex-1 min-w-0">{thread.title.slice(0, 28)}</span>
        <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">{thread.messageIds.length}</span>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: thread.accentColor }}
        />
      </button>
      {thread.childThreadIds.map(childId => (
        <DescendantPill
          key={childId}
          threadId={childId}
          threads={threads}
          onNavigate={onNavigate}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ── LeadPill (inline, no absolute positioning) ───────────────────────────

interface LeadPillProps {
  lead: ChildLead;
  thread: Thread;
  allThreads: Record<string, Thread>;
  messages: Record<string, Message>;
  onNavigate: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
}

function LeadPill({ lead, thread, allThreads, messages, onNavigate, onDeleteThread, onSummarize, onCompact }: LeadPillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [flipAbove, setFlipAbove] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  // Auto-flip: compute whether preview card should render above the pill (PILL-06)
  useEffect(() => {
    if (isHovered && pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      setFlipAbove(rect.bottom > window.innerHeight - 220);
    }
  }, [isHovered]);

  const childMessages = thread.messageIds
    .map(id => messages[id])
    .filter(Boolean) as Message[];

  const firstUserMsg = childMessages.find(m => m.role === 'user');
  const firstAiMsg = childMessages.find(m => m.role === 'assistant');
  const firstAiLine = firstAiMsg ? firstAiMsg.content.split('\n')[0] : '';

  return (
    <div className="relative">
      {/* The lead pill button */}
      <button
        ref={pillRef}
        aria-label={`Go to branch: ${thread.title.slice(0, 32)}`}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700 text-left text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none bg-white dark:bg-zinc-800"
        onClick={() => onNavigate(lead.threadId)}
        onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-slate-400 dark:text-zinc-500 flex-shrink-0">&rarr;</span>
        <span className="text-slate-800 dark:text-zinc-100 truncate flex-1 min-w-0">{thread.title.slice(0, 20)}</span>
        <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">{thread.messageIds.length}</span>
        <span
          data-testid="accent-pip"
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: thread.accentColor }}
        />
      </button>

      {/* Descendant threads — collapsed by default, expand on hover (PILL-08) */}
      {thread.childThreadIds.length > 0 && (
        <div className={`mt-0.5 border-l border-slate-200 dark:border-zinc-700 ml-2 overflow-hidden transition-[max-height] duration-200 ${isHovered ? 'max-h-[200px]' : 'max-h-0'}`}>
          {thread.childThreadIds.map(childId => (
            <DescendantPill
              key={childId}
              threadId={childId}
              threads={allThreads}
              onNavigate={onNavigate}
              depth={1}
            />
          ))}
        </div>
      )}

      {/* Preview card on hover with auto-flip and triangle pointer (PILL-06, PILL-07) */}
      {isHovered && (
        <div
          className={`absolute right-0 z-50 w-64 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg p-3 text-xs text-slate-700 dark:text-zinc-200 space-y-2 ${flipAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          data-testid="preview-card"
        >
          {/* CSS triangle pointer */}
          {flipAbove ? (
            <div className="absolute -bottom-[6px] right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-zinc-800" />
          ) : (
            <div className="absolute -top-[6px] right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white dark:border-b-zinc-800" />
          )}
          <div className="text-slate-500 dark:text-zinc-400 italic truncate">{lead.anchorText}</div>
          {firstUserMsg && (
            <div className="text-slate-700 dark:text-zinc-200 truncate">
              <span className="text-slate-500 dark:text-zinc-400">You: </span>
              {firstUserMsg.content}
            </div>
          )}
          {firstAiLine && (
            <div className="text-slate-500 dark:text-zinc-400 truncate">
              <span className="text-slate-500 dark:text-zinc-400">AI: </span>
              {firstAiLine}
            </div>
          )}
        </div>
      )}

      {/* Context menu */}
      {menu && (
        <ThreadContextMenu
          x={menu.x}
          y={menu.y}
          threadId={lead.threadId}
          onDelete={onDeleteThread}
          onClose={() => setMenu(null)}
          onSummarize={onSummarize}
          onCompact={onCompact}
        />
      )}
    </div>
  );
}

// ── BranchPillCell ────────────────────────────────────────────────────────

export interface BranchPillCellProps {
  leads: ChildLead[];
  threads: Record<string, Thread>;
  messages: Record<string, Message>;
  onNavigate: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
}

/**
 * BranchPillCell renders all pills for a single message in a flex column.
 * Used as the grid column 2 cell in the CSS Grid layout.
 */
export function BranchPillCell({
  leads,
  threads,
  messages,
  onNavigate,
  onDeleteThread,
  onSummarize,
  onCompact,
}: BranchPillCellProps) {
  return (
    <div className="flex flex-col gap-1">
      {leads.map(lead => {
        const childThread = threads[lead.threadId];
        if (!childThread) return null;
        return (
          <LeadPill
            key={lead.threadId}
            lead={lead}
            thread={childThread}
            allThreads={threads}
            messages={messages}
            onNavigate={onNavigate}
            onDeleteThread={onDeleteThread}
            onSummarize={onSummarize}
            onCompact={onCompact}
          />
        );
      })}
    </div>
  );
}
