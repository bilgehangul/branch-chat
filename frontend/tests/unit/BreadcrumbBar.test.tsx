/**
 * Tests for BreadcrumbBar component
 * Requirements: NAV-01, NAV-02, NAV-03
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreadcrumbBar } from '../../src/components/layout/BreadcrumbBar';
import type { Thread } from '../../src/types/index';

// Mock useSessionStore
vi.mock('../../src/store/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

import { useSessionStore } from '../../src/store/sessionStore';

const mockSetActiveThread = vi.fn();

function makeThread(overrides: Partial<Thread> & { id: string }): Thread {
  return {
    id: overrides.id,
    depth: 0,
    parentThreadId: null,
    anchorText: null,
    parentMessageId: null,
    title: overrides.id,
    accentColor: '#2D7DD2',
    messageIds: [],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

function setupStore(threads: Record<string, Thread>, activeThreadId: string | null) {
  (useSessionStore as ReturnType<typeof vi.fn>).mockImplementation((selector: (s: object) => unknown) => {
    return selector({
      threads,
      activeThreadId,
      setActiveThread: mockSetActiveThread,
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BreadcrumbBar', () => {
  // NAV-01: Ancestry rendering — 2-item chain (root + current)
  it('renders a crumb for each thread in the ancestry chain (2 items)', () => {
    const root = makeThread({ id: 'root', depth: 0, title: 'Root Thread', messageIds: ['m1'] });
    const child = makeThread({
      id: 'child',
      depth: 1,
      parentThreadId: 'root',
      title: 'Child Thread',
      messageIds: ['m2'],
    });
    const threads = { root, child };
    setupStore(threads, 'child');

    render(<BreadcrumbBar />);

    // Root thread (ancestor, has messages so shows title)
    expect(screen.getByText('Root Thread')).toBeInTheDocument();
    // Current thread (last crumb)
    expect(screen.getByText('Child Thread')).toBeInTheDocument();
  });

  // NAV-01: "New Chat" for root with no messages
  it('renders "New Chat" label for root thread with no messages', () => {
    const root = makeThread({ id: 'root', depth: 0, title: 'Root', messageIds: [] });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'root', title: 'Child', messageIds: ['m1'] });
    const threads = { root, child };
    setupStore(threads, 'child');

    render(<BreadcrumbBar />);

    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  // NAV-02: Clicking an ancestor calls setActiveThread
  it('clicking an ancestor crumb calls setActiveThread with that thread id', () => {
    const root = makeThread({ id: 'root', depth: 0, title: 'Root', messageIds: ['m1'] });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'root', title: 'Child', messageIds: ['m2'] });
    const threads = { root, child };
    setupStore(threads, 'child');

    render(<BreadcrumbBar />);

    const rootButton = screen.getByRole('button', { name: 'Root' });
    fireEvent.click(rootButton);

    expect(mockSetActiveThread).toHaveBeenCalledWith('root');
  });

  // NAV-02: Current (last) crumb is not a button
  it('the current (last) crumb is not a button element', () => {
    const root = makeThread({ id: 'root', depth: 0, title: 'Root', messageIds: ['m1'] });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'root', title: 'Child', messageIds: ['m2'] });
    const threads = { root, child };
    setupStore(threads, 'child');

    render(<BreadcrumbBar />);

    // Current crumb "Child" should be a span, not a button
    const childEl = screen.getByText('Child');
    expect(childEl.tagName).not.toBe('BUTTON');
  });

  // NAV-03: Overflow collapse — 5-item ancestry should show ellipsis
  it('collapses middle crumbs to ellipsis when ancestry.length > 3', () => {
    const t0 = makeThread({ id: 't0', depth: 0, title: 'T0', messageIds: ['m0'] });
    const t1 = makeThread({ id: 't1', depth: 1, parentThreadId: 't0', title: 'T1', messageIds: ['m1'] });
    const t2 = makeThread({ id: 't2', depth: 2, parentThreadId: 't1', title: 'T2', messageIds: ['m2'] });
    const t3 = makeThread({ id: 't3', depth: 3, parentThreadId: 't2', title: 'T3', messageIds: ['m3'] });
    const t4 = makeThread({ id: 't4', depth: 4, parentThreadId: 't3', title: 'T4', messageIds: ['m4'] });
    const threads = { t0, t1, t2, t3, t4 };
    setupStore(threads, 't4');

    render(<BreadcrumbBar />);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  // NAV-03: Clicking ellipsis shows dropdown with hidden crumbs
  it('clicking ellipsis shows dropdown with all hidden crumbs', () => {
    const t0 = makeThread({ id: 't0', depth: 0, title: 'T0', messageIds: ['m0'] });
    const t1 = makeThread({ id: 't1', depth: 1, parentThreadId: 't0', title: 'T1', messageIds: ['m1'] });
    const t2 = makeThread({ id: 't2', depth: 2, parentThreadId: 't1', title: 'T2', messageIds: ['m2'] });
    const t3 = makeThread({ id: 't3', depth: 3, parentThreadId: 't2', title: 'T3', messageIds: ['m3'] });
    const t4 = makeThread({ id: 't4', depth: 4, parentThreadId: 't3', title: 'T4', messageIds: ['m4'] });
    const threads = { t0, t1, t2, t3, t4 };
    setupStore(threads, 't4');

    render(<BreadcrumbBar />);

    const ellipsisBtn = screen.getByText('...');
    fireEvent.click(ellipsisBtn);

    // T1 and T2 are collapsed (middle items between T0 and T3/T4)
    // ancestry = [t0, t1, t2, t3, t4], shouldCollapse when > 3
    // visible: [t0] + ... + [t3, t4(current)]
    // collapsed middle: [t1, t2]
    expect(screen.getAllByText('T1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('T2').length).toBeGreaterThanOrEqual(1);
  });
});
