import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoChat } from '../../src/components/demo/DemoChat';

describe('DemoChat', () => {
  it('renders hardcoded demo messages', () => {
    render(<DemoChat onSignInClick={vi.fn()} />);
    // At least 2 message elements should be present (user + AI)
    const messages = screen.getAllByRole('article');
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it('chat input is disabled', () => {
    render(<DemoChat onSignInClick={vi.fn()} />);
    const input = screen.getByPlaceholderText(/sign in to start your own conversation/i);
    expect(input).toBeDisabled();
  });

  it('shows "Sign in to start your own conversation" text', () => {
    render(<DemoChat onSignInClick={vi.fn()} />);
    expect(
      screen.getByText(/sign in to start your own conversation/i)
    ).toBeInTheDocument();
  });

  it('does not call fetch', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<DemoChat onSignInClick={vi.fn()} />);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
