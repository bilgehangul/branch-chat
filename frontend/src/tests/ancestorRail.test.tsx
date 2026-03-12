import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AncestorPeekPanel } from '../components/layout/AncestorPeekPanel';
import type { Thread, Message } from '../types/index';

/* ── helpers ─────────────────────────────────────────────── */

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 't1',
    depth: 1,
    parentThreadId: 'root',
    anchorText: 'some anchor',
    parentMessageId: 'm1',
    title: 'Child Thread',
    accentColor: '#4f46e5',
    messageIds: ['m1', 'm2', 'm3'],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

function makeMessages(): Record<string, Message> {
  const base = {
    threadId: 't1',
    annotations: [],
    childLeads: [],
    isStreaming: false,
    createdAt: Date.now(),
  };
  return {
    m1: { ...base, id: 'm1', role: 'user', content: 'Hello from user' },
    m2: { ...base, id: 'm2', role: 'assistant', content: 'Hello from AI' },
    m3: { ...base, id: 'm3', role: 'user', content: 'Follow up question' },
  };
}

const defaultProps = {
  thread: makeThread(),
  allMessages: makeMessages(),
  highlightMessageId: 'm2',
  childThreadId: 'child-t',
  onClick: vi.fn(),
  onNavigate: vi.fn(),
  onDelete: vi.fn(),
  onSummarize: vi.fn(),
  onCompact: vi.fn(),
};

/* ── ANCS-01: collapsed rail ──────────────────────────────── */

describe('ANCS-01: Collapsed rail', () => {
  it('renders at 28px width with accent-color stripe', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('28px');
    // accent stripe: a child div with backgroundColor matching accentColor
    const stripe = root.querySelector('[data-testid="accent-stripe"]') ||
      Array.from(root.querySelectorAll('div')).find(
        el => el.style.backgroundColor === 'rgb(79, 70, 229)' || el.style.backgroundColor === '#4f46e5'
      );
    expect(stripe).toBeTruthy();
  });

  it('shows no text or icons when collapsed (not hovered)', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    // The root has 28px width; the overlay should have w-0 or be hidden
    // Check that no message text is visible
    expect(screen.queryByText('Hello from user')).toBeNull();
    expect(screen.queryByText('Hello from AI')).toBeNull();
  });
});

/* ── ANCS-02: hover expansion ─────────────────────────────── */

describe('ANCS-02: Hover expansion', () => {
  it('shows expanded overlay at ~220px on hover', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    // After hover, the overlay div should have w-[220px] class
    const overlay = root.querySelector('.shadow-lg');
    expect(overlay).toBeTruthy();
    expect(overlay!.className).toContain('w-[220px]');
  });
});

/* ── ANCS-03: overlay styling ─────────────────────────────── */

describe('ANCS-03: Overlay card styling', () => {
  it('has shadow-lg and rounded-r-lg classes', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const overlay = root.querySelector('.shadow-lg');
    expect(overlay).toBeTruthy();
    expect(overlay!.className).toContain('rounded-r-lg');
  });

  it('uses position:absolute (not pushing layout)', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const overlay = root.querySelector('.shadow-lg');
    expect(overlay).toBeTruthy();
    expect(overlay!.className).toContain('absolute');
  });
});

/* ── ANCS-04: bottom fade gradient ────────────────────────── */

describe('ANCS-04: Bottom fade gradient', () => {
  it('has bg-gradient-to-t element', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const fade = root.querySelector('.bg-gradient-to-t');
    expect(fade).toBeTruthy();
  });
});

/* ── ANCS-05: anchor message highlight ────────────────────── */

describe('ANCS-05: Anchor message highlight', () => {
  it('anchor message has text-sm class', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    // Find the anchor message element — has border-l-[3px] and text-sm
    const anchorEl = Array.from(root.querySelectorAll('div')).find(
      el => el.className.includes('text-sm') && el.className.includes('border-l-')
    );
    expect(anchorEl).toBeTruthy();
  });

  it('anchor message has thick left border (border-l-[3px])', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const anchorEl = Array.from(root.querySelectorAll('div')).find(
      el => el.className.includes('border-l-[3px]')
    );
    expect(anchorEl).toBeTruthy();
    expect(anchorEl!.className).toContain('text-sm');
  });

  it('anchor message has branch badge with text "branch"', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    // branch badge should be visible when hovered
    const badge = screen.getByText('branch');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('rounded-full');
  });
});

/* ── ANCS-06: minimum text size ───────────────────────────── */

describe('ANCS-06: No text-[10px] anywhere', () => {
  it('no text-[10px] class appears in any rendered output', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    // Check all elements for text-[10px]
    const allElements = root.querySelectorAll('*');
    allElements.forEach(el => {
      expect(el.className).not.toContain('text-[10px]');
    });
  });

  it('non-anchor messages use text-xs', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    // Find non-anchor message (m1 or m3)
    const nonAnchor = Array.from(root.querySelectorAll('div')).find(
      el => !el.style.borderColor && el.className.includes('text-xs') && el.className.includes('leading-snug')
    );
    expect(nonAnchor).toBeTruthy();
  });

  it('title in header uses text-xs', () => {
    const { container } = render(<AncestorPeekPanel {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const titleEl = screen.getByText('Child Thread');
    expect(titleEl.className).toContain('text-xs');
  });
});
