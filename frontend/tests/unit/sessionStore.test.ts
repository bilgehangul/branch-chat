import { describe, it, expect, afterEach } from 'vitest';
import { useSessionStore } from '@/store/sessionStore';
import type { Message, ChildLead } from '@/types/index';
import { ACCENT_PALETTE, getNextAccentColor } from '@/constants/theme';

const initialState = useSessionStore.getState();
afterEach(() => useSessionStore.setState(initialState, true));

describe('sessionStore actions', () => {
  it('clearSession resets all fields to initial state', () => {
    const store = useSessionStore.getState();
    store.createSession('user-123');
    const msg: Message = {
      id: 'msg-1',
      threadId: Object.keys(useSessionStore.getState().threads)[0] ?? 'root',
      role: 'user',
      content: 'hello',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    store.addMessage(msg);
    store.clearSession();
    const state = useSessionStore.getState();
    expect(state.session).toBeNull();
    expect(state.threads).toEqual({});
    expect(state.messages).toEqual({});
    expect(state.activeThreadId).toBeNull();
  });

  it('createSession sets session and creates root thread', () => {
    useSessionStore.getState().createSession('user-abc');
    const state = useSessionStore.getState();
    expect(state.session).not.toBeNull();
    expect(state.session?.userId).toBe('user-abc');
    const threadIds = Object.keys(state.threads);
    expect(threadIds).toHaveLength(1);
    const rootThread = state.threads[threadIds[0]!];
    expect(rootThread?.depth).toBe(0);
    expect(rootThread?.parentThreadId).toBeNull();
    expect(state.activeThreadId).toBe(threadIds[0]);
    expect(Object.keys(state.messages)).toHaveLength(0);
  });

  it('addMessage adds message to messages Record at store root (not nested in thread)', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    const msg: Message = {
      id: 'msg-flat-1',
      threadId,
      role: 'user',
      content: 'flat test',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    useSessionStore.getState().addMessage(msg);
    const state = useSessionStore.getState();
    // Message exists at store root
    expect(state.messages['msg-flat-1']).toEqual(msg);
    // Thread only has a reference (the id), not the full message
    const thread = state.threads[threadId];
    expect(thread?.messageIds).toContain('msg-flat-1');
    expect(thread?.messageIds[0]).toBe('msg-flat-1');
  });

  it('updateMessage patches a single message without affecting others', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    const msg1: Message = {
      id: 'msg-a',
      threadId,
      role: 'user',
      content: 'original',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    const msg2: Message = {
      id: 'msg-b',
      threadId,
      role: 'assistant',
      content: 'unchanged',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    const store = useSessionStore.getState();
    store.addMessage(msg1);
    store.addMessage(msg2);
    store.updateMessage('msg-a', { content: 'new content' });
    const state = useSessionStore.getState();
    expect(state.messages['msg-a']?.content).toBe('new content');
    expect(state.messages['msg-b']?.content).toBe('unchanged');
  });

  it('setMessageStreaming flips isStreaming on one message only', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    const msg: Message = {
      id: 'msg-stream',
      threadId,
      role: 'assistant',
      content: '',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    useSessionStore.getState().addMessage(msg);
    useSessionStore.getState().setMessageStreaming('msg-stream', true);
    expect(useSessionStore.getState().messages['msg-stream']?.isStreaming).toBe(true);
  });

  it('createThread adds to threads Record and updates parent childThreadIds', () => {
    useSessionStore.getState().createSession('user-abc');
    const parentThreadId = useSessionStore.getState().activeThreadId!;
    const parentBefore = useSessionStore.getState().threads[parentThreadId];
    const prevChildCount = parentBefore?.childThreadIds.length ?? 0;

    const newId = useSessionStore.getState().createThread({
      parentThreadId,
      anchorText: 'anchor',
      parentMessageId: null,
      title: 'Child Thread',
      accentColor: '#ff0000',
    });

    const state = useSessionStore.getState();
    expect(state.threads[newId]).toBeDefined();
    expect(state.threads[newId]?.depth).toBe(1);
    const parent = state.threads[parentThreadId];
    expect(parent?.childThreadIds).toContain(newId);
    expect(parent?.childThreadIds.length).toBe(prevChildCount + 1);
  });

  it('setActiveThread updates activeThreadId', () => {
    useSessionStore.getState().createSession('user-abc');
    const parentId = useSessionStore.getState().activeThreadId!;
    const newId = useSessionStore.getState().createThread({
      parentThreadId: parentId,
      anchorText: null,
      parentMessageId: null,
      title: 'New',
      accentColor: '#000',
    });
    useSessionStore.getState().setActiveThread(newId);
    expect(useSessionStore.getState().activeThreadId).toBe(newId);
  });

  it('addChildLead adds ChildLead to correct message', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    const msg: Message = {
      id: 'msg-cl',
      threadId,
      role: 'assistant',
      content: 'test',
      annotations: [],
      childLeads: [],
      isStreaming: false,
      createdAt: Date.now(),
    };
    useSessionStore.getState().addMessage(msg);
    const lead: ChildLead = {
      threadId: 'child-thread-id',
      paragraphIndex: 2,
      anchorText: 'some anchor',
      messageCount: 3,
    };
    useSessionStore.getState().addChildLead('msg-cl', lead);
    const childLeads = useSessionStore.getState().messages['msg-cl']?.childLeads;
    expect(childLeads).toHaveLength(1);
    expect(childLeads?.[0]).toEqual(lead);
  });

  it('setScrollPosition updates scrollPosition on correct thread', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    useSessionStore.getState().setScrollPosition(threadId, 420);
    expect(useSessionStore.getState().threads[threadId]?.scrollPosition).toBe(420);
  });

  it('setThreadTitle updates the thread title without affecting other threads', () => {
    useSessionStore.getState().createSession('user-abc');
    const threadId = useSessionStore.getState().activeThreadId!;
    expect(useSessionStore.getState().threads[threadId]?.title).toBe('Root');
    useSessionStore.getState().setThreadTitle(threadId, 'My New Title');
    expect(useSessionStore.getState().threads[threadId]?.title).toBe('My New Title');
  });
});

