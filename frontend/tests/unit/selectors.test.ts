import { describe, it } from 'vitest';

describe('selectors', () => {
  it.todo('selectCurrentThread returns thread matching activeThreadId');
  it.todo('selectThreadAncestry returns [root] for root thread');
  it.todo('selectThreadAncestry returns [root, child, grandchild] for depth-2 thread');
  it.todo('isAtMaxDepth returns true for depth 4 thread');
  it.todo('isAtMaxDepth returns false for depth 0–3');
});
