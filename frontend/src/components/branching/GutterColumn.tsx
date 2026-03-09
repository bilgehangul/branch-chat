/**
 * GutterColumn
 *
 * 200px right gutter that appears only when a thread has child branches.
 * Renders lead pills at the vertical position of their anchor paragraphs.
 * Each pill shows thread title (max 32 chars), message count, accent pip;
 * hovering shows a preview card. Clicking navigates into the thread.
 *
 * Requirements: BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11
 *
 * KEY DECISIONS (from STATE.md):
 * - DOM pixel positions must never enter Zustand — track in component-local refs via ResizeObserver
 * - ResizeObserver guarded with typeof check (jsdom does not define it)
 * - requestAnimationFrame batches updates to avoid ResizeObserver loop warning
 * - Pill positions in useRef; separate counter state triggers re-render on >1px change
 */

import { useEffect, useRef, useState } from 'react';
import type { Thread, Message, ChildLead } from '../../types/index';

// ── DOM measurement ────────────────────────────────────────────────────────

function measurePillTop(
  messageId: string,
  paragraphId: string,
  scrollContainer: HTMLElement
): number | null {
  const anchor = scrollContainer.querySelector(
    `[data-message-id="${messageId}"] [data-paragraph-id="${paragraphId}"]`
  );
  if (!anchor) return null;
  const anchorRect = anchor.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  return anchorRect.top - containerRect.top + scrollContainer.scrollTop;
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface LeadPillProps {
  lead: ChildLead;
  thread: Thread;
  messages: Record<string, Message>;
  top: number;
  onNavigate: (threadId: string) => void;
}

function LeadPill({ lead, thread, messages, top, onNavigate }: LeadPillProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Preview card data: first user message + first AI line from the child thread
  const childMessages = thread.messageIds
    .map(id => messages[id])
    .filter(Boolean) as Message[];

  const firstUserMsg = childMessages.find(m => m.role === 'user');
  const firstAiMsg = childMessages.find(m => m.role === 'assistant');
  const firstAiLine = firstAiMsg ? firstAiMsg.content.split('\n')[0] : '';

  return (
    <div
      style={{ position: 'absolute', top, left: 8, right: 8 }}
    >
      {/* The lead pill button */}
      <button
        aria-label={`→ ${thread.title.slice(0, 32)}`}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-left text-sm transition-colors cursor-pointer"
        onClick={() => onNavigate(lead.threadId)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Directional arrow */}
        <span className="text-slate-400 flex-shrink-0">→</span>

        {/* Thread title (max 32 chars) */}
        <span className="text-slate-800 truncate flex-1 min-w-0">
          {thread.title.slice(0, 32)}
        </span>

        {/* Message count badge */}
        <span className="text-xs text-slate-400 flex-shrink-0">
          {thread.messageIds.length}
        </span>

        {/* Accent color pip */}
        <span
          data-testid="accent-pip"
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: thread.accentColor }}
        />
      </button>

      {/* Preview card on hover */}
      {isHovered && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-700 space-y-2"
          data-testid="preview-card"
        >
          {/* Anchor text */}
          <div className="text-slate-500 italic truncate">{lead.anchorText}</div>

          {/* First user message */}
          {firstUserMsg && (
            <div className="text-slate-700 truncate">
              <span className="text-slate-500">You: </span>
              {firstUserMsg.content}
            </div>
          )}

          {/* First AI line */}
          {firstAiLine && (
            <div className="text-slate-500 truncate">
              <span className="text-slate-500">AI: </span>
              {firstAiLine}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export interface GutterColumnProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  activeThread: Thread;
  threads: Record<string, Thread>;
  messages: Record<string, Message>;
  onNavigate: (threadId: string) => void;
}

export function GutterColumn({
  scrollContainerRef,
  activeThread,
  threads,
  messages,
  onNavigate,
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

  function recomputePositions() {
    const container = scrollContainerRef.current;
    if (!container) return;
    let changed = false;

    for (const lead of childLeads) {
      // Find the messageId that contains this childLead
      const containingMessageId = activeThread.messageIds.find(id =>
        messages[id]?.childLeads.some(cl => cl.threadId === lead.threadId)
      );
      if (!containingMessageId) continue;

      const top = measurePillTop(
        containingMessageId,
        String(lead.paragraphIndex),
        container
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
  }

  // ResizeObserver — guarded for jsdom (Phase 03-05 pattern)
  useEffect(() => {
    recomputePositions(); // initial measurement
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(recomputePositions);
    });
    if (scrollContainerRef.current) {
      ro.observe(scrollContainerRef.current);
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childLeads.length, posVersion]);

  // Scroll listener to recompute pill positions on scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => requestAnimationFrame(recomputePositions);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-[200px] flex-shrink-0 border-l border-slate-200">
      {childLeads.map(lead => {
        const childThread = threads[lead.threadId];
        if (!childThread) return null;
        const top = pillPositions.current[lead.threadId] ?? 0;
        return (
          <LeadPill
            key={lead.threadId}
            lead={lead}
            thread={childThread}
            messages={messages}
            top={top}
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );
}
