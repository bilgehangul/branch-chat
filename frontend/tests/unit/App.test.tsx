import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AuthContext with controlled state
let mockIsSignedIn = false;
let mockUser: { sub: string; email: string; name: string } | null = null;
const mockSignOut = vi.fn();

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
    user: mockUser,
    getToken: vi.fn().mockResolvedValue(null),
    signOut: mockSignOut,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock session store to prevent side effects
vi.mock('../../src/store/sessionStore', () => ({
  useSessionStore: (selector: (s: object) => unknown) => {
    const fakeState = {
      session: null,
      createSession: vi.fn(),
      clearSession: vi.fn(),
    };
    return selector(fakeState);
  },
}));

describe('App auth routing', () => {
  beforeEach(() => {
    vi.resetModules();
    mockIsSignedIn = false;
    mockUser = null;
  });

  it('renders DemoChat when user is signed out', async () => {
    mockIsSignedIn = false;
    const { App } = await import('../../src/App');
    render(<App />);
    expect(screen.getByText(/Sign in to start your own conversation/i)).toBeInTheDocument();
  });

  it('renders sign-in modal when Sign in button is clicked', async () => {
    mockIsSignedIn = false;
    const { App } = await import('../../src/App');
    render(<App />);

    // Click the header sign-in button
    const signInBtns = screen.getAllByRole('button', { name: /sign in/i });
    await userEvent.click(signInBtns[0]);

    // Modal should show the Google login button (mocked in setup.ts)
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
  });
});
