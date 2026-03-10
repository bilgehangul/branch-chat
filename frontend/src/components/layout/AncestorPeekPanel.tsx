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
  width: number;
  onClick: () => void;
  onNavigate?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
  onSummarize?: (threadId: string) => void;
  onCompact?: (threadId: string) => void;
}

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
          onClick={() => { onSummarize?.(threadId); onClose(); }}
        >
          Summarize
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
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

export function AncestorPeekPanel({
  thread,
  allMessages,
  highlightMessageId,
  childThreadId,
  width,
  onClick,
  onNavigate,
  onDelete,
  onSummarize,
  onCompact,
}: AncestorPeekPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const threadMessages = thread.messageIds
    .map(id => allMessages[id])
    .filter(Boolean) as Message[];

  // On mount and when the highlighted message changes, scroll it into view
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [highlightMessageId]);

  const maxChars = width < 100 ? 45 : 130;

  return (
    <div
      className="relative flex-shrink-0 flex flex-col bg-slate-50/80 sm:bg-slate-50 cursor-pointer group hover:bg-slate-100 transition-colors"
      style={{ width, borderRight: `${width < 100 ? 2 : 3}px solid ${thread.accentColor}` }}
      onClick={onClick}
      onContextMenu={e => {
        if (!onDelete) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
      title={`← Back to: ${thread.title}`}
    >
      {/* Title header */}
      <div className="flex-shrink-0 px-2 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: thread.accentColor }}
          />
          <p className="text-[10px] font-semibold text-slate-600 truncate">{thread.title}</p>
        </div>
      </div>

      {/* Scrollable message list — positions itself at the anchor message */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {threadMessages.length === 0 && (
          <p className="text-[10px] text-slate-400 px-2 py-2 italic">No messages yet</p>
        )}
        {threadMessages.map(msg => {
          const isAnchor = msg.id === highlightMessageId;
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              ref={isAnchor ? highlightRef : undefined}
              className={`mx-1 my-0.5 px-2 py-1 rounded text-[10px] leading-snug ${
                isAnchor ? 'border-l-2' : ''
              } ${isUser ? 'text-slate-700' : 'text-slate-600'}`}
              style={
                isAnchor
                  ? { backgroundColor: `${thread.accentColor}20`, borderColor: thread.accentColor }
                  : undefined
              }
            >
              <span className="font-semibold mr-1 text-slate-400">
                {isUser ? 'You' : 'AI'}
              </span>
              {msg.content.slice(0, maxChars)}
              {msg.content.length > maxChars && '…'}

              {/* Child thread navigation button on the anchor message */}
              {isAnchor && childThreadId && onNavigate && (
                <button
                  className="block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${thread.accentColor}30`,
                    color: thread.accentColor,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onNavigate(childThreadId);
                  }}
                >
                  ↗ branch
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom fade — hints more content below */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />

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
