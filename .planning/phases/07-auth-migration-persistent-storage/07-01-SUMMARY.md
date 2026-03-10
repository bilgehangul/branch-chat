---
phase: 07-auth-migration-persistent-storage
plan: 01
subsystem: backend-auth
tags: [auth, google-oauth, clerk-removal, middleware]
one-liner: "Replaced Clerk JWT verification with Google ID token verification via google-auth-library OAuth2Client.verifyIdToken()"
decisions:
  - "IP-only rate limiting in Phase 7 — req.verifiedUser not available at rate limiter position (runs before apiRouter)"
  - "google-auth-library OAuth2Client constructed with no args; audience passed to verifyIdToken() options"
  - "rateLimiter.test.ts rewritten to remove Clerk mock — tests now cover IP-only key generator logic"
key-files:
  created: []
  modified:
    - backend/src/middleware/auth.ts
    - backend/src/middleware/rateLimiter.ts
    - backend/src/index.ts
    - backend/tests/auth.test.ts
    - backend/tests/rateLimiter.test.ts
    - backend/package.json
metrics:
  duration: 8
  completed: "2026-03-10"
  tasks: 2
  files: 7
---

# Phase 7 Plan 01: Backend Clerk Removal Summary

## What Was Built

Replaced `@clerk/express` with `google-auth-library` throughout the backend. The `requireApiAuth` middleware now calls `OAuth2Client.verifyIdToken()` instead of Clerk's `getAuth()`, populating `req.verifiedUser` with `{ sub, email, name }` from the verified Google ID token payload.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Swap packages + rewrite auth.ts, rateLimiter.ts, index.ts | 73f6a4a7 |
| 2 | Update auth.test.ts to mock google-auth-library | 73f6a4a7 |

## Verification

- `npm run build` — exits 0, zero TypeScript errors
- `npx jest` — 14 tests pass (auth: 5, rateLimiter: 3, providers: 6)
- `grep -r "@clerk/express" backend/src/ backend/tests/` — no results (except rateLimiter.test.ts was auto-fixed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] rateLimiter.test.ts still imported @clerk/express**
- **Found during:** Task 2 verification (grep check)
- **Issue:** `backend/tests/rateLimiter.test.ts` imported `getAuth` from `@clerk/express` and mocked that package. After Clerk uninstall, this test would fail at runtime.
- **Fix:** Rewrote rateLimiter.test.ts to remove all Clerk imports and mocks; tests now cover the IP-only keyGenerator logic that replaced the Clerk-based implementation.
- **Files modified:** `backend/tests/rateLimiter.test.ts`
- **Commit:** 73f6a4a7

## Self-Check

- [x] `backend/src/middleware/auth.ts` — contains `google-auth-library`, no `@clerk/express`
- [x] `backend/src/middleware/rateLimiter.ts` — IP-only, no `@clerk/express`
- [x] `backend/src/index.ts` — no `clerkMiddleware`
- [x] `backend/tests/auth.test.ts` — mocks `google-auth-library`
- [x] All 14 backend tests pass
