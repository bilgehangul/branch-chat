import type { Message } from '../../types/index';
import { useSessionStore } from '../../store/sessionStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingCursor } from './StreamingCursor';
import { CitationBlock } from '../annotations/CitationBlock';
import { SimplificationBlock } from '../annotations/SimplificationBlock';

const MODE_LABELS: Record<string, string> = {
  simpler: 'Simpler',
  example: 'Example',
  analogy: 'Analogy',
  technical: 'Technical',
};

type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

interface MessageBlockProps {
  message: Message;
  /** Called when user picks a new simplification mode from SimplificationBlock.
   *  ThreadView captures anchorText + paragraphId from annotation and re-calls handleSimplify.
   */
  onTryAnother?: (
    messageId: string,
    annotationId: string,
    anchorText: string,
    paragraphId: string,
    mode: SimplifyMode
  ) => void;
  /** Pending annotation state — when messageId matches, show shimmer */
  pendingAnnotation?: { type: 'source' | 'simplification'; messageId: string } | null;
  /** Error annotation state — when messageId matches, show error block */
  errorAnnotation?: { type: 'source' | 'simplification'; messageId: string; retryFn: () => void } | null;
}

export function MessageBlock({
  message,
  onTryAnother,
  pendingAnnotation,
  errorAnnotation,
}: MessageBlockProps) {
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

  const showPending = pendingAnnotation?.messageId === message.id;
  const showError = errorAnnotation?.messageId === message.id;

  return (
    <div className="mb-6 max-w-[720px] mx-auto" data-message-id={message.id}>
      {/* Label above bubble */}
      <p className={`text-xs mb-1 font-medium ${isUser ? 'text-slate-500 text-right' : 'text-slate-500 text-left'}`}>
        {isUser ? 'You' : 'Gemini'}
      </p>
      {/* Bubble — data-paragraph-id elements live INSIDE MarkdownRenderer here */}
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

      {/* Annotation blocks — OUTSIDE the bubble, siblings of the bubble div */}
      {/* Only rendered for assistant messages */}
      {!isUser && (
        <>
          {/* Persisted annotations from Zustand store */}
          {message.annotations.map(ann => {
            if (ann.type === 'source') {
              return <CitationBlock key={ann.id} annotation={ann} />;
            }
            if (ann.type === 'simplification') {
              // Mode key is stored in ann.originalText per plan 05-06 convention
              const modeLabel = MODE_LABELS[ann.originalText] ?? ann.originalText;
              return (
                <SimplificationBlock
                  key={ann.id}
                  annotation={ann}
                  modeLabel={modeLabel}
                  onSelectMode={(mode) => {
                    onTryAnother?.(
                      message.id,
                      ann.id,
                      ann.targetText,
                      String(ann.paragraphIndex),
                      mode
                    );
                  }}
                />
              );
            }
            return null;
          })}

          {/* Loading shimmer — shown while an API call is in flight for this message */}
          {showPending && pendingAnnotation && (
            <div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-zinc-700 bg-zinc-800 p-3 animate-pulse">
              <div className="h-3 bg-zinc-600 rounded w-1/3 mb-3" />
              {pendingAnnotation.type === 'source' ? (
                <>
                  <div className="h-3 bg-zinc-600 rounded w-full mb-2" />
                  <div className="h-3 bg-zinc-600 rounded w-4/5 mb-2" />
                  <hr className="border-zinc-700 my-2" />
                  <div className="h-3 bg-zinc-600 rounded w-2/3" />
                </>
              ) : (
                <>
                  <div className="h-3 bg-zinc-600 rounded w-3/4 mb-2" />
                  <div className="h-10 bg-zinc-600 rounded w-full" />
                </>
              )}
            </div>
          )}

          {/* Inline error block — shown when API call failed for this message */}
          {showError && errorAnnotation && (
            <div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-red-800 bg-red-950 text-sm px-3 py-2 flex items-center justify-between"
              data-testid="annotation-error-block"
            >
              <span className="text-red-300 text-xs">
                {errorAnnotation.type === 'source'
                  ? "Couldn't load sources"
                  : "Couldn't simplify text"}
              </span>
              <button
                className="text-xs text-red-400 hover:text-red-200 underline ml-2"
                onClick={errorAnnotation.retryFn}
                data-testid="annotation-retry-btn"
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
