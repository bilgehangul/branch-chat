import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as ClerkReact from '@clerk/clerk-react';

describe('App auth routing', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders DemoChat when user is signed out', async () => {
    vi.mocked(ClerkReact).SignedOut = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedIn = () => null;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Sign in to start your own conversation/i)).toBeInTheDocument();
  });

  it('renders AppShell when user is signed in', async () => {
    vi.mocked(ClerkReact).SignedIn = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedOut = () => null;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
  });

  it('Clerk SignIn component is present in the DOM when modal is open', async () => {
    vi.mocked(ClerkReact).SignedOut = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedIn = () => null;

    const { App } = await import('../../src/App');
    render(<App />);

    // Click the header sign-in button (first of the sign-in buttons in the DOM)
    const signInBtns = screen.getAllByRole('button', { name: /sign in/i });
    await userEvent.click(signInBtns[0]);

    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
  });
});
