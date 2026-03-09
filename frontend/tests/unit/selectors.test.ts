import { describe, it, expect } from 'vitest';
import type { Thread } from '@/types/index';
import {
  selectCurrentThread,
  selectThreadAncestry,
  isAtMaxDepth,
} from '@/store/selectors';

const makeThread = (overrides: Partial<Thread> & { id: string; depth: 0 | 1 | 2 | 3 | 4 }): Thread => ({
  parentThreadId: null,
  anchorText: null,
  parentMessageId: null,
  title: 'Thread',
  accentColor: '#000',
  messageIds: [],
  childThreadIds: [],
  scrollPosition: 0,
  ...overrides,
});

describe('selectors', () => {
  it('selectCurrentThread returns thread matching activeThreadId', () => {
    const threadA = makeThread({ id: 'a', depth: 0 });
    const threads: Record<string, Thread> = { a: threadA };
    expect(selectCurrentThread(threads, 'a')).toEqual(threadA);
  });

  it('selectCurrentThread returns undefined when activeThreadId is null', () => {
    const threads: Record<string, Thread> = {};
    expect(selectCurrentThread(threads, null)).toBeUndefined();
  });

  it('selectThreadAncestry returns [root] for root thread', () => {
    const root = makeThread({ id: 'root', depth: 0 });
    const threads: Record<string, Thread> = { root };
    expect(selectThreadAncestry(threads, 'root')).toEqual([root]);
  });

  it('selectThreadAncestry returns [root, child, grandchild] for depth-2 thread', () => {
    const root = makeThread({ id: 'root', depth: 0 });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'root' });
    const grandchild = makeThread({ id: 'grandchild', depth: 2, parentThreadId: 'child' });
    const threads: Record<string, Thread> = { root, child, grandchild };
    expect(selectThreadAncestry(threads, 'grandchild')).toEqual([root, child, grandchild]);
  });

  it('isAtMaxDepth returns true for depth 4 thread', () => {
    const thread = makeThread({ id: 't', depth: 4 });
    expect(isAtMaxDepth(thread)).toBe(true);
  });

  it('isAtMaxDepth returns false for depth 0', () => {
    const thread = makeThread({ id: 't', depth: 0 });
    expect(isAtMaxDepth(thread)).toBe(false);
  });

  it('isAtMaxDepth returns false for depth 3 (one level left)', () => {
    const thread = makeThread({ id: 't', depth: 3 });
    expect(isAtMaxDepth(thread)).toBe(false);
  });
});
