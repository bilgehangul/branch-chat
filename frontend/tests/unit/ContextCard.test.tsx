/**
 * Tests for ContextCard component
 * Requirements: CHAT-05
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextCard } from '../../src/components/thread/ContextCard';
import type { Thread } from '../../src/types/index';

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 'thread-1',
    depth: 1,
    parentThreadId: 'parent-1',
    anchorText: 'Some selected text',
    parentMessageId: 'msg-1',
    title: 'Child Thread',
    accentColor: '#3b82f6',
    messageIds: [],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

describe('ContextCard', () => {
  // CHAT-05: Anchor text display
  it('renders anchor text when thread.depth >= 1 and anchorText is set', () => {
    render(<ContextCard thread={makeThread({ depth: 1, anchorText: 'Selected text here' })} />);
    expect(screen.getByText('"Selected text here"')).toBeInTheDocument();
    expect(screen.getByText('Branched from parent thread')).toBeInTheDocument();
  });

  it('renders nothing when thread.depth === 0', () => {
    const { container } = render(
      <ContextCard thread={makeThread({ depth: 0, anchorText: 'Some text' })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when anchorText is null', () => {
    const { container } = render(
      <ContextCard thread={makeThread({ depth: 1, anchorText: null })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('applies the accentColor as border-left color', () => {
    const { container } = render(
      <ContextCard thread={makeThread({ depth: 1, anchorText: 'Text', accentColor: '#ff0000' })} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.style.borderColor).toBe('rgb(255, 0, 0)');
  });

  it('renders at depth >= 2 as well', () => {
    render(<ContextCard thread={makeThread({ depth: 2, anchorText: 'Deeper anchor' })} />);
    expect(screen.getByText('"Deeper anchor"')).toBeInTheDocument();
  });
});
