import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as ClerkReact from '@clerk/clerk-react';

describe('App auth routing', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders DemoChat when user is signed out', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedOut = (({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedIn = (() => null) as any;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Sign in to start your own conversation/i)).toBeInTheDocument();
  });

  it('renders AppShell when user is signed in', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedIn = (({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedOut = (() => null) as any;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Ask anything to begin/i)).toBeInTheDocument();
  });

  it('Clerk SignIn component is present in the DOM when modal is open', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedOut = (({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ClerkReact).SignedIn = (() => null) as any;

    const { App } = await import('../../src/App');
    render(<App />);

    // Click the header sign-in button (first of the sign-in buttons in the DOM)
    const signInBtns = screen.getAllByRole('button', { name: /sign in/i });
    await userEvent.click(signInBtns[0]);

    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
  });
});
