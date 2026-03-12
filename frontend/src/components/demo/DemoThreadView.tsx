import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../../store/sessionStore';
import { useTextSelection } from '../../hooks/useTextSelection';
import { MessageList } from '../thread/MessageList';
import type { Message } from '../../types/index';
import { ActionBubble } from '../branching/ActionBubble';
import { isAtMaxDepth } from '../../store/selectors';

/**
 * DemoThreadView -- simplified ThreadView for unauthenticated demo mode.
 *
 * Reads from the hydrated Zustand store (same as real ThreadView) but does NOT
 * use useAuth, useStreamingChat, useTextSelection, ActionBubble, or any API modules.
 * Chat input is replaced with a disabled sign-in CTA footer.
 */
export function DemoThreadView({ onSignInClick }: { onSignInClick: () => void }) {
  // Read from Zustand store -- same pattern as real ThreadView
  const threads = useSessionStore(s => s.threads);
  const messages = useSessionStore(s => s.messages);
  const activeThreadId = useSessionStore(s => s.activeThreadId);
  const setScrollPosition = useSessionStore(s => s.setScrollPosition);
  const setActiveThread = useSessionStore(s => s.setActiveThread);

  // Derive active thread and ordered messages
  const activeThread = activeThreadId ? threads[activeThreadId] : null;
  const orderedMessages = useMemo(
    () => (
      activeThread
        ? activeThread.messageIds.map(id => messages[id]).filter(Boolean) as Message[]
        : []
    ),
    [activeThread, messages]
  );

  // Refs for scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Slide transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevActiveThreadIdRef = useRef(activeThreadId);
  const { bubble, clearBubble } = useTextSelection(scrollRef);

  // Scroll-dismiss: mirror authenticated behavior for selection menu.
  const initialScrollTopRef = useRef<number>(0);
  useEffect(() => {
    if (!bubble || !scrollRef.current) return;
    initialScrollTopRef.current = scrollRef.current.scrollTop;
    const scrollEl = scrollRef.current;

    function handleScrollDismiss() {
      const delta = Math.abs(scrollEl.scrollTop - initialScrollTopRef.current);
      if (delta > 100) clearBubble();
    }

    scrollEl.addEventListener('scroll', handleScrollDismiss, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScrollDismiss);
  }, [bubble, clearBubble]);

  // Track activeThreadId changes for scroll save + slide transition
  useEffect(() => {
    const prevId = prevActiveThreadIdRef.current;
    if (prevId !== activeThreadId) {
      // Save scroll position of the thread we're leaving
      if (prevId && scrollRef.current) {
        setScrollPosition(prevId, scrollRef.current.scrollTop);
      }

      // Trigger slide transition
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 200);

      prevActiveThreadIdRef.current = activeThreadId;
      return () => clearTimeout(timer);
    }
  }, [activeThreadId, setScrollPosition]);

  // Restore scroll position when active thread changes
  useEffect(() => {
    if (activeThread && scrollRef.current) {
      const savedPosition = activeThread.scrollPosition ?? 0;
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = savedPosition;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  const handleSignInFromBubble = useCallback(() => {
    clearBubble();
    onSignInClick();
  }, [clearBubble, onSignInClick]);

  const handleNoopThreadAction = useCallback(() => {}, []);
  const handleTryAnother = useCallback(() => {
    onSignInClick();
  }, [onSignInClick]);

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative px-4">
          {/* Slide transition wrapper */}
          <div
            className={`transition-transform duration-200 ease-out ${
              isTransitioning ? 'translate-x-[-100%]' : 'translate-x-0'
            }`}
          >
            {activeThread && orderedMessages.length > 0 ? (
              <MessageList
                messages={orderedMessages}
                thread={activeThread}
                threads={threads}
                allMessages={messages}
                onNavigate={setActiveThread}
                onDeleteThread={handleNoopThreadAction}
                onSummarize={handleNoopThreadAction}
                onCompact={handleNoopThreadAction}
                onTryAnother={handleTryAnother}
                pendingAnnotation={null}
                errorAnnotation={null}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-slate-400 text-sm">Loading demo...</p>
              </div>
            )}
            {/* Bottom anchor */}
            <div ref={bottomAnchorRef} />
          </div>
        </div>
      </div>

      {/* Selection action bubble (demo mode: all actions open sign-in modal) */}
      {bubble && activeThread && createPortal(
        <ActionBubble
          bubble={{
            anchorText: bubble.anchorText,
            paragraphId: bubble.paragraphId,
            messageId: bubble.messageId,
            top: bubble.top,
            left: bubble.left,
          }}
          isAtMaxDepth={isAtMaxDepth(activeThread)}
          flipped={bubble.top < 80}
          onGoDeeper={(_anchorText, _paragraphId) => handleSignInFromBubble()}
          onFindSources={(_anchorText, _paragraphId, _messageId) => handleSignInFromBubble()}
          onSimplify={(_anchorText, _paragraphId, _messageId, _mode) => handleSignInFromBubble()}
          onDismiss={clearBubble}
        />,
        document.body
      )}

      {/* Disabled CTA footer -- replaces ChatInput */}
      <footer className="border-t border-stone-200 dark:border-zinc-700 p-4 shrink-0 bg-white dark:bg-zinc-900">
        <div className="max-w-[720px] mx-auto flex items-center gap-2">
          <textarea
            disabled
            rows={1}
            placeholder="Sign in to start your own conversation..."
            className="flex-1 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm text-stone-400 dark:text-zinc-500 placeholder-stone-400 dark:placeholder-zinc-600 cursor-not-allowed resize-none"
          />
          <button
            onClick={onSignInClick}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors whitespace-nowrap font-medium"
          >
            Sign in to start chatting
          </button>
        </div>
      </footer>
    </div>
  );
}
