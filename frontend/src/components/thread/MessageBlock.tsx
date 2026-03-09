import type { Message } from '../../types/index';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingCursor } from './StreamingCursor';

export function MessageBlock({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const streamingClasses = message.isStreaming ? 'opacity-80 select-none pointer-events-none' : '';

  return (
    <div className="mb-8 max-w-[720px] mx-auto" data-message-id={message.id}>
      <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
        {isUser ? 'You' : 'Gemini'}
      </p>
      <div
        className={`${isUser ? 'bg-zinc-800' : 'bg-zinc-900'} rounded-lg px-4 py-3 ${streamingClasses}`}
      >
        {isUser ? (
          <p className="text-zinc-100 whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            <StreamingCursor
              isStreaming={message.isStreaming}
              hasContent={message.content.length > 0}
            />
          </>
        )}
      </div>
    </div>
  );
}
