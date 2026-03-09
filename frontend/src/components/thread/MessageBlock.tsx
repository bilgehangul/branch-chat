import type { Message } from '../../types/index';
import { useSessionStore } from '../../store/sessionStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingCursor } from './StreamingCursor';

export function MessageBlock({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const streamingClasses = message.isStreaming ? 'opacity-80 select-none pointer-events-none' : '';

  // Build underline map from childLeads: paragraphIndex -> accentColor
  // Source of truth is Zustand (survives re-renders — pitfall 4 avoided)
  const threads = useSessionStore(s => s.threads);
  const underlineMap: Record<number, string> = {};
  for (const lead of message.childLeads) {
    const threadColor = threads[lead.threadId]?.accentColor;
    if (threadColor) underlineMap[lead.paragraphIndex] = threadColor;
  }

  return (
    <div className="mb-6 max-w-[720px] mx-auto" data-message-id={message.id}>
      {/* Label above bubble */}
      <p className={`text-xs mb-1 font-medium ${isUser ? 'text-slate-500 text-right' : 'text-slate-500 text-left'}`}>
        {isUser ? 'You' : 'Gemini'}
      </p>
      {/* Bubble */}
      <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
        <div
          className={`${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 ml-auto max-w-[75%]'
              : 'bg-white text-slate-900 border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 mr-auto max-w-[85%]'
          } ${streamingClasses}`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={message.content} underlineMap={underlineMap} />
              <StreamingCursor
                isStreaming={message.isStreaming}
                hasContent={message.content.length > 0}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
