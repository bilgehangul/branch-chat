import type { Thread } from '../types/index';

export function selectCurrentThread(
  threads: Record<string, Thread>,
  activeThreadId: string | null
): Thread | undefined {
  if (!activeThreadId) return undefined;
  return threads[activeThreadId];
}

export function selectThreadAncestry(
  threads: Record<string, Thread>,
  threadId: string
): Thread[] {
  const ancestry: Thread[] = [];
  let current: Thread | undefined = threads[threadId];
  while (current) {
    ancestry.unshift(current);
    current = current.parentThreadId ? threads[current.parentThreadId] : undefined;
  }
  return ancestry;
}

export function isAtMaxDepth(thread: Thread): boolean {
  return thread.depth >= 4;
}
