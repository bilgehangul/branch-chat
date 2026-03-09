/**
 * Tests for MessageBlock component
 * Requirements: CHAT-06 (streaming visual state), CHAT-05 (role labels), BRANCH-07 (anchor underline)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBlock } from '../../src/components/thread/MessageBlock';
import type { Message, Thread } from '../../src/types/index';

// Mock sessionStore for underline tests
vi.mock('../../src/store/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    threadId: 'thread-1',
    role: 'user',
    content: 'Hello world',
    annotations: [],
    childLeads: [],
    isStreaming: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

// Setup mock store to return empty threads by default
const mockUseSessionStore = vi.fn();
beforeEach(async () => {
  const { useSessionStore } = await import('../../src/store/sessionStore');
  (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (state: { threads: Record<string, Partial<Thread>> }) => unknown) =>
      selector({ threads: {} })
  );
  mockUseSessionStore;
});

describe('MessageBlock', () => {
  // CHAT-06: Streaming visual state
  it('has opacity-80 class when isStreaming is true', () => {
    const { container } = render(
      <MessageBlock message={makeMessage({ role: 'user', isStreaming: true })} />
    );
    // The content container should have opacity-80
    const contentDiv = container.querySelector('.opacity-80');
    expect(contentDiv).toBeInTheDocument();
  });

  it('has select-none class when isStreaming is true', () => {
    const { container } = render(
      <MessageBlock message={makeMessage({ role: 'user', isStreaming: true })} />
    );
    const selectNoneEl = container.querySelector('.select-none');
    expect(selectNoneEl).toBeInTheDocument();
  });

  it('does not have opacity-80 class when isStreaming is false', () => {
    const { container } = render(
      <MessageBlock message={makeMessage({ role: 'user', isStreaming: false })} />
    );
    const opacityEl = container.querySelector('.opacity-80');
    expect(opacityEl).not.toBeInTheDocument();
  });

  it('does not have select-none class when isStreaming is false', () => {
    const { container } = render(
      <MessageBlock message={makeMessage({ role: 'user', isStreaming: false })} />
    );
    const selectNoneEl = container.querySelector('.select-none');
    expect(selectNoneEl).not.toBeInTheDocument();
  });

  // Role labels
  it('renders role label "You" for user messages', () => {
    render(<MessageBlock message={makeMessage({ role: 'user' })} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders role label "Gemini" for assistant messages', () => {
    render(
      <MessageBlock
        message={makeMessage({ role: 'assistant', content: 'I can help.' })}
      />
    );
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  // Content rendering
  it('renders user message content as plain text', () => {
    render(<MessageBlock message={makeMessage({ role: 'user', content: 'My question here' })} />);
    expect(screen.getByText('My question here')).toBeInTheDocument();
  });

  it('renders assistant message with MarkdownRenderer (content appears)', () => {
    render(
      <MessageBlock
        message={makeMessage({ role: 'assistant', content: '**bold answer**' })}
      />
    );
    // MarkdownRenderer will produce a <strong> element
    const { container } = render(
      <MessageBlock
        message={makeMessage({ role: 'assistant', content: '**bold answer**' })}
      />
    );
    expect(container.querySelector('strong')).toBeInTheDocument();
  });
});

describe('MessageBlock anchor underline (BRANCH-07)', () => {
  it('renders colored underline on paragraph matching childLead.paragraphIndex', async () => {
    const { useSessionStore } = await import('../../src/store/sessionStore');
    const childThreadId = 'child-thread-1';
    const accentColor = '#C9A0A0'; // dusty rose from ACCENT_PALETTE

    // Mock store to return a thread with known accentColor
    (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { threads: Record<string, Partial<Thread>> }) => unknown) =>
        selector({
          threads: {
            [childThreadId]: {
              id: childThreadId,
              accentColor,
            } as Thread,
          },
        })
    );

    const message = makeMessage({
      role: 'assistant',
      content: 'First paragraph text.',
      childLeads: [
        {
          threadId: childThreadId,
          paragraphIndex: 0,
          anchorText: 'First paragraph',
          messageCount: 0,
        },
      ],
    });

    const { container } = render(<MessageBlock message={message} />);

    // Find the paragraph with data-paragraph-id="0"
    const para = container.querySelector('[data-paragraph-id="0"]') as HTMLElement | null;
    expect(para).toBeInTheDocument();
    expect(para?.style.textDecoration).toBe('underline');
    // jsdom normalizes hex colors to rgb() — check that the color is set (non-empty)
    expect(para?.style.textDecorationColor).toBeTruthy();
  });

  it('does not apply underline to paragraphs NOT in childLeads', async () => {
    const { useSessionStore } = await import('../../src/store/sessionStore');
    const childThreadId = 'child-thread-2';
    const accentColor = '#8FAF8F';

    (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { threads: Record<string, Partial<Thread>> }) => unknown) =>
        selector({
          threads: {
            [childThreadId]: {
              id: childThreadId,
              accentColor,
            } as Thread,
          },
        })
    );

    // childLead is for paragraphIndex=1, but content has only 1 paragraph (index 0)
    const message = makeMessage({
      role: 'assistant',
      content: 'Only paragraph here.',
      childLeads: [
        {
          threadId: childThreadId,
          paragraphIndex: 1, // paragraph 1 — won't match index 0
          anchorText: 'some text',
          messageCount: 0,
        },
      ],
    });

    const { container } = render(<MessageBlock message={message} />);

    const para = container.querySelector('[data-paragraph-id="0"]') as HTMLElement | null;
    expect(para).toBeInTheDocument();
    // Should NOT have underline style
    expect(para?.style.textDecoration).toBeFalsy();
  });

  it('no underline when childLeads is empty', async () => {
    const { useSessionStore } = await import('../../src/store/sessionStore');
    (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { threads: Record<string, Partial<Thread>> }) => unknown) =>
        selector({ threads: {} })
    );

    const message = makeMessage({
      role: 'assistant',
      content: 'No leads here.',
      childLeads: [],
    });

    const { container } = render(<MessageBlock message={message} />);
    const para = container.querySelector('[data-paragraph-id="0"]') as HTMLElement | null;
    expect(para).toBeInTheDocument();
    expect(para?.style.textDecoration).toBeFalsy();
  });
});
