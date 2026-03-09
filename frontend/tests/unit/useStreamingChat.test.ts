/**
 * Test stubs for useStreamingChat hook
 * Requirements: CHAT-01, CHAT-03, CHAT-04
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── chat.ts AbortSignal tests ─────────────────────────────────────────────

// Helper: build a mock ReadableStream from an array of string chunks
function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

const noopGetToken = async () => null;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('streamChat AbortSignal handling', () => {
  it('treats AbortError as clean stop — calls onDone, not onError', async () => {
    // Import here to get fresh module reference
    const { streamChat } = await import('../../src/api/chat');

    const abortController = new AbortController();

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      // Simulate abort before fetch resolves
      abortController.abort();
      const err = new DOMException('The user aborted a request.', 'AbortError');
      throw err;
    });

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      { messages: [], signal: abortController.signal },
      noopGetToken,
      onChunk,
      onDone,
      onError
    );

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('passes signal to fetch options', async () => {
    const { streamChat } = await import('../../src/api/chat');

    const abortController = new AbortController();
    const body = makeStream(['data: {"type":"chunk","text":"hi"}\n\n']);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 })
    );

    await streamChat(
      { messages: [], signal: abortController.signal },
      noopGetToken,
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchInit.signal).toBe(abortController.signal);
  });
});

// ─── sessionStore setThreadTitle tests ────────────────────────────────────

describe('sessionStore setThreadTitle', () => {
  it('updates the thread title in state', async () => {
    const { useSessionStore } = await import('../../src/store/sessionStore');

    // Reset state
    useSessionStore.setState({ threads: {}, messages: {}, activeThreadId: null, session: null });

    // Create a thread manually
    const threadId = 'thread-abc';
    useSessionStore.setState({
      threads: {
        [threadId]: {
          id: threadId,
          depth: 0,
          parentThreadId: null,
          anchorText: null,
          parentMessageId: null,
          title: 'Old Title',
          accentColor: '#000',
          messageIds: [],
          childThreadIds: [],
          scrollPosition: 0,
        },
      },
    });

    useSessionStore.getState().setThreadTitle(threadId, 'New Title');

    const state = useSessionStore.getState();
    expect(state.threads[threadId]?.title).toBe('New Title');
  });
});

// ─── useStreamingChat hook tests ───────────────────────────────────────────

describe('useStreamingChat', () => {
  // CHAT-01: Message accumulation
  test.todo('sendMessage adds user message and empty AI placeholder to store');
  test.todo('AI message content accumulates chunks from onChunk calls');

  // CHAT-03: Context passing
  test.todo('sendMessage passes full thread message history to streamChat');

  // CHAT-04: Child thread support
  test.todo('hook works identically for child threads (multi-turn supported)');

  // Abort behavior
  test.todo('abort() sets isStreaming=false on the AI message');
});
