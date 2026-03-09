import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as ClerkReact from '@clerk/clerk-react';

// App.tsx exports named export App
// We re-import after each mock override

describe('App auth routing', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders DemoChat when user is signed out', async () => {
    // SignedOut renders children, SignedIn renders nothing
    vi.mocked(ClerkReact).SignedOut = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedIn = () => null;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Sign in to start your own conversation/i)).toBeInTheDocument();
  });

  it('renders AppShell when user is signed in', async () => {
    // SignedIn renders children, SignedOut renders nothing
    vi.mocked(ClerkReact).SignedIn = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedOut = () => null;

    const { App } = await import('../../src/App');
    render(<App />);

    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
  });

  it('Clerk SignIn component is present in the DOM when modal is open', async () => {
    // SignedOut renders children (so DemoChat + AuthModal are visible)
    vi.mocked(ClerkReact).SignedOut = ({ children }: { children: React.ReactNode }) =>
      children as React.ReactElement;
    vi.mocked(ClerkReact).SignedIn = () => null;

    const { App } = await import('../../src/App');
    const { getByTestId, getByRole } = render(<App />);

    // Click the sign-in button to open modal
    const signInBtn = getByRole('button', { name: /sign in/i });
    signInBtn.click();

    expect(getByTestId('clerk-sign-in')).toBeInTheDocument();
  });
});
