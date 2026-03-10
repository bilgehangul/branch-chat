---
phase: quick-12
plan: 01
subsystem: auth
tags: [google-oauth, security, token-expiration, env-validation]
dependency_graph:
  requires: []
  provides: [env-validation, email-verified-check, token-expiration-handling]
  affects: [backend-startup, auth-middleware, frontend-auth]
tech_stack:
  added: []
  patterns: [startup-env-validation, jwt-expiration-check, email-verified-guard]
key_files:
  created: []
  modified:
    - backend/src/index.ts
    - backend/src/middleware/auth.ts
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/components/auth/SignInButton.tsx
decisions:
  - "process.exit(1) for missing GOOGLE_CLIENT_ID; warn-only for MONGODB_URI"
  - "email_verified === false check (not !payload.email_verified) to allow undefined"
  - "isTokenExpired treats decode failure as expired (safe default)"
  - "clientId warning runs every render (cheap check, no useMemo needed)"
metrics:
  duration: "1 min"
  completed: "2026-03-10"
---

# Quick Task 12: Fix Google Auth Issues Summary

Hardened Google OAuth across backend and frontend: env var validation at startup, email_verified rejection, JWT expiration auto-cleanup, and actionable error logging.

## What Was Done

### Task 1: Backend env validation + email_verified check
**Commit:** 36e3ff0a

- Added startup validation block in `backend/src/index.ts` that checks `GOOGLE_CLIENT_ID` is set, exits with `process.exit(1)` and clear error if missing
- Added `MONGODB_URI` warning (non-fatal) for awareness
- Passed `GOOGLE_CLIENT_ID` to `OAuth2Client` constructor for proper audience validation
- Added `email_verified === false` guard in auth middleware returning 403 `EMAIL_NOT_VERIFIED`

### Task 2: Frontend token expiration + error logging
**Commit:** ae87816b

- Added `isTokenExpired()` helper that decodes JWT exp claim and compares against `Date.now()`
- Updated `useState` initializers for both `token` and `user` to clear expired tokens from localStorage on app load
- Updated `getToken()` to auto-sign out and return null if token is expired
- Added console warning when `VITE_GOOGLE_CLIENT_ID` is not set
- Improved `SignInButton` error message to direct developers to check the env var

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- Backend TypeScript: compiles clean (`npx tsc --noEmit`)
- Frontend TypeScript: compiles clean (`npx tsc --noEmit`)

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backend env validation + email_verified | 36e3ff0a | backend/src/index.ts, backend/src/middleware/auth.ts |
| 2 | Frontend token expiration + error logging | ae87816b | frontend/src/contexts/AuthContext.tsx, frontend/src/components/auth/SignInButton.tsx |
