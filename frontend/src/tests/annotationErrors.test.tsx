import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MessageBlock } from '../components/thread/MessageBlock';
import type { Message, Annotation } from '../types/index';

// Mock Zustand store
vi.mock('../store/sessionStore', () => ({
  useSessionStore: vi.fn((selector: (s: { threads: Record<string, unknown> }) => unknown) =>
    selector({ threads: {} })
  ),
}));

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  type: 'source',
  targetText: 'test text',
  paragraphIndex: 0,
  originalText: 'test text',
  replacementText: null,
  citationNote: null,
  sources: [],
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

describe('AnnotationError: inline error block rendering', () => {
  test('renders inline error block when Find Sources API fails (errorAnnotation type=source)', () => {
    const retryFn = vi.fn();
    const msg = makeMessage();
    render(
      <MessageBlock
        message={msg}
        errorAnnotation={{ type: 'source', messageId: 'msg-1', paragraphId: '0', retryFn }}
      />
    );
    expect(screen.getByTestId('annotation-error-block')).toBeTruthy();
    expect(screen.getByText(/Couldn't load sources/)).toBeTruthy();
  });

  test('error block shows "Couldn\'t load sources" message for source type', () => {
    const retryFn = vi.fn();
    const msg = makeMessage();
    render(
      <MessageBlock
        message={msg}
        errorAnnotation={{ type: 'source', messageId: 'msg-1', paragraphId: '0', retryFn }}
      />
    );
    expect(screen.getByText(/Couldn't load sources/)).toBeTruthy();
  });

  test('Retry button re-triggers the API call (calls retryFn)', () => {
    const retryFn = vi.fn();
    const msg = makeMessage();
    render(
      <MessageBlock
        message={msg}
        errorAnnotation={{ type: 'source', messageId: 'msg-1', paragraphId: '0', retryFn }}
      />
    );
    const retryBtn = screen.getByTestId('annotation-retry-btn');
    fireEvent.click(retryBtn);
    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  test('renders inline error block when Simplify API fails (errorAnnotation type=simplification)', () => {
    const retryFn = vi.fn();
    const msg = makeMessage();
    render(
      <MessageBlock
        message={msg}
        errorAnnotation={{ type: 'simplification', messageId: 'msg-1', paragraphId: '0', retryFn }}
      />
    );
    expect(screen.getByTestId('annotation-error-block')).toBeTruthy();
    expect(screen.getByText(/Couldn't simplify text/)).toBeTruthy();
  });

  test('error block is not shown for a different message ID', () => {
    const retryFn = vi.fn();
    const msg = makeMessage({ id: 'msg-2' });
    render(
      <MessageBlock
        message={msg}
        errorAnnotation={{ type: 'source', messageId: 'msg-1', paragraphId: '0', retryFn }}
      />
    );
    expect(screen.queryByTestId('annotation-error-block')).toBeNull();
  });

  test('shimmer replaced by CitationBlock on successful searchSources response', () => {
    // Before: show shimmer
    const ann = makeAnnotation({ type: 'source', id: 'ann-done' });
    const msg = makeMessage({ annotations: [ann] });
    const { container } = render(
      <MessageBlock
        message={msg}
        // pendingAnnotation is null — annotation was added to store on success
        pendingAnnotation={null}
      />
    );
    // No shimmer (animate-pulse)
    expect(container.querySelector('.animate-pulse')).toBeNull();
    // CitationBlock present
    expect(container.querySelector('.bg-stone-50')).toBeTruthy();
  });
});
