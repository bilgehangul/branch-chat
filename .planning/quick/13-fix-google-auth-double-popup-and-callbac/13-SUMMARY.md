# Quick Task 13: Fix Google Auth Double-Popup and Callback Failure

**Status:** Complete
**Date:** 2026-03-10

## Problem
Google sign-in opened two popup windows and authentication callback never fired. Caused by React StrictMode double-mounting `GoogleOAuthProvider` inside `AuthProvider`, which initialized Google's Identity Services script twice.

## Solution
Moved `GoogleOAuthProvider` outside `StrictMode` in `main.tsx` so the GIS script loads exactly once. Removed it from `AuthContext.tsx`.

## Files Changed
- `frontend/src/main.tsx` — GoogleOAuthProvider wraps outside StrictMode
- `frontend/src/contexts/AuthContext.tsx` — removed GoogleOAuthProvider wrapper and client ID logic (moved to main.tsx)

## Verification
- `npx tsc -b --noEmit` passes with zero errors
- Test mock in setup.ts already handles both exports
