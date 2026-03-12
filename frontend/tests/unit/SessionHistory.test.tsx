/**
 * Tests for SessionHistory component
 * Requirements: SIDE-07, SIDE-08, SIDE-09, SIDE-10, SIDE-11, SIDE-12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionHistory } from '../../src/components/history/SessionHistory';
import type { Thread } from '../../src/types/index';
import type { SessionListItem } from '../../src/api/sessions';

// Mock useSessionStore
const mockDeleteThread = vi.fn();
const mockSetThreadTitle = vi.fn();

vi.mock('../../src/store/sessionStore', () => ({
  useSessionStore: vi.fn((selector: (s: object) => unknown) =>
    selector({
      deleteThread: mockDeleteThread,
      setThreadTitle: mockSetThreadTitle,
    })
  ),
}));

function makeThread(overrides: Partial<Thread> & { id: string }): Thread {
  return {
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

function makeSession(overrides: Partial<SessionListItem> & { id: string }): SessionListItem {
  return {
    title: overrides.id,
    lastActivityAt: Date.now(),
    ...overrides,
  } as SessionListItem;
}

// Build a minimal tree: root -> child1
function buildSimpleTree() {
  const root = makeThread({
    id: 'root',
    depth: 0,
    title: 'Root Thread',
    accentColor: '#FF0000',
    childThreadIds: ['child1'],
  });
  const child1 = makeThread({
    id: 'child1',
    depth: 1,
    title: 'Child Thread',
    accentColor: '#00FF00',
    parentThreadId: 'root',
    childThreadIds: [],
  });
  const threads: Record<string, Thread> = { root, child1 };
  return { root, child1, threads };
}

describe('SessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders accent pip with correct backgroundColor', () => {
    const { threads, child1 } = buildSimpleTree();
    const session = makeSession({ id: 'session1', title: 'Test Session' });

    render(
      <SessionHistory
        sessions={[session]}
        onLoadSession={vi.fn()}
        currentSessionId="session1"
        threads={threads}
        onNavigateThread={vi.fn()}
        activeThreadId="child1"
      />
    );

    const pips = screen.getAllByTestId('accent-pip');
    // child1 pip should have its accentColor
    const child1Pip = pips.find((pip) => {
      const bgColor = (pip as HTMLElement).style.backgroundColor;
      return bgColor === child1.accentColor || bgColor === 'rgb(0, 255, 0)';
    });
    expect(child1Pip).toBeTruthy();
  });

  it('active thread has border-l-2 style with accentColor', () => {
    const { threads } = buildSimpleTree();
    const session = makeSession({ id: 'session1', title: 'Test Session' });

    render(
      <SessionHistory
        sessions={[session]}
        onLoadSession={vi.fn()}
        currentSessionId="session1"
        threads={threads}
        onNavigateThread={vi.fn()}
        activeThreadId="child1"
      />
    );

    const activeRow = screen.getByTestId('active-thread-row');
    expect(activeRow).toBeTruthy();
    expect(activeRow.className).toContain('border-l-2');
    // Browser normalizes hex to rgb
    expect(activeRow.style.borderLeftColor).toBe('rgb(0, 255, 0)');
  });

  it('renders DeleteModal when delete is clicked from dropdown', () => {
    const { threads } = buildSimpleTree();
    const session = makeSession({ id: 'session1', title: 'Test Session' });

    render(
      <SessionHistory
        sessions={[session]}
        onLoadSession={vi.fn()}
        currentSessionId="session1"
        threads={threads}
        onNavigateThread={vi.fn()}
        activeThreadId="child1"
      />
    );

    // Find and click the 3-dot button for the thread (Actions buttons)
    const actionButtons = screen.getAllByTitle('Actions');
    // The last Actions button should be for the child thread
    const threadActionBtn = actionButtons[actionButtons.length - 1];
    fireEvent.click(threadActionBtn);

    // Click the "Delete" option in the dropdown
    const deleteOption = screen.getByText('Delete');
    fireEvent.click(deleteOption);

    // Modal should appear
    const modal = screen.getByTestId('delete-modal');
    expect(modal).toBeTruthy();
    expect(screen.getByText('Delete this thread?')).toBeTruthy();
  });

  it('DeleteModal onConfirm calls deleteThread', () => {
    const { threads } = buildSimpleTree();
    const session = makeSession({ id: 'session1', title: 'Test Session' });

    render(
      <SessionHistory
        sessions={[session]}
        onLoadSession={vi.fn()}
        currentSessionId="session1"
        threads={threads}
        onNavigateThread={vi.fn()}
        activeThreadId="child1"
      />
    );

    // Open menu and click delete
    const actionButtons = screen.getAllByTitle('Actions');
    fireEvent.click(actionButtons[actionButtons.length - 1]);
    fireEvent.click(screen.getByText('Delete'));

    // Confirm deletion
    const confirmBtn = screen.getByTestId('delete-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(mockDeleteThread).toHaveBeenCalledWith('child1');
  });

  it('DeleteModal onCancel clears dialog', () => {
    const { threads } = buildSimpleTree();
    const session = makeSession({ id: 'session1', title: 'Test Session' });

    render(
      <SessionHistory
        sessions={[session]}
        onLoadSession={vi.fn()}
        currentSessionId="session1"
        threads={threads}
        onNavigateThread={vi.fn()}
        activeThreadId="child1"
      />
    );

    // Open menu and click delete
    const actionButtons = screen.getAllByTitle('Actions');
    fireEvent.click(actionButtons[actionButtons.length - 1]);
    fireEvent.click(screen.getByText('Delete'));

    // Modal should be visible
    expect(screen.getByTestId('delete-modal')).toBeTruthy();

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Modal should be gone
    expect(screen.queryByTestId('delete-modal')).toBeNull();
  });
});
