import { describe, test, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../store/sessionStore';
import type { Message, Annotation } from '../types/index';

// Helpers
function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    type: 'source',
    targetText: 'hello world',
    paragraphIndex: 0,
    originalText: 'hello world',
    replacementText: null,
    citationNote: null,
    sources: [],
    isShowingOriginal: true,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    threadId: 'thread-1',
    role: 'assistant',
    content: 'Hello',
    isStreaming: false,
    childLeads: [],
    annotations: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('updateAnnotation', () => {
  beforeEach(() => {
    // Reset store to a clean state
    useSessionStore.setState({
      session: null,
      threads: {},
      messages: {},
      activeThreadId: null,
    });
  });

  test('updateAnnotation: applies Partial<Annotation> patch to matching annotation by id', () => {
    const ann = makeAnnotation({ id: 'ann-1', citationNote: null });
    const msg = makeMessage({ id: 'msg-1', annotations: [ann] });
    useSessionStore.setState({ messages: { 'msg-1': msg } });

    const { updateAnnotation } = useSessionStore.getState();
    updateAnnotation('msg-1', 'ann-1', { citationNote: 'Updated note' });

    const updated = useSessionStore.getState().messages['msg-1']!.annotations[0];
    expect(updated.citationNote).toBe('Updated note');
  });

  test('updateAnnotation: leaves other annotations in the message unchanged', () => {
    const ann1 = makeAnnotation({ id: 'ann-1', citationNote: null });
    const ann2 = makeAnnotation({ id: 'ann-2', citationNote: 'original note', type: 'rewrite' });
    const msg = makeMessage({ id: 'msg-1', annotations: [ann1, ann2] });
    useSessionStore.setState({ messages: { 'msg-1': msg } });

    const { updateAnnotation } = useSessionStore.getState();
    updateAnnotation('msg-1', 'ann-1', { citationNote: 'new note' });

    const annotations = useSessionStore.getState().messages['msg-1']!.annotations;
    expect(annotations[1]!.citationNote).toBe('original note');
    expect(annotations[1]!.type).toBe('rewrite');
  });

  test('updateAnnotation: no-op when annotationId does not exist in message', () => {
    const ann = makeAnnotation({ id: 'ann-1', citationNote: null });
    const msg = makeMessage({ id: 'msg-1', annotations: [ann] });
    useSessionStore.setState({ messages: { 'msg-1': msg } });

    const { updateAnnotation } = useSessionStore.getState();
    updateAnnotation('msg-1', 'nonexistent-id', { citationNote: 'should not apply' });

    const annotations = useSessionStore.getState().messages['msg-1']!.annotations;
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.citationNote).toBeNull();
  });

  test('updateAnnotation: produces new object reference (immutable update)', () => {
    const ann = makeAnnotation({ id: 'ann-1' });
    const msg = makeMessage({ id: 'msg-1', annotations: [ann] });
    useSessionStore.setState({ messages: { 'msg-1': msg } });

    const beforeMsg = useSessionStore.getState().messages['msg-1'];
    const { updateAnnotation } = useSessionStore.getState();
    updateAnnotation('msg-1', 'ann-1', { citationNote: 'changed' });

    const afterMsg = useSessionStore.getState().messages['msg-1'];
    expect(afterMsg).not.toBe(beforeMsg);
    expect(afterMsg!.annotations[0]).not.toBe(beforeMsg!.annotations[0]);
  });
});
