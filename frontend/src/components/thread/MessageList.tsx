import type { Message, Thread } from '../../types/index';
import { MessageBlock } from './MessageBlock';
import { ContextCard } from './ContextCard';

type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

interface MessageListProps {
  messages: Message[];
  thread: Thread;
  onTryAnother?: (
    messageId: string,
    annotationId: string,
    anchorText: string,
    paragraphId: string,
    mode: SimplifyMode
  ) => void;
  pendingAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string } | null;
  errorAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string; retryFn: () => void } | null;
}

export function MessageList({
  messages,
  thread,
  onTryAnother,
  pendingAnnotation,
  errorAnnotation,
}: MessageListProps) {
  return (
    <div>
      <ContextCard thread={thread} />
      {messages.map((msg) => (
        <MessageBlock
          key={msg.id}
          message={msg}
          onTryAnother={onTryAnother}
          pendingAnnotation={pendingAnnotation}
          errorAnnotation={errorAnnotation}
        />
      ))}
    </div>
  );
}
