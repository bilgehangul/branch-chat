import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionStore } from '../../store/sessionStore';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { useTextSelection } from '../../hooks/useTextSelection';
import { ChatInput } from '../input/ChatInput';
import { MessageList } from './MessageList';
import { ContextCard } from './ContextCard';
import { ActionBubble } from '../branching/ActionBubble';
import { isAtMaxDepth } from '../../store/selectors';
import { getNextAccentColor } from '../../constants/theme';
import { GutterColumn } from '../branching/GutterColumn';
import { HighlightOverlay } from '../branching/HighlightOverlay';
import { searchSources, toSourceResult } from '../../api/search';
import { simplifyText } from '../../api/simplify';
import { createThreadOnBackend, updateThreadOnBackend, deleteThreadFromDB, updateMessageOnBackend } from '../../api/sessions';
import type { Annotation } from '../../types/index';

type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

// Ephemeral UI state — NOT in Zustand (loading/error do not survive thread switch; that's correct)
type PendingAnnotation = {
  type: 'source' | 'simplification';
  paragraphId: string;
  messageId: string;
};
type ErrorAnnotation = PendingAnnotation & { retryFn: () => void };

/**
 * ThreadView
 *
 * Scroll container + auto-scroll + 200ms slide transition + ChatInput wiring.
 * Also wires useTextSelection and ActionBubble for the "Go Deeper" branching flow.
 *
 * Branch pills (GutterColumn) are absolutely-positioned INSIDE the scroll container's
 * content wrapper so they scroll with the text, aligned to their anchor paragraph.
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
  const deleteThread = useSessionStore(s => s.deleteThread);
  const summarizeThread = useSessionStore(s => s.summarizeThread);
  const compactThread = useSessionStore(s => s.compactThread);
  const addAnnotation = useSessionStore(s => s.addAnnotation);
  const updateAnnotation = useSessionStore(s => s.updateAnnotation);

  const { sendMessage, abort, isStreaming, rateLimitMinutes, streamError } = useStreamingChat(getToken);

  // Derive current thread and ordered messages
  const activeThread = activeThreadId ? threads[activeThreadId] : null;
  const orderedMessages = activeThread
    ? activeThread.messageIds.map((id) => messages[id]).filter(Boolean) as import('../../types/index').Message[]
    : [];

  // Refs for scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref for the position:relative inner wrapper (GutterColumn measures relative to this)
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Slide transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevActiveThreadIdRef = useRef(activeThreadId);

  // Text selection bubble state
  const { bubble, clearBubble } = useTextSelection(scrollRef, contentWrapperRef);

  // Persist highlight rects after bubble dismiss (cleared on click elsewhere)
  const lastSelectionRectsRef = useRef<import('../../hooks/useTextSelection').SelectionRect[]>([]);

  // Update persisted rects when bubble changes
  useEffect(() => {
    if (bubble) {
      lastSelectionRectsRef.current = bubble.selectionRects;
    }
  }, [bubble]);

  // Clear persisted highlight rects when clicking outside the bubble
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Don't clear if clicking within a message (user might be re-selecting)
      const target = e.target as HTMLElement;
      const inBubble = target.closest?.('[data-action-bubble]');
      if (inBubble) return;

      // If bubble is already null (dismissed by scroll), clear the overlay
      if (!bubble) {
        lastSelectionRectsRef.current = [];
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bubble]);

  // Scroll-dismiss: dismiss ActionBubble after 100px of scrolling (TSEL-05)
  const initialScrollTopRef = useRef<number>(0);
  useEffect(() => {
    if (!bubble || !scrollRef.current) return;
    initialScrollTopRef.current = scrollRef.current.scrollTop;
    const scrollEl = scrollRef.current;

    function handleScrollDismiss() {
      const delta = Math.abs(scrollEl.scrollTop - initialScrollTopRef.current);
      if (delta > 100) {
        clearBubble();
      }
    }

    scrollEl.addEventListener('scroll', handleScrollDismiss, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScrollDismiss);
  }, [bubble, clearBubble]);

  // Loading state for summarize/compact operations
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  // Ephemeral annotation UI state (NOT in Zustand — doesn't survive thread nav, that's correct)
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [errorAnnotation, setErrorAnnotation] = useState<ErrorAnnotation | null>(null);

  // Real handleFindSources — calls searchSources API, manages loading/error/retry state
  async function handleFindSources(anchorText: string, paragraphId: string, messageId: string) {
    setErrorAnnotation(null);
    setPendingAnnotation({ type: 'source', paragraphId, messageId });

    const doFetch = async () => {
      setPendingAnnotation({ type: 'source', paragraphId, messageId });
      setErrorAnnotation(null);

      const response = await searchSources({ query: anchorText }, getToken);

      if (response.error || !response.data) {
        console.error('[handleFindSources] API error:', response.error);
        setPendingAnnotation(null);
        setErrorAnnotation({
          type: 'source',
          paragraphId,
          messageId,
          retryFn: doFetch,
        });
        return;
      }

      const { results, citationNote } = response.data;
      const existing = useSessionStore.getState().messages[messageId]?.annotations.find(
        a => a.type === 'source' && a.paragraphIndex === Number(paragraphId)
      );
      if (existing) {
        updateAnnotation(messageId, existing.id, {
          sources: results.map(toSourceResult),
          citationNote: citationNote ?? null,
          targetText: anchorText,
        });
      } else {
        addAnnotation(messageId, {
          id: crypto.randomUUID(),
          type: 'source',
          targetText: anchorText,
          paragraphIndex: Number(paragraphId),
          originalText: anchorText,
          replacementText: null,
          citationNote: citationNote ?? null,
          sources: results.map(toSourceResult),
          isShowingOriginal: false,
        });
      }
      setPendingAnnotation(null);
      // Persist updated annotations (fire-and-forget)
      const updatedAnnotations = useSessionStore.getState().messages[messageId]?.annotations;
      if (updatedAnnotations) {
        void updateMessageOnBackend(messageId, { annotations: updatedAnnotations }, getToken);
      }
    };

    await doFetch();
  }

  // Real handleSimplify — calls simplifyText API, handles addAnnotation vs updateAnnotation
  async function handleSimplify(
    anchorText: string,
    paragraphId: string,
    messageId: string,
    mode: SimplifyMode
  ) {
    setErrorAnnotation(null);
    setPendingAnnotation({ type: 'simplification', paragraphId, messageId });

    const doFetch = async () => {
      setPendingAnnotation({ type: 'simplification', paragraphId, messageId });
      setErrorAnnotation(null);

      const response = await simplifyText({ text: anchorText, mode }, getToken);

      if (response.error || !response.data) {
        console.error('[handleSimplify] API error:', response.error);
        setPendingAnnotation(null);
        setErrorAnnotation({
          type: 'simplification',
          paragraphId,
          messageId,
          retryFn: doFetch,
        });
        return;
      }

      const { rewritten } = response.data;

      // Check for existing simplification annotation on this paragraph (INLINE-07 / no-duplicate rule)
      const msgState = useSessionStore.getState().messages[messageId];
      const existing = msgState?.annotations.find(
        a => a.type === 'simplification' && a.paragraphIndex === Number(paragraphId)
      );

      if (existing) {
        // Update in place — "Try another mode" case; no duplicate block
        updateAnnotation(messageId, existing.id, {
          replacementText: rewritten,
          originalText: mode, // update mode key stored in originalText
        });
      } else {
        const annotation: Annotation = {
          id: crypto.randomUUID(),
          type: 'simplification',
          targetText: anchorText,
          paragraphIndex: Number(paragraphId),
          originalText: mode,        // stores the mode key (e.g. 'simpler') — used by SimplificationBlock
          replacementText: rewritten,
          citationNote: null,
          sources: [],
          isShowingOriginal: false,
        };
        addAnnotation(messageId, annotation);
      }
      setPendingAnnotation(null);
      // Persist updated annotations (fire-and-forget)
      const updatedAnnotations = useSessionStore.getState().messages[messageId]?.annotations;
      if (updatedAnnotations) {
        void updateMessageOnBackend(messageId, { annotations: updatedAnnotations }, getToken);
      }
    };

    await doFetch();
  }

  // handleTryAnother — re-calls handleSimplify with new mode (SimplificationBlock "Try another mode" flow)
  function handleTryAnother(
    messageId: string,
    _annotationId: string,
    anchorText: string,
    paragraphId: string,
    mode: SimplifyMode
  ) {
    void handleSimplify(anchorText, paragraphId, messageId, mode);
  }

  // Handle Go Deeper click: create child thread using bubble.messageId directly
  // IMPORTANT: bubble.messageId is used directly — NOT the last-AI-message heuristic.
  function handleGoDeeper() {
    if (!bubble || !activeThread || !activeThreadId) return;
    const { anchorText, paragraphId, messageId } = bubble;
    const accentColor = getNextAccentColor(activeThread);
    const title = anchorText.slice(0, 35);
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
    // Persist child thread to MongoDB (fire-and-forget)
    const sessionId = useSessionStore.getState().session?.id;
    if (sessionId) {
      void createThreadOnBackend({
        threadId: newThreadId,
        sessionId,
        parentThreadId: activeThreadId,
        depth: (activeThread.depth ?? 0) + 1,
        anchorText,
        parentMessageId: messageId || null,
        title,
        accentColor,
      }, getToken);
    }
    // Persist parent message childLeads (fire-and-forget)
    if (messageId) {
      const updatedChildLeads = useSessionStore.getState().messages[messageId]?.childLeads;
      if (updatedChildLeads) {
        void updateMessageOnBackend(messageId, { childLeads: updatedChildLeads }, getToken);
      }
    }
  }

  // Track activeThreadId changes for scroll save + slide transition
  useEffect(() => {
    const prevId = prevActiveThreadIdRef.current;
    if (prevId !== activeThreadId) {
      // Save scroll position of the thread we're leaving
      if (prevId && scrollRef.current) {
        setScrollPosition(prevId, scrollRef.current.scrollTop);
        void updateThreadOnBackend(prevId, { scrollPosition: scrollRef.current.scrollTop }, getToken);
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

  const hasChildThreads = activeThread && activeThread.childThreadIds.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/*
          position:relative wrapper — GutterColumn pills are absolutely-positioned
          inside this wrapper so they scroll with content and align to their anchor paragraph.
        */}
        <div ref={contentWrapperRef} className="relative px-4">
          {/* Slide transition wrapper — right padding reserves space for pills */}
          <div
            className={`transition-transform duration-200 ease-out ${
              isTransitioning ? 'translate-x-[-100%]' : 'translate-x-0'
            } ${hasChildThreads ? 'pr-[80px] sm:pr-[140px]' : ''}`}
          >
            {operationLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 rounded-lg mx-4 mt-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing...
              </div>
            )}
            {activeThread ? (
              orderedMessages.length > 0 ? (
                <MessageList
                  messages={orderedMessages}
                  thread={activeThread}
                  onTryAnother={handleTryAnother}
                  pendingAnnotation={pendingAnnotation}
                  errorAnnotation={errorAnnotation}
                />
              ) : (
                <>
                  {/* Always show anchor context for child threads even before first message */}
                  <ContextCard thread={activeThread} />
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-slate-400 text-sm">Ask anything to begin</p>
                  </div>
                </>
              )
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-slate-400 text-sm">Ask anything to begin</p>
              </div>
            )}
            {/* Bottom anchor for auto-scroll */}
            <div ref={bottomAnchorRef} />
          </div>

          {/* Highlight overlay: absolutely positioned rects over selected text, scrolls with content */}
          {/* Persists after bubble dismiss (scroll-dismiss); clears on click elsewhere */}
          {(bubble || lastSelectionRectsRef.current.length > 0) && (
            <HighlightOverlay rects={bubble ? bubble.selectionRects : lastSelectionRectsRef.current} annotationType={undefined} />
          )}

          {/* Branch pills: absolutely positioned inside the relative wrapper, scrolls with content */}
          {activeThread && (
            <GutterColumn
              wrapperRef={contentWrapperRef}
              activeThread={activeThread}
              threads={threads}
              messages={messages}
              onNavigate={setActiveThread}
              onDeleteThread={(threadId) => {
                deleteThread(threadId);
                void deleteThreadFromDB(threadId, getToken);
              }}
              onSummarize={async (threadId) => {
                setOperationLoading(threadId);
                try {
                  // Snapshot child thread count before summarize
                  const beforeChildIds = new Set(
                    useSessionStore.getState().threads[threadId]?.childThreadIds ?? []
                  );
                  await summarizeThread(threadId, getToken);
                  // Find the newly created summary child thread and persist it
                  const sessionId = useSessionStore.getState().session?.id;
                  if (sessionId) {
                    const parentThread = useSessionStore.getState().threads[threadId];
                    for (const cid of (parentThread?.childThreadIds ?? [])) {
                      if (!beforeChildIds.has(cid)) {
                        const ct = useSessionStore.getState().threads[cid];
                        if (ct) {
                          void createThreadOnBackend({
                            threadId: cid,
                            sessionId,
                            parentThreadId: threadId,
                            depth: ct.depth,
                            anchorText: ct.anchorText ?? '',
                            parentMessageId: ct.parentMessageId,
                            title: ct.title,
                            accentColor: ct.accentColor,
                          }, getToken);
                        }
                      }
                    }
                  }
                } finally {
                  setOperationLoading(null);
                }
              }}
              onCompact={async (threadId) => {
                setOperationLoading(threadId);
                try {
                  // Snapshot child thread IDs before compact (those will be deleted)
                  const childIds = useSessionStore.getState().threads[threadId]?.childThreadIds ?? [];
                  await compactThread(threadId, getToken);
                  // Fire-and-forget delete each top-level child from backend (DB cascades)
                  for (const cid of childIds) {
                    void deleteThreadFromDB(cid, getToken);
                  }
                } finally {
                  setOperationLoading(null);
                }
              }}
            />
          )}

          {/* ActionBubble: absolutely positioned inside contentWrapperRef, scrolls with content */}
          {bubble && activeThread && (
            <ActionBubble
              bubble={{
                anchorText: bubble.anchorText,
                paragraphId: bubble.paragraphId,
                messageId: bubble.messageId,
                top: bubble.absoluteTop,
                left: bubble.absoluteLeft,
              }}
              isAtMaxDepth={isAtMaxDepth(activeThread)}
              flipped={bubble.absoluteTop < 60}
              onGoDeeper={handleGoDeeper}
              onFindSources={(anchorText, paragraphId, messageId) =>
                void handleFindSources(anchorText, paragraphId, messageId)
              }
              onSimplify={(anchorText, paragraphId, messageId, mode) =>
                void handleSimplify(anchorText, paragraphId, messageId, mode as SimplifyMode)
              }
              onDismiss={clearBubble}
            />
          )}
        </div>
      </div>

      {/* Chat input at bottom */}
      <ChatInput
        onSend={sendMessage}
        onStop={abort}
        isStreaming={isStreaming}
        rateLimitMinutes={rateLimitMinutes}
        streamError={streamError}
      />
    </div>
  );
}
