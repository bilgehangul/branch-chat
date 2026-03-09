import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useSessionStore } from '../../store/sessionStore';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { useTextSelection } from '../../hooks/useTextSelection';
import { ChatInput } from '../input/ChatInput';
import { MessageList } from './MessageList';
import { ActionBubble } from '../branching/ActionBubble';
import { isAtMaxDepth } from '../../store/selectors';
import { getNextAccentColor } from '../../constants/theme';
import { GutterColumn } from '../branching/GutterColumn';

/**
 * ThreadView
 *
 * Scroll container + auto-scroll + 200ms slide transition + ChatInput wiring.
 * Also wires useTextSelection and ActionBubble for the "Go Deeper" branching flow.
 *
 * This is the ONLY place useStreamingChat is called.
 */
export function ThreadView() {
  const { getToken } = useAuth();

  // Separate selector calls to avoid getSnapshot infinite loop (Phase 03-04 decision)
  const threads = useSessionStore(s => s.threads);
  const messages = useSessionStore(s => s.messages);
  const activeThreadId = useSessionStore(s => s.activeThreadId);
  const setScrollPosition = useSessionStore(s => s.setScrollPosition);
  const createThread = useSessionStore(s => s.createThread);
  const addChildLead = useSessionStore(s => s.addChildLead);
  const setActiveThread = useSessionStore(s => s.setActiveThread);

  const { sendMessage, abort, isStreaming } = useStreamingChat(getToken);

  // Derive current thread and ordered messages
  const activeThread = activeThreadId ? threads[activeThreadId] : null;
  const orderedMessages = activeThread
    ? activeThread.messageIds.map((id) => messages[id]).filter(Boolean) as import('../../types/index').Message[]
    : [];

  // Refs for scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Slide transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevActiveThreadIdRef = useRef(activeThreadId);

  // Text selection bubble state
  const { bubble, clearBubble } = useTextSelection(scrollRef);

  // Handle Go Deeper click: create child thread using bubble.messageId directly
  // IMPORTANT: bubble.messageId is used directly — NOT the last-AI-message heuristic.
  function handleGoDeeper() {
    if (!bubble || !activeThread || !activeThreadId) return;
    const { anchorText, paragraphId, messageId } = bubble;
    const accentColor = getNextAccentColor(activeThread);
    const title = anchorText.split(' ').slice(0, 6).join(' ');
    const newThreadId = createThread({
      parentThreadId: activeThreadId,
      anchorText,
      parentMessageId: messageId || null,
      title,
      accentColor,
    });
    if (messageId) {
      addChildLead(messageId, {
        threadId: newThreadId,
        paragraphIndex: Number(paragraphId),
        anchorText,
        messageCount: 0,
      });
    }
    clearBubble();
    setActiveThread(newThreadId);
  }

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
          // After restoring position, determine if user is at bottom
          const el = scrollRef.current;
          isAtBottomRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  // Auto-scroll: follow new messages only if user is already at the bottom
  useEffect(() => {
    if (isAtBottomRef.current && bottomAnchorRef.current) {
      if (typeof bottomAnchorRef.current.scrollIntoView === 'function') {
        bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [orderedMessages.length, orderedMessages[orderedMessages.length - 1]?.content]);

  // Passive scroll listener to track whether user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      isAtBottomRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
    }

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Save scroll on unmount
  useEffect(() => {
    return () => {
      const currentId = useSessionStore.getState().activeThreadId;
      if (currentId && scrollRef.current) {
        useSessionStore.getState().setScrollPosition(currentId, scrollRef.current.scrollTop);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area + gutter row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4"
        >
          {/* Slide transition wrapper */}
          <div
            className={`transition-transform duration-200 ease-out ${
              isTransitioning ? 'translate-x-[-100%]' : 'translate-x-0'
            }`}
          >
            {activeThread ? (
              orderedMessages.length > 0 ? (
                <MessageList messages={orderedMessages} thread={activeThread} />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-zinc-400 text-sm">Ask anything to begin</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-zinc-400 text-sm">Ask anything to begin</p>
              </div>
            )}
            {/* Bottom anchor for auto-scroll */}
            <div ref={bottomAnchorRef} />
          </div>
        </div>

        {/* Gutter — only renders when thread has child branches */}
        {activeThread && (
          <GutterColumn
            scrollContainerRef={scrollRef}
            activeThread={activeThread}
            threads={threads}
            messages={messages}
            onNavigate={setActiveThread}
          />
        )}
      </div>

      {/* ActionBubble: appears on valid text selection when not at max depth */}
      {bubble && activeThread && (
        <ActionBubble
          bubble={bubble}
          isAtMaxDepth={isAtMaxDepth(activeThread)}
          onGoDeeper={handleGoDeeper}
          onDismiss={clearBubble}
        />
      )}

      {/* Chat input at bottom */}
      <ChatInput
        onSend={sendMessage}
        onStop={abort}
        isStreaming={isStreaming}
      />
    </div>
  );
}
