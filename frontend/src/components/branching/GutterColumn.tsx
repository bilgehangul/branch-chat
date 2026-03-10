/**
 * GutterColumn (Inline Branch Pills)
 *
 * Pills are absolutely positioned INSIDE the scroll container's content wrapper,
 * so they scroll with the text rather than sitting in a separate fixed column.
 *
 * Each pill aligns to the paragraph where the branch was created.
 * Right-click shows a context menu with Delete / Summarize / Compact.
 *
 * Requirements: BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11
 *
 * KEY DECISIONS:
 * - Positions measured as anchorRect.top - wrapperRect.top (both in viewport coords;
 *   scrollTop cancels out, so no scroll listener needed)
 * - Pills are position:absolute inside a position:relative wrapper — they scroll with content
 * - ResizeObserver (guarded for jsdom) recomputes only on content reflow, not scroll
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Thread, Message, ChildLead } from '../../types/index';
import { ConfirmDialog } from '../ui/ConfirmDialog';

// ── DOM measurement ────────────────────────────────────────────────────────

function measurePillTop(
  messageId: string,
  paragraphId: string,
  wrapper: HTMLElement
): number | null {
  const anchor = wrapper.querySelector(
    `[data-message-id="${messageId}"] [data-paragraph-id="${paragraphId}"]`
  );
  if (!anchor) return null;
  const anchorRect = anchor.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  // anchorRect.top - wrapperRect.top gives content-relative offset.
  // scrollTop cancels because both elements are in the same scroll container.
  return anchorRect.top - wrapperRect.top;
}

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
  // Use a ref to track pendingDelete so the mousedown handler doesn't capture
  // a stale closure — if the confirm dialog is open, do not dismiss the menu.
  const pendingDeleteRef = useRef(false);

  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  useEffect(() => {
    const handler = () => {
      // Don't dismiss the context menu while the confirm dialog is open —
      // the dialog overlay's own mousedown would fire first and we'd lose the dialog.
      if (pendingDeleteRef.current) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <>
      <div
        style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
        className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px] text-sm"
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => setPendingDelete(true)}
        >
          Delete thread
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={() => { onSummarize(threadId); onClose(); }}
        >
          Summarize
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
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
        className="flex items-center gap-1 w-full px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 text-left transition-colors cursor-pointer"
        onClick={e => { e.stopPropagation(); onNavigate(threadId); }}
      >
        <span className="text-slate-300 flex-shrink-0 text-[10px]">↳</span>
        <span className="truncate flex-1 min-w-0">{thread.title.slice(0, 28)}</span>
        <span className="text-[10px] text-slate-400 flex-shrink-0">{thread.messageIds.length}</span>
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

// ── LeadPill ─────────────────────────────────────────────────────────────

interface LeadPillProps {
  lead: ChildLead;
  thread: Thread;
  allThreads: Record<string, Thread>;
  messages: Record<string, Message>;
  top: number;
  onNavigate: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
}

function LeadPill({ lead, thread, allThreads, messages, top, onNavigate, onDeleteThread, onSummarize, onCompact }: LeadPillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const childMessages = thread.messageIds
    .map(id => messages[id])
    .filter(Boolean) as Message[];

  const firstUserMsg = childMessages.find(m => m.role === 'user');
  const firstAiMsg = childMessages.find(m => m.role === 'assistant');
  const firstAiLine = firstAiMsg ? firstAiMsg.content.split('\n')[0] : '';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const pillWidth = isMobile ? 120 : 184;
  const pillRight = isMobile ? 4 : 8;

  return (
    <div style={{ position: 'absolute', top, right: pillRight, width: pillWidth }}>
      {/* The lead pill button */}
      <button
        aria-label={`→ ${thread.title.slice(0, 32)}`}
        className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 text-left text-sm transition-colors cursor-pointer ${isMobile ? 'bg-white/90' : 'bg-white'}`}
        onClick={() => onNavigate(lead.threadId)}
        onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-slate-400 flex-shrink-0">→</span>
        <span className="text-slate-800 truncate flex-1 min-w-0">{thread.title.slice(0, 32)}</span>
        <span className="text-xs text-slate-400 flex-shrink-0">{thread.messageIds.length}</span>
        <span
          data-testid="accent-pip"
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: thread.accentColor }}
        />
      </button>

      {/* Descendant threads nested below the pill */}
      {thread.childThreadIds.length > 0 && (
        <div className="mt-0.5 border-l border-slate-200 ml-2">
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

      {/* Preview card on hover */}
      {isHovered && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-700 space-y-2"
          data-testid="preview-card"
        >
          <div className="text-slate-500 italic truncate">{lead.anchorText}</div>
          {firstUserMsg && (
            <div className="text-slate-700 truncate">
              <span className="text-slate-500">You: </span>
              {firstUserMsg.content}
            </div>
          )}
          {firstAiLine && (
            <div className="text-slate-500 truncate">
              <span className="text-slate-500">AI: </span>
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

// ── Main component ─────────────────────────────────────────────────────────

export interface GutterColumnProps {
  /** The position:relative wrapper div inside the scroll container */
  wrapperRef: React.RefObject<HTMLElement | null>;
  activeThread: Thread;
  threads: Record<string, Thread>;
  messages: Record<string, Message>;
  onNavigate: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
}

export function GutterColumn({
  wrapperRef,
  activeThread,
  threads,
  messages,
  onNavigate,
  onDeleteThread,
  onSummarize,
  onCompact,
}: GutterColumnProps) {
  // BRANCH-08: render nothing when no child threads
  if (activeThread.childThreadIds.length === 0) return null;

  // Collect all childLeads from every message in the active thread
  const childLeads = activeThread.messageIds.flatMap(
    id => messages[id]?.childLeads ?? []
  );

  // Pill position tracking — stored in ref, never in Zustand
  const pillPositions = useRef<Record<string, number>>({});
  const [posVersion, setPosVersion] = useState(0);

  const recomputePositions = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let changed = false;

    for (const lead of childLeads) {
      const containingMessageId = activeThread.messageIds.find(id =>
        messages[id]?.childLeads.some(cl => cl.threadId === lead.threadId)
      );
      if (!containingMessageId) continue;

      const top = measurePillTop(
        containingMessageId,
        String(lead.paragraphIndex),
        wrapper
      );
      if (top !== null) {
        const prev = pillPositions.current[lead.threadId];
        if (prev === undefined || Math.abs(prev - top) > 1) {
          pillPositions.current[lead.threadId] = top;
          changed = true;
        }
      }
    }

    if (changed) setPosVersion(v => v + 1);
  }, [wrapperRef, childLeads, activeThread.messageIds, messages]);

  // ResizeObserver — guarded for jsdom, observes the content wrapper
  useEffect(() => {
    recomputePositions();
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(recomputePositions);
    });
    if (wrapperRef.current) {
      ro.observe(wrapperRef.current);
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childLeads.length, posVersion]);

  // Pills are position:absolute inside the relative wrapper — render as fragment
  return (
    <>
      {childLeads.map(lead => {
        const childThread = threads[lead.threadId];
        if (!childThread) return null;
        const top = pillPositions.current[lead.threadId] ?? 0;
        return (
          <LeadPill
            key={lead.threadId}
            lead={lead}
            thread={childThread}
            allThreads={threads}
            messages={messages}
            top={top}
            onNavigate={onNavigate}
            onDeleteThread={onDeleteThread}
            onSummarize={onSummarize}
            onCompact={onCompact}
          />
        );
      })}
    </>
  );
}