describe('accent color cycling', () => {
  it('ACCENT_PALETTE has 8 entries', () => {
    expect(ACCENT_PALETTE).toHaveLength(8);
  });

  it('first child thread gets ACCENT_PALETTE[0]', () => {
    useSessionStore.getState().createSession('user-abc');
    const parentThreadId = useSessionStore.getState().activeThreadId!;
    const parentThread = useSessionStore.getState().threads[parentThreadId]!;

    const accentColor = getNextAccentColor(parentThread);
    expect(accentColor).toBe(ACCENT_PALETTE[0]);
  });

  it('second child thread gets ACCENT_PALETTE[1]', () => {
    useSessionStore.getState().createSession('user-abc');
    const parentThreadId = useSessionStore.getState().activeThreadId!;

    // Create first child
    useSessionStore.getState().createThread({
      parentThreadId,
      anchorText: 'first anchor',
      parentMessageId: null,
      title: 'Child One',
      accentColor: ACCENT_PALETTE[0]!,
    });

    // Now parent has 1 child; next color should be ACCENT_PALETTE[1]
    const updatedParent = useSessionStore.getState().threads[parentThreadId]!;
    const accentColor = getNextAccentColor(updatedParent);
    expect(accentColor).toBe(ACCENT_PALETTE[1]);
  });

  it('accent color wraps around after 8 children (modulo)', () => {
    useSessionStore.getState().createSession('user-abc');
    const parentThreadId = useSessionStore.getState().activeThreadId!;

    // Create 8 children so the 9th should cycle back to ACCENT_PALETTE[0]
    for (let i = 0; i < 8; i++) {
      const parent = useSessionStore.getState().threads[parentThreadId]!;
      const color = getNextAccentColor(parent);
      useSessionStore.getState().createThread({
        parentThreadId,
        anchorText: `anchor ${i}`,
        parentMessageId: null,
        title: `Child ${i}`,
        accentColor: color,
      });
    }

    const parent = useSessionStore.getState().threads[parentThreadId]!;
    expect(parent.childThreadIds).toHaveLength(8);
    const accentColor = getNextAccentColor(parent);
    expect(accentColor).toBe(ACCENT_PALETTE[0]);
  });
});
