import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BranchPillCell } from '../../src/components/branching/GutterColumn';
import type { Thread, Message, ChildLead } from '../../src/types/index';

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── BRANCH-08: conditional rendering ───────────────────────────────────────

describe('BranchPillCell', () => {
  describe('BRANCH-08: conditional rendering', () => {
    it('renders nothing when leads array is empty', () => {
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
      // Container should have no visible content
      expect(container.textContent).toBe('');
    });

    it('renders pills when leads are provided', () => {
      const childThread = makeThread({
        id: 'child-1',
        title: 'Child thread',
        messageIds: ['msg-2', 'msg-3'],
        childThreadIds: [],
        accentColor: '#f87171',
      });

      const leads: ChildLead[] = [{
        threadId: 'child-1',
        paragraphIndex: 0,
        anchorText: 'selected text',
        messageCount: 2,
      }];

      const { container } = render(
        <BranchPillCell
          leads={leads}
          threads={{ 'child-1': childThread }}
          messages={{
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1', role: 'user', content: 'User question' }),
            'msg-3': makeMessage({ id: 'msg-3', threadId: 'child-1', role: 'assistant', content: 'AI answer' }),
          }}
          onNavigate={vi.fn()}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
        />
      );
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

      const leads: ChildLead[] = [{
        threadId: 'child-1',
        paragraphIndex: 0,
        anchorText: 'the anchor',
        messageCount: 2,
      }];

      return render(
        <BranchPillCell
          leads={leads}
          threads={{ 'child-1': childThread }}
          messages={{
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1', role: 'user', content: 'User question' }),
            'msg-3': makeMessage({ id: 'msg-3', threadId: 'child-1', role: 'assistant', content: 'AI answer\nSecond line' }),
          }}
          onNavigate={vi.fn()}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
        />
      );
    }

    it('renders directional arrow in each lead pill', () => {
      renderWithChild();
      // The arrow is rendered as &rarr; (→) HTML entity
      const buttons = screen.getAllByRole('button');
      const pillButton = buttons.find(b => b.textContent?.includes('\u2192'));
      expect(pillButton).toBeTruthy();
    });

    it('truncates thread title to 20 characters in lead pill', () => {
      const longTitle = 'A'.repeat(30); // 30 chars, should be truncated to 20
      renderWithChild(longTitle);
      const expected = 'A'.repeat(20);
      expect(screen.getByText(new RegExp(expected))).toBeTruthy();
      // Full title should not appear (21+ chars)
      expect(screen.queryByText(new RegExp('A'.repeat(21)))).toBeNull();
    });

    it('displays live message count from thread.messageIds.length', () => {
      renderWithChild();
      // childThread has messageIds: ['msg-2', 'msg-3'] → count 2
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('renders accent color pip using thread accentColor', () => {
      const { container } = renderWithChild();
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

      const leads: ChildLead[] = [{
        threadId: 'child-1',
        paragraphIndex: 0,
        anchorText: 'the anchor text',
        messageCount: 2,
      }];

      return render(
        <BranchPillCell
          leads={leads}
          threads={{ 'child-1': childThread }}
          messages={{
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1', role: 'user', content: 'What is the plan?' }),
            'msg-3': makeMessage({ id: 'msg-3', threadId: 'child-1', role: 'assistant', content: 'First AI line\nSecond AI line' }),
          }}
          onNavigate={vi.fn()}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
        />
      );
    }

    it('shows preview card on pill hover with anchor text', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /Go to branch/ });
      fireEvent.mouseEnter(pill);
      expect(screen.getByText('the anchor text')).toBeTruthy();
    });

    it('preview card shows first user message content', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /Go to branch/ });
      fireEvent.mouseEnter(pill);
      expect(screen.getByText('What is the plan?')).toBeTruthy();
    });

    it('preview card shows first line of first AI response', () => {
      renderWithChildForHover();
      const pill = screen.getByRole('button', { name: /Go to branch/ });
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

      const leads: ChildLead[] = [{
        threadId: 'child-1',
        paragraphIndex: 0,
        anchorText: 'some text',
        messageCount: 1,
      }];

      render(
        <BranchPillCell
          leads={leads}
          threads={{ 'child-1': childThread }}
          messages={{
            'msg-2': makeMessage({ id: 'msg-2', threadId: 'child-1' }),
          }}
          onNavigate={onNavigate}
          onDeleteThread={vi.fn()}
          onSummarize={vi.fn()}
          onCompact={vi.fn()}
        />
      );

      const pill = screen.getByRole('button', { name: /Go to branch/ });
      fireEvent.click(pill);
      expect(onNavigate).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith('child-1');
    });
  });
});
