// frontend/src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock @react-oauth/google — prevents GIS SDK script loading in jsdom
vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  GoogleLogin: ({ onSuccess }: { onSuccess?: (r: { credential: string }) => void }) =>
    React.createElement(
      'button',
      {
        'data-testid': 'google-login-button',
        onClick: () => onSuccess?.({ credential: 'mock-google-credential' }),
      },
      'Sign in with Google'
    ),
}));
