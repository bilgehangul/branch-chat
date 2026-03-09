/**
 * Tests for useStreamingChat hook
 * Requirements: CHAT-01, CHAT-03, CHAT-04
 *
 * Uses vi.mock for dependencies. AbortSignal tests live in api.chat.test.ts.
 * setThreadTitle store test lives in sessionStore.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Thread, Message } from '../../src/types/index';
import { buildChildSystemPrompt } from '../../src/hooks/useStreamingChat';

const noopGetToken = async () => null;

// ─── Module mocks (hoisted) ─────────────────────────────────────────────────

vi.mock('../../src/api/chat', () => ({
  streamChat: vi.fn(),
}));

// Shared mutable state object for the store mock
const mockState = {
  session: null as null,
  threads: {} as Record<string, Thread>,
  messages: {} as Record<string, Message>,
  activeThreadId: null as string | null,
  createSession: vi.fn(),
  clearSession: vi.fn(),
  createThread: vi.fn(() => 'new-thread-id'),
  setActiveThread: vi.fn(),
  addMessage: vi.fn((msg: Message) => {
    mockState.messages[msg.id] = msg;
    const thread = mockState.threads[msg.threadId];
    if (thread) {
      thread.messageIds = [...thread.messageIds, msg.id];
    }
  }),
  updateMessage: vi.fn((id: string, patch: Partial<Message>) => {
    if (mockState.messages[id]) {
      mockState.messages[id] = { ...mockState.messages[id]!, ...patch };
    }
  }),
  setMessageStreaming: vi.fn((id: string, isStreaming: boolean) => {
    if (mockState.messages[id]) {
      mockState.messages[id] = { ...mockState.messages[id]!, isStreaming };
    }
  }),
  addChildLead: vi.fn(),
  addAnnotation: vi.fn(),
  setScrollPosition: vi.fn(),
  setThreadTitle: vi.fn(),
};

vi.mock('../../src/store/sessionStore', () => {
  const useSessionStore = vi.fn(() => mockState);
  (useSessionStore as unknown as { getState: () => typeof mockState }).getState = vi.fn(() => mockState);
  (useSessionStore as unknown as { setState: (p: Partial<typeof mockState>) => void }).setState = vi.fn(
    (partial: Partial<typeof mockState>) => { Object.assign(mockState, partial); }
  );
  (useSessionStore as unknown as { subscribe: ReturnType<typeof vi.fn> }).subscribe = vi.fn();
  (useSessionStore as unknown as { destroy: ReturnType<typeof vi.fn> }).destroy = vi.fn();
  return { useSessionStore };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 'test-thread-id',
    depth: 0,
    parentThreadId: null,
    anchorText: null,
    parentMessageId: null,
    title: 'New Thread',
    accentColor: '#2D7DD2',
    messageIds: [],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> & { id: string; threadId: string; role: 'user' | 'assistant' }): Message {
  return {
    content: '',
    annotations: [],
    childLeads: [],
    isStreaming: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useStreamingChat', () => {
  const DEFAULT_THREAD_ID = 'test-thread-id';

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mutable mock state
    mockState.threads = { [DEFAULT_THREAD_ID]: makeThread() };
    mockState.messages = {};
    mockState.activeThreadId = DEFAULT_THREAD_ID;
    mockState.session = null;

    // Re-bind the method implementations (clearAllMocks clears mock.calls but not implementations)
    mockState.addMessage.mockImplementation((msg: Message) => {
      mockState.messages[msg.id] = msg;
      const thread = mockState.threads[msg.threadId];
      if (thread) {
        thread.messageIds = [...thread.messageIds, msg.id];
      }
    });
    mockState.updateMessage.mockImplementation((id: string, patch: Partial<Message>) => {
      if (mockState.messages[id]) {
        mockState.messages[id] = { ...mockState.messages[id]!, ...patch };
      }
    });
    mockState.setMessageStreaming.mockImplementation((id: string, isStreaming: boolean) => {
      if (mockState.messages[id]) {
        mockState.messages[id] = { ...mockState.messages[id]!, isStreaming };
      }
    });
  });

  // CHAT-01: Message accumulation
  it('sendMessage adds user message and empty AI placeholder to store', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      onChunk: (text: string) => void,
      onDone: () => void,
    ) => {
      onChunk('Hello');
      onDone();
    });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(mockState.addMessage).toHaveBeenCalledTimes(2);
    const calls = mockState.addMessage.mock.calls;
    expect(calls[0][0].role).toBe('user');
    expect(calls[0][0].content).toBe('Test message');
    expect(calls[1][0].role).toBe('assistant');
    expect(calls[1][0].content).toBe('');
    expect(calls[1][0].isStreaming).toBe(true);
  });

  it('AI message content accumulates chunks via accRef (not raw chunk assignment)', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      onChunk: (text: string) => void,
      onDone: () => void,
    ) => {
      onChunk('Hello');
      onChunk(' World');
      onDone();
    });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    // updateMessage should have been called with accumulated content
    const updateCalls = mockState.updateMessage.mock.calls;
    const contentUpdates = updateCalls.filter(
      (c: unknown[]) => typeof (c[1] as Record<string, unknown>).content === 'string'
    );
    expect(contentUpdates.length).toBeGreaterThanOrEqual(2);
    // Last content update should be the full accumulated string
    const lastContent = (contentUpdates[contentUpdates.length - 1][1] as { content: string }).content;
    expect(lastContent).toBe('Hello World');
  });

  // CHAT-03: Context passing
  it('sendMessage passes full thread message history to streamChat', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    // Pre-populate thread with existing messages
    const existingUserMsg = makeMessage({
      id: 'msg-1', threadId: DEFAULT_THREAD_ID, role: 'user', content: 'Previous question',
    });
    const existingAiMsg = makeMessage({
      id: 'msg-2', threadId: DEFAULT_THREAD_ID, role: 'assistant', content: 'Previous answer',
    });
    mockState.messages = { 'msg-1': existingUserMsg, 'msg-2': existingAiMsg };
    mockState.threads = {
      [DEFAULT_THREAD_ID]: makeThread({ messageIds: ['msg-1', 'msg-2'] }),
    };

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => { onDone(); });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('New question');
    });

    expect(mockStreamChat).toHaveBeenCalledTimes(1);
    const body = mockStreamChat.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    // History: 2 existing + 1 new user message = 3
    expect(body.messages.length).toBe(3);
    expect(body.messages[0]).toEqual({ role: 'user', content: 'Previous question' });
    expect(body.messages[1]).toEqual({ role: 'model', content: 'Previous answer' });
    expect(body.messages[2]).toEqual({ role: 'user', content: 'New question' });
  });

  // CHAT-04: Child thread support
  it('hook works identically for child threads (multi-turn supported)', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    const childThreadId = 'child-thread-id';
    mockState.activeThreadId = childThreadId;
    mockState.threads = {
      [childThreadId]: makeThread({
        id: childThreadId,
        depth: 1,
        parentThreadId: 'parent-id',
        anchorText: 'some text',
        parentMessageId: 'parent-msg',
        title: 'Child',
      }),
    };
    mockState.messages = {};

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      onChunk: (text: string) => void,
      onDone: () => void,
    ) => {
      onChunk('child response');
      onDone();
    });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Child question');
    });

    expect(mockState.addMessage).toHaveBeenCalledTimes(2);
    const userMsgCall = mockState.addMessage.mock.calls[0][0] as Message;
    expect(userMsgCall.threadId).toBe(childThreadId);
  });

  // Abort behavior
  it('abort() cancels in-flight stream and cleans up streaming state', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => { resolveStream = resolve; });

    mockStreamChat.mockImplementationOnce(async (
      body: { signal?: AbortSignal },
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => {
      if (body.signal) {
        body.signal.addEventListener('abort', () => {
          onDone();
          resolveStream!();
        });
      }
      await streamPromise;
    });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage('Hello');
    });

    act(() => {
      result.current.abort();
    });

    await act(async () => {
      await sendPromise!;
    });

    expect(mockState.setMessageStreaming).toHaveBeenCalledWith(expect.any(String), false);
  });

  // Thread title
  it('sets thread title to first 6 words on first message in thread', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => { onDone(); });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('One two three four five six seven eight');
    });

    expect(mockState.setThreadTitle).toHaveBeenCalledWith(
      DEFAULT_THREAD_ID,
      'One two three four five six'
    );
  });

  it('does NOT set thread title when thread already has messages', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    // Thread already has a message
    mockState.threads[DEFAULT_THREAD_ID]!.messageIds = ['existing-msg'];

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => { onDone(); });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Follow-up question');
    });

    expect(mockState.setThreadTitle).not.toHaveBeenCalled();
  });

  // BRANCH-04: System prompt injection for child threads
  it('depth=0 thread sends no systemInstruction (empty string or absent)', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    // DEFAULT thread is depth=0
    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => { onDone(); });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Root message');
    });

    expect(mockStreamChat).toHaveBeenCalledTimes(1);
    const body = mockStreamChat.mock.calls[0][0] as { systemInstruction?: string };
    // depth=0 should have empty or absent systemInstruction
    expect(body.systemInstruction ?? '').toBe('');
  });

  it('depth=1 thread sends systemInstruction containing anchorText and parent context', async () => {
    const { useStreamingChat } = await import('../../src/hooks/useStreamingChat');
    const { streamChat } = await import('../../src/api/chat');
    const mockStreamChat = streamChat as ReturnType<typeof vi.fn>;

    const childThreadId = 'child-with-prompt';
    const parentMsgId = 'parent-msg-id';
    mockState.activeThreadId = childThreadId;
    mockState.threads = {
      [childThreadId]: makeThread({
        id: childThreadId,
        depth: 1,
        parentThreadId: 'root-thread',
        anchorText: 'test topic',
        parentMessageId: parentMsgId,
        title: 'Child',
      }),
    };
    mockState.messages = {
      [parentMsgId]: makeMessage({
        id: parentMsgId,
        threadId: 'root-thread',
        role: 'assistant',
        content: 'foo bar baz',
      }),
    };

    mockStreamChat.mockImplementationOnce(async (
      _body: unknown,
      _getToken: unknown,
      _onChunk: unknown,
      onDone: () => void,
    ) => { onDone(); });

    const { result } = renderHook(() => useStreamingChat(noopGetToken));

    await act(async () => {
      await result.current.sendMessage('Child question');
    });

    expect(mockStreamChat).toHaveBeenCalledTimes(1);
    const body = mockStreamChat.mock.calls[0][0] as { systemInstruction?: string };
    expect(body.systemInstruction).toContain('focused sub-conversation about: test topic');
    expect(body.systemInstruction).toContain('foo bar baz');
  });
});

// ─── buildChildSystemPrompt unit tests ───────────────────────────────────────

describe('buildChildSystemPrompt', () => {
  it('returns formatted prompt with anchorText and parent context', () => {
    const result = buildChildSystemPrompt('machine learning', 'Here is some context about ML.');
    expect(result).toContain('focused sub-conversation about: machine learning');
    expect(result).toContain('Here is some context about ML.');
    expect(result).toContain('Stay focused on this specific topic');
  });

  it('truncates parentContext to 200 chars', () => {
    const longContext = 'A'.repeat(300);
    const result = buildChildSystemPrompt('topic', longContext);
    expect(result).toContain('A'.repeat(200));
    expect(result).not.toContain('A'.repeat(201));
  });

  it('handles empty anchorText gracefully', () => {
    const result = buildChildSystemPrompt('', 'some context');
    expect(result).toContain('focused sub-conversation about: ');
  });

  it('handles empty parentContext gracefully', () => {
    const result = buildChildSystemPrompt('topic', '');
    expect(result).toContain('focused sub-conversation about: topic');
  });
});
