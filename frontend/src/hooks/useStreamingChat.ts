import { useRef, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { streamChat } from '../api/chat';
import type { Message } from '../types/index';

/**
 * Builds the system prompt for child thread conversations.
 * Pure function — exported for unit testing.
 */
export function buildChildSystemPrompt(anchorText: string, parentContext: string): string {
  return `You are in a focused sub-conversation about: ${anchorText}. Context from parent message: ${parentContext.slice(0, 200)}. Stay focused on this specific topic unless the user redirects.`;
}

/**
 * useStreamingChat
 *
 * Wires user text → API call → Zustand store update.
 * Uses an accumulator ref to build AI message content chunk-by-chunk.
 */
export function useStreamingChat(getToken: () => Promise<string | null>) {
  const store = useSessionStore();
  const accRef = useRef('');
  const abortRef = useRef<(() => void) | null>(null);
  const [rateLimitReset, setRateLimitReset] = useState<number | null>(null); // epoch ms
  const [streamError, setStreamError] = useState<{ messageId: string; retry: () => void } | null>(null);

  const { threads, messages, activeThreadId } = store;
  const activeThread = activeThreadId ? threads[activeThreadId] : null;

  // isStreaming: true if any message in the active thread is currently streaming
  const isStreaming = activeThread
    ? activeThread.messageIds.some((id) => messages[id]?.isStreaming === true)
    : false;

  async function sendMessage(text: string): Promise<void> {
    if (!activeThreadId || !activeThread) return;
    if (!text.trim()) return;

    // Clear previous error state on new send
    setStreamError(null);
    setRateLimitReset(null);

    // Reset accumulator at the start of each message (prevents content bleed)
    accRef.current = '';

    // Snapshot existing message IDs BEFORE any addMessage calls
    const existingMessageIds = [...(activeThread.messageIds ?? [])];
    const isFirstMessage = existingMessageIds.length === 0;

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      threadId: activeThreadId,
      role: 'user',
      content: text,
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    store.addMessage(userMsg);

    if (isFirstMessage) {
      const title = text.split(' ').slice(0, 6).join(' ');
      store.setThreadTitle(activeThreadId, title);
    }

    // Add empty AI placeholder message (streaming: true)
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      threadId: activeThreadId,
      role: 'assistant',
      content: '',
      annotations: [],
      childLeads: [],
      isStreaming: true,
      createdAt: Date.now(),
    };
    store.addMessage(aiMsg);

    // Build conversation history from snapshot (before addMessage calls) + new user message
    const existingMsgs = existingMessageIds
      .map((id) => messages[id])
      .filter(Boolean)
      .map((m) => ({ role: m!.role === 'assistant' ? 'model' : m!.role, content: m!.content }));

    const history = [...existingMsgs, { role: 'user' as const, content: text }];

    // Derive system instruction for child threads (depth >= 1)
    const systemInstruction =
      activeThread.depth >= 1
        ? buildChildSystemPrompt(
            activeThread.anchorText ?? '',
            activeThread.parentMessageId
              ? (messages[activeThread.parentMessageId]?.content ?? '')
              : ''
          )
        : '';

    // Create abort controller
    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      await streamChat(
        { messages: history, signal: controller.signal, systemInstruction },
        getToken,
        (chunk: string) => {
          accRef.current += chunk;
          store.updateMessage(aiMsgId, { content: accRef.current });
        },
        () => {
          // onDone
          store.setMessageStreaming(aiMsgId, false);
          accRef.current = '';
        },
        (errMsg: string) => {
          // onError — mid-stream failure (non-429)
          // Partial content stays visible; add error signal to message
          store.setMessageStreaming(aiMsgId, false);
          accRef.current = '';
          // Only set streamError if it's not a 429 (handled by onRateLimit)
          if (!errMsg.includes('429')) {
            setStreamError({
              messageId: aiMsgId,
              retry: () => void sendMessage(text),
            });
          }
        },
        (resetEpochMs: number) => {
          // onRateLimit
          setRateLimitReset(resetEpochMs);
          store.setMessageStreaming(aiMsgId, false);
          accRef.current = '';
        }
      );
    } finally {
      abortRef.current = null;
    }
  }

  function abort() {
    if (abortRef.current) {
      abortRef.current();
    }
  }

  // Compute minutes remaining from rateLimitReset
  const rateLimitMinutes = rateLimitReset
    ? Math.max(0, Math.ceil((rateLimitReset - Date.now()) / 60000))
    : null;

  return { sendMessage, abort, isStreaming, rateLimitMinutes, streamError };
}
