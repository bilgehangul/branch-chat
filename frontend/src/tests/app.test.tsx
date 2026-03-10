// frontend/src/tests/app.test.tsx
// Covers AUTH-03 — guest path renders DemoChat, signed-in path renders AppShell.
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useSessionStore to prevent store side effects
const fakeSessionState = {
  session: null,
  threads: {},
  messages: {},
  activeThreadId: null,
  createSession: vi.fn(),
  clearSession: vi.fn(),
  hydrateSession: vi.fn(),
  setActiveThread: vi.fn(),
  createThread: vi.fn(),
  addMessage: vi.fn(),
  updateMessage: vi.fn(),
  setMessageStreaming: vi.fn(),
  addChildLead: vi.fn(),
  addAnnotation: vi.fn(),
  updateAnnotation: vi.fn(),
  setScrollPosition: vi.fn(),
  setThreadTitle: vi.fn(),
  deleteThread: vi.fn(),
  summarizeThread: vi.fn(),
  compactThread: vi.fn(),
};

const mockUseSessionStore = (selector?: (s: typeof fakeSessionState) => unknown) => {
  if (typeof selector === 'function') return selector(fakeSessionState);
  return fakeSessionState;
};
mockUseSessionStore.getState = () => fakeSessionState;

vi.mock('../store/sessionStore', () => ({
  useSessionStore: mockUseSessionStore,
  initialState: fakeSessionState,
}));

// Mock sessions API (no real fetch in unit tests)
vi.mock('../api/sessions', () => ({
  fetchSessions: vi.fn().mockResolvedValue([]),
  createSessionOnBackend: vi.fn().mockResolvedValue(null),
}));

// Mock AuthContext with controlled state
const mockSignOut = vi.fn();
let mockIsSignedIn = false;
let mockUser: { sub: string; email: string; name: string } | null = null;

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
    user: mockUser,
    getToken: vi.fn().mockResolvedValue(null),
    signOut: mockSignOut,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App routing', () => {
  beforeEach(() => {
    mockIsSignedIn = false;
    mockUser = null;
  });

  it('AUTH-03: unauthenticated user sees DemoChat (guest access)', async () => {
    const { App } = await import('../App');
    mockIsSignedIn = false;
    mockUser = null;
    render(<App />);
    // DemoChat shows "Sign in to start your own conversation"
    expect(screen.getByText(/Sign in to start your own conversation/i)).toBeInTheDocument();
  });

  it('AUTH-03: authenticated user sees AppShell (not DemoChat)', async () => {
    const { App } = await import('../App');
    mockIsSignedIn = true;
    mockUser = { sub: 'abc', email: 'a@b.com', name: 'A' };
    render(<App />);
    // AppShell has a header element
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
