import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SignedOut: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SignIn: () => React.createElement('div', { 'data-testid': 'clerk-sign-in' }),
  useAuth: () => ({
    signOut: vi.fn(),
    getToken: vi.fn().mockResolvedValue('test-token'),
    isSignedIn: false,
  }),
  useUser: () => ({ user: null, isSignedIn: false }),
}));
