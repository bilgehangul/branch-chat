// frontend/src/tests/authContext.test.tsx
// Covers AUTH-01, AUTH-02, AUTH-05 — Google sign-in, token storage, sign-out.
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Build a minimal fake Google ID token JWT (header.payload.signature)
function makeFakeToken(payload: object): string {
  const b64 = (obj: object) => btoa(JSON.stringify(obj));
  return `${b64({ alg: 'RS256' })}.${b64(payload)}.fakesig`;
}

// Test component that exercises the auth context
function TestHarness() {
  const { isSignedIn, user, getToken, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="signed-in">{String(isSignedIn)}</span>
      <span data-testid="user-sub">{user?.sub ?? 'none'}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <button onClick={() => signIn(makeFakeToken({ sub: 'abc123', email: 'test@example.com', name: 'Test' }))}>
        sign-in
      </button>
      <button onClick={signOut}>sign-out</button>
      <button
        onClick={async () => {
          const t = await getToken();
          document.title = t ? 'has-token' : 'no-token';
        }}
      >
        check-token
      </button>
    </div>
  );
}

function renderWithAuth() {
  return render(<AuthProvider><TestHarness /></AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
});

describe('AuthProvider', () => {
  it('AUTH-03 (guest): isSignedIn is false when no token in localStorage', () => {
    renderWithAuth();
    expect(screen.getByTestId('signed-in').textContent).toBe('false');
  });

  it('AUTH-01/02: signIn stores token in localStorage and updates state', async () => {
    renderWithAuth();
    await userEvent.click(screen.getByRole('button', { name: 'sign-in' }));
    expect(screen.getByTestId('signed-in').textContent).toBe('true');
    expect(screen.getByTestId('user-sub').textContent).toBe('abc123');
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    expect(localStorage.getItem('google_id_token')).toBeTruthy();
  });

  it('AUTH-05: signOut removes token from localStorage and sets isSignedIn false', async () => {
    renderWithAuth();
    await userEvent.click(screen.getByRole('button', { name: 'sign-in' }));
    expect(screen.getByTestId('signed-in').textContent).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: 'sign-out' }));
    expect(screen.getByTestId('signed-in').textContent).toBe('false');
    expect(localStorage.getItem('google_id_token')).toBeNull();
  });

  it('AUTH-05: getToken returns null after signOut', async () => {
    renderWithAuth();
    await userEvent.click(screen.getByRole('button', { name: 'sign-in' }));
    await userEvent.click(screen.getByRole('button', { name: 'sign-out' }));
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'check-token' }));
    });
    expect(document.title).toBe('no-token');
  });
});
