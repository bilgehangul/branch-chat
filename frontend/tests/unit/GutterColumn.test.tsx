import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GutterColumn } from '../../src/components/branching/GutterColumn';
import type { Thread, Message } from '../../src/types/index';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 'thread-1',
    depth: 0,
    parentThreadId: null,
    anchorText: null,
    parentMessageId: null,
    title: 'Root thread',
    accentColor: '#60a5fa',
    messageIds: ['msg-1'],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    threadId: 'thread-1',
    role: 'assistant',
    content: 'Hello world',
    annotations: [],
    childLeads: [],
    isStreaming: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeScrollRef(el: HTMLElement | null = null) {
  return { current: el } as React.RefObject<HTMLElement | null>;
}

// Mock scroll container
let mockContainer: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  mockContainer = document.createElement('div');
  // Mock getBoundingClientRect on container
  mockContainer.getBoundingClientRect = vi.fn(() => ({
    top: 0, left: 0, right: 800, bottom: 600,
    width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}),
  }));
  // Mock querySelector to return null by default (pills get top=0)
  mockContainer.querySelector = vi.fn(() => null);
  document.body.appendChild(mockContainer);
});

// ── BRANCH-08: conditional rendering ───────────────────────────────────────

describe('GutterColumn', () => {
  describe('BRANCH-08: conditional rendering', () => {
    it('renders nothing when thread has no childThreadIds', () => {
      const thread = makeThread({ childThreadIds: [] });
      const { container } = render(
        <GutterColumn
          wrapperRef={makeScrollRef(mockContainer)}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
          activeThread={thread}
          threads={{ 'thread-1': thread }}
          messages={{ 'msg-1': makeMessage() }}
          onNavigate={vi.fn()}
        />
      );
      // Should render null — container will be empty
      expect(container.firstChild).toBeNull();
    });

    it('renders the gutter column when thread has at least one childThreadId', () => {
      const childThread = makeThread({
        id: 'child-1',
        title: 'Child thread',
        messageIds: ['msg-2'],
        childThreadIds: [],
        accentColor: '#f87171',
      });
      const parentMsg = makeMessage({
        childLeads: [{
          threadId: 'child-1',
          paragraphIndex: 0,
          anchorText: 'selected text',
          messageCount: 1,
        }],
      });
      const parentThread = makeThread({
        childThreadIds: ['child-1'],
        messageIds: ['msg-1'],
      });

      const { container } = render(
        <GutterColumn
          wrapperRef={makeScrollRef(mockContainer)}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
          activeThread={parentThread}
          threads={{ 'thread-1': parentThread, 'child-1': childThread }}
          messages={{ 'msg-1': parentMsg, 'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1' }) }}
          onNavigate={vi.fn()}
        />
      );
      // Gutter column wrapper should be present
      expect(container.firstChild).not.toBeNull();
    });
  });

  // ── BRANCH-09: lead pill content ─────────────────────────────────────────

  describe('BRANCH-09: lead pill content', () => {
    function renderWithChild(titleOverride?: string) {
      const title = titleOverride ?? 'Child thread';
      const childThread = makeThread({
        id: 'child-1',
        title,
        messageIds: ['msg-2', 'msg-3'],
        childThreadIds: [],
        accentColor: '#f87171',
      });
      const parentMsg = makeMessage({
        childLeads: [{
          threadId: 'child-1',
          paragraphIndex: 0,
          anchorText: 'the anchor',
          messageCount: 2,
        }],
      });
      const parentThread = makeThread({ childThreadIds: ['child-1'], messageIds: ['msg-1'] });

      return render(
        <GutterColumn
          wrapperRef={makeScrollRef(mockContainer)}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
          activeThread={parentThread}
          threads={{ 'thread-1': parentThread, 'child-1': childThread }}
          messages={{
            'msg-1': parentMsg,
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1', role: 'user', content: 'User question' }),
            'msg-3': makeMessage({ id: 'msg-3', threadId: 'child-1', role: 'assistant', content: 'AI answer\nSecond line' }),
          }}
          onNavigate={vi.fn()}
        />
      );
    }

    it('renders directional arrow (→) in each lead pill', () => {
      renderWithChild();
      expect(screen.getByText(/→/)).toBeTruthy();
    });

    it('truncates thread title to 32 characters in lead pill', () => {
      const longTitle = 'A'.repeat(40); // 40 chars, should be truncated to 32
      renderWithChild(longTitle);
      const expected = 'A'.repeat(32);
      expect(screen.getByText(new RegExp(expected))).toBeTruthy();
      // Full title should not appear
      expect(screen.queryByText(new RegExp('A'.repeat(33)))).toBeNull();
    });

    it('displays live message count from thread.messageIds.length', () => {
      renderWithChild();
      // childThread has messageIds: ['msg-2', 'msg-3'] → count 2
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('renders accent color pip using thread accentColor', () => {
      const { container } = renderWithChild();
      // The accent pip should have background color matching accentColor
      const pip = container.querySelector('[data-testid="accent-pip"]');
      expect(pip).toBeTruthy();
      expect((pip as HTMLElement).style.backgroundColor).toBe('rgb(248, 113, 113)'); // #f87171
    });
  });

  // ── BRANCH-10: hover preview ──────────────────────────────────────────────

  describe('BRANCH-10: hover preview', () => {
    function renderWithChildForHover() {
      const childThread = makeThread({
        id: 'child-1',
        title: 'Child thread',
        messageIds: ['msg-2', 'msg-3'],
        childThreadIds: [],
        accentColor: '#f87171',
      });
      const parentMsg = makeMessage({
        childLeads: [{
          threadId: 'child-1',
          paragraphIndex: 0,
          anchorText: 'the anchor text',
          messageCount: 2,
        }],
      });
      const parentThread = makeThread({ childThreadIds: ['child-1'], messageIds: ['msg-1'] });

      return render(
        <GutterColumn
          wrapperRef={makeScrollRef(mockContainer)}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
          activeThread={parentThread}
          threads={{ 'thread-1': parentThread, 'child-1': childThread }}
          messages={{
            'msg-1': parentMsg,
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1', role: 'user', content: 'What is the plan?' }),
            'msg-3': makeMessage({ id: 'msg-3', threadId: 'child-1', role: 'assistant', content: 'First AI line\nSecond AI line' }),
          }}
          onNavigate={vi.fn()}
        />
      );
    }

    it('shows preview card on pill hover with anchor text', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /→/ });
      fireEvent.mouseEnter(pill);
      expect(screen.getByText('the anchor text')).toBeTruthy();
    });

    it('preview card shows first user message content', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /→/ });
      fireEvent.mouseEnter(pill);
      expect(screen.getByText('What is the plan?')).toBeTruthy();
    });

    it('preview card shows first line of first AI response', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /→/ });
      fireEvent.mouseEnter(pill);
      expect(screen.getByText('First AI line')).toBeTruthy();
    });
  });

  // ── BRANCH-11: navigation ─────────────────────────────────────────────────

  describe('BRANCH-11: navigation', () => {
    it('clicking a lead pill calls onNavigate with the correct threadId', () => {
      const onNavigate = vi.fn();
      const childThread = makeThread({
        id: 'child-1',
        title: 'Child thread',
        messageIds: ['msg-2'],
        childThreadIds: [],
        accentColor: '#f87171',
      });
      const parentMsg = makeMessage({
        childLeads: [{
          threadId: 'child-1',
          paragraphIndex: 0,
          anchorText: 'some text',
          messageCount: 1,
        }],
      });
      const parentThread = makeThread({ childThreadIds: ['child-1'], messageIds: ['msg-1'] });

      render(
        <GutterColumn
          wrapperRef={makeScrollRef(mockContainer)}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
          activeThread={parentThread}
          threads={{ 'thread-1': parentThread, 'child-1': childThread }}
          messages={{
            'msg-1': parentMsg,
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1' }),
          }}
          onNavigate={onNavigate}
        />
      );

      const pill = screen.getByRole('button', { name: /→/ });
      fireEvent.click(pill);
      expect(onNavigate).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith('child-1');
    });
  });
});
