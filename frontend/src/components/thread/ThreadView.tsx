import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * Scroll container + auto-scroll + ChatInput wiring.
 * Uses CSS Grid (1fr auto) for message-pill alignment.
 * Also wires useTextSelection and ActionBubble for the "Go Deeper" branching flow.
 *
 * Branch pills are rendered inline by MessageList in grid column 2,
 * aligned to their anchor message's grid row. No JS measurement needed.
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
  const orderedMessages = useMemo(
    () => (
      activeThread
        ? activeThread.messageIds.map((id) => messages[id]).filter(Boolean) as import('../../types/index').Message[]
        : []
    ),
    [activeThread, messages]
  );

  // Refs for scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Thread crossfade transition state (PILL-04, PILL-05)
  const [fadeState, setFadeState] = useState<'idle' | 'fading-out' | 'fading-in'>('idle');
  const targetThreadIdRef = useRef(activeThreadId);
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const prevActiveThreadIdRef = useRef(activeThreadId);

  // Text selection bubble state
  const { bubble, clearBubble } = useTextSelection(scrollRef);


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
  const annotationAbortRef = useRef<AbortController | null>(null);

  const cancelAnnotation = useCallback(() => {
    annotationAbortRef.current?.abort();
    annotationAbortRef.current = null;
    setPendingAnnotation(null);
    setErrorAnnotation(null);
  }, []);

  // Real handleFindSources — calls searchSources API, manages loading/error/retry state
  const handleFindSources = useCallback(async (anchorText: string, paragraphId: string, messageId: string) => {
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
  }, [addAnnotation, getToken, updateAnnotation]);

  // Real handleSimplify — calls simplifyText API, handles addAnnotation vs updateAnnotation
  const handleSimplify = useCallback(async (
    anchorText: string,
    paragraphId: string,
    messageId: string,
    mode: SimplifyMode
  ) => {
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
  }, [addAnnotation, getToken, updateAnnotation]);

  // handleTryAnother — re-calls handleSimplify with new mode (SimplificationBlock "Try another mode" flow)
  const handleTryAnother = useCallback((
    messageId: string,
    _annotationId: string,
    anchorText: string,
    paragraphId: string,
    mode: SimplifyMode
  ) => {
    void handleSimplify(anchorText, paragraphId, messageId, mode);
  }, [handleSimplify]);

  // Handle Go Deeper click: create child thread using bubble.messageId directly
  // IMPORTANT: bubble.messageId is used directly — NOT the last-AI-message heuristic.
  const handleGoDeeper = useCallback(() => {
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
  }, [activeThread, activeThreadId, addChildLead, bubble, clearBubble, createThread, getToken, setActiveThread]);

  // Crossfade transition: fade-out (75ms) -> swap content + restore scroll -> fade-in (75ms)
  useEffect(() => {
    const prevId = prevActiveThreadIdRef.current;
    if (prevId === activeThreadId) return;

    // Save scroll position of the thread we're leaving
    if (prevId && scrollRef.current) {
      setScrollPosition(prevId, scrollRef.current.scrollTop);
      void updateThreadOnBackend(prevId, { scrollPosition: scrollRef.current.scrollTop }, getToken);
    }

    // Cancel any in-progress fade (interruptibility — PILL-05)
    clearTimeout(fadeTimerRef.current);

    // Update target — used to detect interruption mid-fade
    targetThreadIdRef.current = activeThreadId;

    // Start fade-out
    setFadeState('fading-out');

    fadeTimerRef.current = window.setTimeout(() => {
      // Check if we were interrupted (rapid A->B->C navigation)
      if (targetThreadIdRef.current !== activeThreadId) return;

      // Swap to new thread content
      prevActiveThreadIdRef.current = activeThreadId;

      // Restore scroll position while content is invisible (opacity 0)
      if (scrollRef.current) {
        const incomingThread = activeThreadId ? threads[activeThreadId] : null;
        const savedPosition = incomingThread?.scrollPosition ?? 0;
        scrollRef.current.scrollTop = savedPosition;
        const el = scrollRef.current;
        isAtBottomRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
      }

      // Start fade-in
      setFadeState('fading-in');

      fadeTimerRef.current = window.setTimeout(() => {
        setFadeState('idle');
      }, 75);
    }, 75);

    return () => clearTimeout(fadeTimerRef.current);
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

  // Handler wrappers for pill actions (same logic as previously passed to GutterColumn)
  const handleDeleteThread = useCallback((threadId: string) => {
    deleteThread(threadId);
    void deleteThreadFromDB(threadId, getToken);
  }, [deleteThread, getToken]);

  const handleSummarize = useCallback(async (threadId: string) => {
    setOperationLoading(threadId);
    try {
      const beforeChildIds = new Set(
        useSessionStore.getState().threads[threadId]?.childThreadIds ?? []
      );
      await summarizeThread(threadId, getToken);
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
  }, [getToken, summarizeThread]);

  const handleCompact = useCallback(async (threadId: string) => {
    setOperationLoading(threadId);
    try {
      const childIds = useSessionStore.getState().threads[threadId]?.childThreadIds ?? [];
      await compactThread(threadId, getToken);
      for (const cid of childIds) {
        void deleteThreadFromDB(cid, getToken);
      }
    } finally {
      setOperationLoading(null);
    }
  }, [compactThread, getToken]);

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/*
          CSS Grid wrapper — messages in column 1, pills in auto-sized column 2.
          Pills align to their anchor message's grid row with zero JS measurement.
          The auto column collapses to 0px when no pills exist.
        */}
        <div className={`grid px-4 ${fadeState === 'fading-out' ? 'opacity-0 transition-opacity duration-[75ms]' : fadeState === 'fading-in' ? 'opacity-100 transition-opacity duration-[75ms]' : 'opacity-100'}`} style={{ gridTemplateColumns: '1fr auto' }}>
          {operationLoading && (
            <div className="col-span-full flex items-center gap-2 px-4 py-2 text-sm text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 rounded-lg mx-4 mt-2">
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
                threads={threads}
                allMessages={messages}
                onNavigate={setActiveThread}
                onDeleteThread={handleDeleteThread}
                onSummarize={handleSummarize}
                onCompact={handleCompact}
                onTryAnother={handleTryAnother}
                pendingAnnotation={pendingAnnotation}
                errorAnnotation={errorAnnotation}
                onCancelAnnotation={cancelAnnotation}
              />
            ) : (
              <>
                {/* Always show anchor context for child threads even before first message */}
                <div className="col-span-full">
                  <ContextCard thread={activeThread} />
                </div>
                <div className="col-span-full flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-slate-400 text-sm">Ask anything to begin</p>
                </div>
              </>
            )
          ) : (
            <div className="col-span-full flex items-center justify-center h-full min-h-[200px]">
              <p className="text-slate-400 text-sm">Ask anything to begin</p>
            </div>
          )}
          {/* Bottom anchor for auto-scroll */}
          <div ref={bottomAnchorRef} className="col-span-full" />
        </div>
      </div>

      {/* Portal: ActionBubble + HighlightOverlay rendered outside the grid (position:fixed) */}
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
          onGoDeeper={handleGoDeeper}
          onFindSources={(anchorText, paragraphId, messageId) =>
            void handleFindSources(anchorText, paragraphId, messageId)
          }
          onSimplify={(anchorText, paragraphId, messageId, mode) =>
            void handleSimplify(anchorText, paragraphId, messageId, mode as SimplifyMode)
          }
          onDismiss={clearBubble}
        />,
        document.body
      )}

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
