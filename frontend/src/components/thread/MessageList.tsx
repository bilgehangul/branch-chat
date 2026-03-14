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
  onCancelAnnotation?: () => void;
}

export const MessageList = React.memo(function MessageList({
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
  onCancelAnnotation,
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

        // For assistant messages with branch pills, split into per-paragraph sub-rows
        // so each pill group aligns to the specific paragraph it was branched from.
        const isAssistant = msg.role === 'assistant';
        const hasPills = isAssistant && leadsForMessage.length > 0;

        if (hasPills) {
          // Count paragraphs the same way MarkdownRenderer splits content
          const paragraphs = msg.content.split(/\n\n+/);
          const paraCount = Math.max(paragraphs.length, 1);

          // Group leads by paragraphIndex
          const leadsByPara = new Map<number, typeof leadsForMessage>();
          for (const lead of leadsForMessage) {
            const existing = leadsByPara.get(lead.paragraphIndex) ?? [];
            existing.push(lead);
            leadsByPara.set(lead.paragraphIndex, existing);
          }

          return (
            <React.Fragment key={msg.id}>
              {/* Column 1: message content spans all paragraph sub-rows */}
              <div className="min-w-0" style={{ gridRow: `span ${paraCount}` }}>
                <MessageBlock
                  message={msg}
                  onTryAnother={onTryAnother}
                  pendingAnnotation={pendingAnnotation}
                  errorAnnotation={errorAnnotation}
                  onCancelAnnotation={onCancelAnnotation}
                />
              </div>

              {/* Column 2: one cell per paragraph, pills only in the matching row */}
              {Array.from({ length: paraCount }, (_, i) => (
                <div key={i} className="flex flex-col gap-1 items-end self-center">
                  {leadsByPara.has(i) && (
                    <BranchPillCell
                      leads={leadsByPara.get(i)!}
                      threads={threads}
                      messages={allMessages}
                      onNavigate={onNavigate}
                      onDeleteThread={onDeleteThread}
                      onSummarize={onSummarize}
                      onCompact={onCompact}
                    />
                  )}
                </div>
              ))}
            </React.Fragment>
          );
        }

        // Simple single-row layout for user messages and assistant messages without pills
        return (
          <React.Fragment key={msg.id}>
            {/* Column 1: message content */}
            <div className="min-w-0">
              <MessageBlock
                message={msg}
                onTryAnother={onTryAnother}
                pendingAnnotation={pendingAnnotation}
                errorAnnotation={errorAnnotation}
                onCancelAnnotation={onCancelAnnotation}
              />
            </div>

            {/* Column 2: empty (no pills) */}
            <div />
          </React.Fragment>
        );
      })}
    </>
  );
});
