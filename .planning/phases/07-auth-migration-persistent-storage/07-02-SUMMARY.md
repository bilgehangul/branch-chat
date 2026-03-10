---
phase: 07-auth-migration-persistent-storage
plan: 02
subsystem: frontend-auth
tags: [auth, google-oauth, clerk-removal, react-context, localStorage]
one-liner: "Replaced ClerkProvider/useAuth with custom AuthContext backed by @react-oauth/google GoogleLogin component and localStorage token storage"
decisions:
  - "SignInModal overlay in App.tsx wraps SignInButton — DemoChat's onSignInClick prop unchanged"
  - "AppShell accepts onSignOut and user props from App.tsx — removes Clerk UserButton dependency"
  - "ThreadView.tsx imported useAuth from Clerk — auto-fixed to import from AuthContext"
  - "tests/unit/App.test.tsx was Clerk-based — rewritten to mock AuthContext (Rule 3)"
key-files:
  created:
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/components/auth/SignInButton.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/main.tsx
    - frontend/src/tests/setup.ts
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/tests/unit/App.test.tsx
metrics:
  duration: 10
  completed: "2026-03-10"
  tasks: 2
  files: 10
---

# Phase 7 Plan 02: Frontend Clerk Removal Summary

## What Was Built

Removed `@clerk/clerk-react` from the frontend and replaced it with a custom `AuthContext.tsx` backed by `@react-oauth/google`. The `GoogleLogin` component is used for sign-in (returns ID token, not access token). Token is stored in localStorage under `google_id_token`. The `getToken()` function maintains the same `() => Promise<string | null>` signature as Clerk's version, so no changes to the API layer were needed.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create AuthContext.tsx + SignInButton.tsx, install @react-oauth/google | 9b2740e3 |
| 2 | Update App.tsx, AppShell.tsx, main.tsx, setup.ts | 9b2740e3 |

## Verification

- `npx tsc --noEmit` — exits 0, zero TypeScript errors
- `npx vitest run src/tests/ tests/unit/` — 151 tests pass, 6 todo
- `grep -r "@clerk" frontend/src/` — no results

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ThreadView.tsx imported useAuth from @clerk/clerk-react**
- **Found during:** Task 2, TypeScript compilation check
- **Issue:** `frontend/src/components/thread/ThreadView.tsx` imported `useAuth` from `@clerk/clerk-react` — would fail after package uninstall
- **Fix:** Changed import to `import { useAuth } from '../../contexts/AuthContext'`
- **Files modified:** `frontend/src/components/thread/ThreadView.tsx`
- **Commit:** 9b2740e3

**2. [Rule 3 - Blocking] tests/unit/App.test.tsx used @clerk/clerk-react directly**
- **Found during:** Task 2, test run
- **Issue:** The test file imported `* as ClerkReact from '@clerk/clerk-react'` and manipulated Clerk component mocks — fails after package removal
- **Fix:** Rewrote test to mock `AuthContext` and test the same routing behavior (DemoChat vs AppShell) using the new auth pattern
- **Files modified:** `frontend/tests/unit/App.test.tsx`
- **Commit:** 9b2740e3

## Self-Check

- [x] `frontend/src/contexts/AuthContext.tsx` exports AuthProvider and useAuth
- [x] `frontend/src/components/auth/SignInButton.tsx` uses GoogleLogin component
- [x] `frontend/src/main.tsx` uses AuthProvider (no ClerkProvider)
- [x] `frontend/src/App.tsx` uses useAuth() from AuthContext (no Clerk imports)
- [x] `frontend/src/tests/setup.ts` mocks @react-oauth/google (no @clerk mock)
- [x] All 151 unit tests pass
