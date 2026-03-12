import React from 'react';
import type { Message, Thread } from '../../types/index';
import { MessageBlock } from './MessageBlock';
import { ContextCard } from './ContextCard';
import { BranchPillCell } from '../branching/GutterColumn';

type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

interface MessageListProps {
  messages: Message[];
  thread: Thread;
  threads: Record<string, Thread>;
  allMessages: Record<string, Message>;
  onNavigate: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSummarize: (threadId: string) => void;
  onCompact: (threadId: string) => void;
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
  threads,
  allMessages,
  onNavigate,
  onDeleteThread,
  onSummarize,
  onCompact,
  onTryAnother,
  pendingAnnotation,
  errorAnnotation,
}: MessageListProps) {
  return (
    <>
      {/* ContextCard spans full grid width */}
      <div className="col-span-full">
        <ContextCard thread={thread} />
      </div>

      {/* Each message renders as a grid row pair: message cell + pill cell */}
      {messages.map((msg) => {
        // Collect childLeads anchored to this message
        const leadsForMessage = msg.childLeads ?? [];

        return (
          <React.Fragment key={msg.id}>
            {/* Column 1: message content */}
            <div className="min-w-0">
              <MessageBlock
                message={msg}
                onTryAnother={onTryAnother}
                pendingAnnotation={pendingAnnotation}
                errorAnnotation={errorAnnotation}
              />
            </div>

            {/* Column 2: branch pills (auto-collapses when empty) */}
            <div className="flex flex-col gap-1 items-end self-center">
              {leadsForMessage.length > 0 && (
                <BranchPillCell
                  leads={leadsForMessage}
                  threads={threads}
                  messages={allMessages}
                  onNavigate={onNavigate}
                  onDeleteThread={onDeleteThread}
                  onSummarize={onSummarize}
                  onCompact={onCompact}
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}
