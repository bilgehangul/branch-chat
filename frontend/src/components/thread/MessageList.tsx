import type { Message, Thread } from '../../types/index';
import { MessageBlock } from './MessageBlock';
import { ContextCard } from './ContextCard';

export function MessageList({ messages, thread }: { messages: Message[]; thread: Thread }) {
  return (
    <div>
      <ContextCard thread={thread} />
      {messages.map((msg) => (
        <MessageBlock key={msg.id} message={msg} />
      ))}
    </div>
  );
}
