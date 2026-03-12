import { useRef, useEffect, useState } from 'react';
import type { Thread, Message } from '../../types/index';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface AncestorPeekPanelProps {
  thread: Thread;
  allMessages: Record<string, Message>;
  /** Message in this thread where the next branch was created — scrolled into view */
  highlightMessageId?: string;
  /** The direct child thread in the current ancestry path (shown as nav button on highlighted message) */
  childThreadId?: string;
  onClick: () => void;
  onNavigate?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
  onSummarize?: (threadId: string) => void;
  onCompact?: (threadId: string) => void;
}

/* ── Context menu (unchanged) ─────────────────────────────── */

function ContextMenu({
  x, y, threadId, onDelete, onClose, onSummarize, onCompact,
}: {
  x: number; y: number; threadId: string;
  onDelete: (id: string) => void; onClose: () => void;
  onSummarize?: (id: string) => void; onCompact?: (id: string) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <>
      <div
        style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
        className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px] text-sm"
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          onClick={() => setPendingDelete(true)}
        >
          Delete thread
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          onClick={() => { onSummarize?.(threadId); onClose(); }}
        >
          Summarize
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          onClick={() => { onCompact?.(threadId); onClose(); }}
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

/* ── Expanded panel content ───────────────────────────────── */

function RailPanelContent({
  thread,
  messages,
  highlightMessageId,
  childThreadId,
  onNavigate,
  onClick,
}: {
  thread: Thread;
  messages: Message[];
  highlightMessageId?: string;
  childThreadId?: string;
  onNavigate?: (threadId: string) => void;
  onClick: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const maxChars = 130;

  // Scroll the anchor message into view on mount
  useEffect(() => {
    if (highlightRef.current && typeof highlightRef.current.scrollIntoView === 'function') {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [highlightMessageId]);

  return (
    <div className="flex flex-col h-full w-[220px]" onClick={onClick}>
      {/* Title header */}
      <div className="flex-shrink-0 px-2 py-2 bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: thread.accentColor }}
          />
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 truncate">{thread.title}</p>
        </div>
      </div>

      {/* Scrollable message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 px-2 py-2 italic">No messages yet</p>
        )}
        {messages.map(msg => {
          const isAnchor = msg.id === highlightMessageId;
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              ref={isAnchor ? highlightRef : undefined}
              className={`mx-1 my-0.5 px-2 py-1 rounded leading-snug ${
                isAnchor ? 'text-sm border-l-[3px]' : 'text-xs'
              } ${isUser ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-600 dark:text-zinc-300'}`}
              style={
                isAnchor
                  ? { backgroundColor: `${thread.accentColor}20`, borderColor: thread.accentColor }
                  : undefined
              }
            >
              <span className="font-semibold mr-1 text-slate-400 dark:text-zinc-500">
                {isUser ? 'You' : 'AI'}
              </span>
              {msg.content.slice(0, maxChars)}
              {msg.content.length > maxChars && '\u2026'}

              {/* Branch badge on the anchor message */}
              {isAnchor && childThreadId && onNavigate && (
                <span
                  className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${thread.accentColor}30`,
                    color: thread.accentColor,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onNavigate(childThreadId);
                  }}
                >
                  branch
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-50 dark:from-zinc-900 to-transparent pointer-events-none" />
    </div>
  );
}

/* ── Main rail component ──────────────────────────────────── */

export function AncestorPeekPanel({
  thread,
  allMessages,
  highlightMessageId,
  childThreadId,
  onClick,
  onNavigate,
  onDelete,
  onSummarize,
  onCompact,
}: AncestorPeekPanelProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const threadMessages = thread.messageIds
    .map(id => allMessages[id])
    .filter(Boolean) as Message[];

  return (
    <div
      className="relative flex-shrink-0 h-full cursor-pointer"
      style={{ width: '28px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={e => {
        if (!onDelete) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
      title={`\u2190 Back to: ${thread.title}`}
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-zinc-900" />

      {/* Collapsed: accent stripe on right edge */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[2px]"
        style={{ backgroundColor: thread.accentColor }}
        data-testid="accent-stripe"
      />

      {/* Expanded overlay — only when hovered */}
      <div
        className={`absolute top-0 left-0 bottom-0 bg-slate-50 dark:bg-zinc-900 shadow-lg rounded-r-lg overflow-hidden transition-[width] duration-200 ease-out z-10 ${
          isHovered ? 'w-[220px]' : 'w-0 pointer-events-none'
        }`}
      >
        {isHovered && (
          <RailPanelContent
            thread={thread}
            messages={threadMessages}
            highlightMessageId={highlightMessageId}
            childThreadId={childThreadId}
            onNavigate={onNavigate}
            onClick={onClick}
          />
        )}
      </div>

      {/* Context menu */}
      {menu && onDelete && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          threadId={thread.id}
          onDelete={onDelete}
          onClose={() => setMenu(null)}
          onSummarize={onSummarize}
          onCompact={onCompact}
        />
      )}
    </div>
  );
}
