import { useRef, useEffect } from 'react';
import type { Thread, Message } from '../../types/index';

interface AncestorPeekPanelProps {
  thread: Thread;
  allMessages: Record<string, Message>;
  /** Message in this thread where the next branch was created — scrolled into view */
  highlightMessageId?: string;
  width: number;
  onClick: () => void;
}

export function AncestorPeekPanel({
  thread,
  allMessages,
  highlightMessageId,
  width,
  onClick,
}: AncestorPeekPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

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
      className="relative flex-shrink-0 flex flex-col bg-slate-50 cursor-pointer group hover:bg-slate-100 transition-colors"
      style={{ width, borderRight: `3px solid ${thread.accentColor}` }}
      onClick={onClick}
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
            </div>
          );
        })}
      </div>

      {/* Bottom fade — hints more content below */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
}
