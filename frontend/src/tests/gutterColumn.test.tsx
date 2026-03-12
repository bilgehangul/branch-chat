/**
 * GutterColumn / BranchPillCell tests
 *
 * Tests for PILL-01 (CSS Grid layout), PILL-02 (no JS measurement),
 * and pill rendering behavior after the grid migration.
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock sessionStore
const fakeSessionState = {
  session: null,
  threads: {} as Record<string, import('../types/index').Thread>,
  messages: {} as Record<string, import('../types/index').Message>,
  activeThreadId: null,
  createSession: vi.fn(),
  clearSession: vi.fn(),
  hydrateSession: vi.fn(),
  setActiveThread: vi.fn(),
  createThread: vi.fn(),
  addMessage: vi.fn(),
  updateMessage: vi.fn(),
  setMessageStreaming: vi.fn(),
  addChildLead: vi.fn(),
  addAnnotation: vi.fn(),
  updateAnnotation: vi.fn(),
  setScrollPosition: vi.fn(),
  setThreadTitle: vi.fn(),
  deleteThread: vi.fn(),
  summarizeThread: vi.fn(),
  compactThread: vi.fn(),
};

const mockUseSessionStore = (selector?: (s: typeof fakeSessionState) => unknown) => {
  if (typeof selector === 'function') return selector(fakeSessionState);
  return fakeSessionState;
};
mockUseSessionStore.getState = () => fakeSessionState;

vi.mock('../../store/sessionStore', () => ({
  useSessionStore: mockUseSessionStore,
  initialState: fakeSessionState,
}));

// Read the source file to verify no JS measurement code exists
import * as fs from 'fs';
import * as path from 'path';

const gutterColumnSource = fs.readFileSync(
  path.resolve(__dirname, '../components/branching/GutterColumn.tsx'),
  'utf-8'
);

describe('GutterColumn - No JS measurement (PILL-02)', () => {
  it('does not contain measurePillTop function', () => {
    expect(gutterColumnSource).not.toContain('measurePillTop');
  });

  it('does not use ResizeObserver', () => {
    expect(gutterColumnSource).not.toContain('ResizeObserver');
  });

  it('does not have pillPositions ref', () => {
    expect(gutterColumnSource).not.toContain('pillPositions');
  });

  it('does not have posVersion state', () => {
    expect(gutterColumnSource).not.toContain('posVersion');
  });
});

describe('BranchPillCell rendering', () => {
  it('renders pills stacked vertically in a flex column', async () => {
    const { BranchPillCell } = await import('../components/branching/GutterColumn');

    const leads = [
      { threadId: 't1', paragraphIndex: 0, anchorText: 'First branch', messageCount: 3 },
      { threadId: 't2', paragraphIndex: 1, anchorText: 'Second branch', messageCount: 5 },
    ];

    const threads: Record<string, import('../types/index').Thread> = {
      t1: { id: 't1', depth: 1, parentThreadId: 'root', anchorText: 'First branch', parentMessageId: 'm1', title: 'Branch One', accentColor: '#ff0000', messageIds: ['m10'], childThreadIds: [], scrollPosition: 0 },
      t2: { id: 't2', depth: 1, parentThreadId: 'root', anchorText: 'Second branch', parentMessageId: 'm1', title: 'Branch Two', accentColor: '#00ff00', messageIds: ['m20', 'm21'], childThreadIds: [], scrollPosition: 0 },
    };

    const messages: Record<string, import('../types/index').Message> = {};

    const { container } = render(
      <BranchPillCell
        leads={leads}
        threads={threads}
        messages={messages}
        onNavigate={vi.fn()}
        onDeleteThread={vi.fn()}
        onSummarize={vi.fn()}
        onCompact={vi.fn()}
      />
    );

    // Should have two pill buttons
    const pills = screen.getAllByRole('button');
    expect(pills.length).toBeGreaterThanOrEqual(2);

    // Container should be a flex column
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
  });

  it('renders nothing when leads array is empty', async () => {
    const { BranchPillCell } = await import('../components/branching/GutterColumn');

    const { container } = render(
      <BranchPillCell
        leads={[]}
        threads={{}}
        messages={{}}
        onNavigate={vi.fn()}
        onDeleteThread={vi.fn()}
        onSummarize={vi.fn()}
        onCompact={vi.fn()}
      />
    );

    // Should render an empty container with no visible content
    expect(container.textContent).toBe('');
  });
});
