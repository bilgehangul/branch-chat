---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/index.ts
  - backend/src/middleware/auth.ts
  - frontend/src/contexts/AuthContext.tsx
  - frontend/src/components/auth/SignInButton.tsx
autonomous: true
requirements: [GAUTH-01, GAUTH-02, GAUTH-03]

must_haves:
  truths:
    - "Backend refuses to start if GOOGLE_CLIENT_ID is missing or empty"
    - "Backend rejects tokens where email_verified is false"
    - "Frontend detects expired JWT and auto-signs out instead of showing stale signed-in state"
    - "SignInButton surfaces Google error details to console for debugging"
  artifacts:
    - path: "backend/src/index.ts"
      provides: "Startup env validation"
      contains: "GOOGLE_CLIENT_ID"
    - path: "backend/src/middleware/auth.ts"
      provides: "email_verified check + audience validation"
      contains: "email_verified"
    - path: "frontend/src/contexts/AuthContext.tsx"
      provides: "Token expiration check on init and getToken"
      contains: "exp"
    - path: "frontend/src/components/auth/SignInButton.tsx"
      provides: "Error details logging"
  key_links:
    - from: "frontend/src/contexts/AuthContext.tsx"
      to: "localStorage"
      via: "exp claim check removes stale token"
      pattern: "exp.*Date\\.now"
---

<objective>
Fix Google OAuth reliability: add env var validation at backend startup, check email_verified in token verification, handle expired JWTs on frontend, and improve error logging in sign-in flow.

Purpose: Prevent cryptic failures from missing env vars, stale tokens, and unverified emails.
Output: Hardened auth across 4 files.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@backend/src/index.ts
@backend/src/middleware/auth.ts
@frontend/src/contexts/AuthContext.tsx
@frontend/src/components/auth/SignInButton.tsx
@frontend/src/api/client.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend — env validation at startup + email_verified check in auth middleware</name>
  <files>backend/src/index.ts, backend/src/middleware/auth.ts</files>
  <action>
**backend/src/index.ts:**
Add a startup validation block BEFORE app.listen(). Check that GOOGLE_CLIENT_ID is a non-empty string. If missing/empty, log a clear error message and call process.exit(1). Also validate MONGODB_URI is set (warn but don't exit — it's optional for tests). Pattern:

```
const REQUIRED_ENV = ['GOOGLE_CLIENT_ID'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] FATAL: Missing required env var ${key}`);
    process.exit(1);
  }
}
```

Place this block after `import` statements but before `export const app = express()`.

**backend/src/middleware/auth.ts:**
1. Pass GOOGLE_CLIENT_ID to the OAuth2Client constructor: `new OAuth2Client(process.env.GOOGLE_CLIENT_ID)`. This ensures the client knows its expected audience.
2. After `ticket.getPayload()`, add an email_verified check:
```
if (!payload?.sub) throw new Error('No sub in token payload');
if (payload.email_verified === false) {
  res.status(403).json({
    data: null,
    error: { code: 'EMAIL_NOT_VERIFIED', message: 'Google email not verified.' },
  });
  return;
}
```
Note: check `=== false` specifically (not `!payload.email_verified`) because the field may be undefined for some token types, and undefined should not block.
  </action>
  <verify>
    <automated>cd backend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Backend exits with clear error if GOOGLE_CLIENT_ID missing. Auth middleware rejects unverified emails with 403. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Frontend — token expiration detection + sign-in error details</name>
  <files>frontend/src/contexts/AuthContext.tsx, frontend/src/components/auth/SignInButton.tsx</files>
  <action>
**frontend/src/contexts/AuthContext.tsx:**
1. Add a helper function `isTokenExpired(token: string): boolean` that decodes the JWT payload (same atob approach as decodeGoogleToken) and checks `payload.exp * 1000 < Date.now()`. Return true if expired or if decoding fails.

2. In the initial useState for token, check expiration: if stored token is expired, remove it from localStorage and return null.
```
const [token, setToken] = useState<string | null>(() => {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored && isTokenExpired(stored)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return stored;
});
```

3. Same for user useState — if token is expired, return null.

4. Update getToken to check expiration before returning. If expired, call signOut() and return null:
```
const getToken = useCallback(async () => {
  if (token && isTokenExpired(token)) {
    signOut();
    return null;
  }
  return token;
}, [token, signOut]);
```

5. Add a console.warn in GoogleOAuthProvider if VITE_GOOGLE_CLIENT_ID is falsy:
```
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
if (!clientId) {
  console.warn('[AuthProvider] VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work');
}
```

**frontend/src/components/auth/SignInButton.tsx:**
Update onError to log the actual error object for debugging:
```
onError={() => {
  console.error('[SignInButton] Google sign-in failed. Check VITE_GOOGLE_CLIENT_ID and browser console for details.');
}}
```
Note: GoogleLogin onError callback receives no error argument (react-oauth/google design), but the improved message tells developers WHERE to look.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Expired tokens are cleared on app load and on getToken() calls. Users with expired tokens see sign-in screen instead of broken signed-in state. Missing VITE_GOOGLE_CLIENT_ID logs a warning. SignInButton error message is actionable.</done>
</task>

</tasks>

<verification>
1. `cd backend && npx tsc --noEmit` — no type errors
2. `cd frontend && npx tsc --noEmit` — no type errors
3. Manual: Remove GOOGLE_CLIENT_ID from backend .env, start server — should exit with clear fatal error
4. Manual: Set an expired JWT in localStorage, reload frontend — should auto-clear and show sign-in
</verification>

<success_criteria>
- Backend refuses to start without GOOGLE_CLIENT_ID (process.exit(1) with clear message)
- Auth middleware returns 403 for unverified emails
- Frontend clears expired tokens on load and during getToken()
- No TypeScript errors in either project
</success_criteria>

<output>
After completion, create `.planning/quick/12-fix-google-auth-issues/12-SUMMARY.md`
</output>
