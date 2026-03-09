/**
 * Tests for MessageBlock component
 * Requirements: CHAT-06 (streaming visual state), CHAT-05 (role labels)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBlock } from '../../src/components/thread/MessageBlock';
import type { Message } from '../../src/types/index';

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
