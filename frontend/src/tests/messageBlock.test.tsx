import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MessageBlock } from '../components/thread/MessageBlock';
import type { Message, Annotation } from '../types/index';

// Mock Zustand store (MessageBlock uses useSessionStore for underlineMap)
vi.mock('../store/sessionStore', () => ({
  useSessionStore: vi.fn((selector: (s: { threads: Record<string, unknown> }) => unknown) =>
    selector({ threads: {} })
  ),
}));

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-test-1',
  type: 'source',
  targetText: 'test text',
  paragraphIndex: 0,
  originalText: 'test text',
  replacementText: null,
  citationNote: 'A citation note',
  sources: [
    { title: 'Source 1', url: 'https://example.com', domain: 'example.com', snippet: 'snippet' },
  ],
  isShowingOriginal: false,
  ...overrides,
});

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  threadId: 'thread-1',
  role: 'assistant',
  content: 'Hello world response',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: Date.now(),
  ...overrides,
});

describe('MessageBlock annotation rendering', () => {
  test('CitationBlock is rendered outside the AI bubble div when annotation type === source', () => {
    const ann = makeAnnotation({ type: 'source', id: 'ann-source-1' });
    const msg = makeMessage({ annotations: [ann] });
    const { container } = render(<MessageBlock message={msg} />);

    // The outer message wrapper
    const messageWrapper = container.querySelector('[data-message-id="msg-1"]');
    expect(messageWrapper).toBeTruthy();

    // The bubble div is the second child (after the label p)
    // Find the CitationBlock — it should be a sibling of the bubble flex div, not inside it
    const bubbleDiv = messageWrapper!.querySelector('.flex.justify-start');
    expect(bubbleDiv).toBeTruthy();

    // CitationBlock renders a div with bg-zinc-800
    const citationBlock = messageWrapper!.querySelector('.bg-zinc-800');
    expect(citationBlock).toBeTruthy();

    // Confirm citationBlock is NOT inside the bubble div
    expect(bubbleDiv!.contains(citationBlock)).toBe(false);
  });

  test('SimplificationBlock is rendered outside the AI bubble div when annotation type === simplification', () => {
    const ann = makeAnnotation({
      type: 'simplification',
      id: 'ann-simp-1',
      originalText: 'simpler', // mode key stored here per 05-06 convention
      replacementText: 'A simpler explanation',
    });
    const msg = makeMessage({ annotations: [ann] });
    const { container } = render(<MessageBlock message={msg} />);

    const messageWrapper = container.querySelector('[data-message-id="msg-1"]');
    const bubbleDiv = messageWrapper!.querySelector('.flex.justify-start');

    // SimplificationBlock renders a div with bg-indigo-950
    const simplBlock = messageWrapper!.querySelector('.bg-indigo-950');
    expect(simplBlock).toBeTruthy();

    // Confirm simplBlock is NOT inside the bubble div
    expect(bubbleDiv!.contains(simplBlock)).toBe(false);
  });

  test('data-paragraph-id attributes on MarkdownRenderer output are not affected by annotation blocks', () => {
    const ann = makeAnnotation({ type: 'source', id: 'ann-source-2' });
    const msg = makeMessage({
      content: 'First paragraph\n\nSecond paragraph',
      annotations: [ann],
    });
    const { container } = render(<MessageBlock message={msg} />);

    // data-paragraph-id elements should still exist in the bubble
    const paragraphIds = container.querySelectorAll('[data-paragraph-id]');
    expect(paragraphIds.length).toBeGreaterThan(0);
  });

  test('annotation blocks have key = annotation.id (multiple annotations rendered correctly)', () => {
    const ann1 = makeAnnotation({ type: 'source', id: 'ann-a' });
    const ann2 = makeAnnotation({
      type: 'simplification',
      id: 'ann-b',
      originalText: 'example',
      replacementText: 'An example explanation',
    });
    const msg = makeMessage({ annotations: [ann1, ann2] });
    const { container } = render(<MessageBlock message={msg} />);

    const messageWrapper = container.querySelector('[data-message-id="msg-1"]');

    // Both annotation blocks should be rendered
    const citationBlock = messageWrapper!.querySelector('.bg-zinc-800');
    const simplBlock = messageWrapper!.querySelector('.bg-indigo-950');
    expect(citationBlock).toBeTruthy();
    expect(simplBlock).toBeTruthy();
  });
});
