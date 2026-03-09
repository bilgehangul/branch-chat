---
phase: 02-frontend-foundation
plan: 01
subsystem: ui
tags: [react, vite, tailwindcss, clerk, zustand, vitest, typescript, jsdom]

# Dependency graph
requires:
  - phase: 01-backend-proxy-shell
    provides: shared/types.ts (Role, Message, SseEvent, ApiResponse) imported by frontend
provides:
  - Vite + React + TypeScript scaffold with @tailwindcss/vite v4 and @/ path alias
  - ClerkProvider root with VITE_CLERK_PUBLISHABLE_KEY guard
  - App.tsx SignedIn/SignedOut conditional routing with AuthModal (routing=hash)
  - DemoChat.tsx read-only guest view with hardcoded messages and disabled input CTA
  - AppShell.tsx Phase 3 layout skeleton
  - Vitest jsdom test environment with global Clerk mock
  - 26 test stubs (7 green, 19 todo) ready for Plans 02 and 03 to fill in
affects:
  - 02-02 (sessionStore and selectors — stubs already green when store lands)
  - 02-03 (api/chat.ts SSE client — stubs already green when client lands)
  - 03-xx (AppShell component — will replace skeleton content)

# Tech tracking
tech-stack:
  added:
    - react@^19
    - react-dom@^19
    - vite@^6
    - @vitejs/plugin-react
    - "@clerk/clerk-react@^5"
    - "zustand@^5"
    - "tailwindcss@^4"
    - "@tailwindcss/vite@^4"
    - "vitest@^3"
    - "@testing-library/react@^16"
    - "@testing-library/user-event@^14"
    - "@testing-library/jest-dom@^6"
    - jsdom
  patterns:
    - Clerk modal auth (no /sign-in route) — routing="hash" on <SignIn>
    - SignedIn/SignedOut conditional rendering for auth-gated views
    - Global Clerk mock in src/tests/setup.ts via vi.mock() with React.createElement (no JSX in .ts file)
    - @/src/* path alias in both vite.config.ts and tsconfig.app.json
    - rootDir="../.." in tsconfig.app.json for shared/types.ts access
    - TDD flow: stub todo → real failing test → implement → green

key-files:
  created:
    - frontend/vite.config.ts
    - frontend/vitest.config.ts
    - frontend/tsconfig.app.json
    - frontend/src/main.tsx
    - frontend/src/App.tsx
    - frontend/src/index.css
    - frontend/src/tests/setup.ts
    - frontend/src/components/demo/DemoChat.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/tests/unit/App.test.tsx
    - frontend/tests/unit/DemoChat.test.tsx
    - frontend/tests/unit/sessionStore.test.ts
    - frontend/tests/unit/selectors.test.ts
    - frontend/tests/unit/api.chat.test.ts
    - frontend/.env.example
  modified:
    - frontend/tsconfig.app.json (rootDir, paths, include tests)
    - frontend/src/index.css (Tailwind v4 import + @variant dark)

key-decisions:
  - "Clerk modal auth with routing=hash — no /sign-in route needed; URL stays unchanged on modal open"
  - "Global Clerk mock in .ts (not .tsx) uses React.createElement to avoid JSX parse error in esbuild"
  - "tsconfig.app.json rootDir=../.. so shared/types.ts resolves without TS6059 errors"
  - "UserButton added to Clerk mock — App.tsx imports it and vi.mock must be exhaustive"
  - "DemoChat has visible CTA text as <p> element (not only as input placeholder) so getByText assertion works"

patterns-established:
  - "Pattern: Clerk mocking — vi.mock('@clerk/clerk-react') in setup.ts using React.createElement; per-test overrides via vi.mocked(ClerkReact).SignedIn = ..."
  - "Pattern: App-level auth gate — SignedIn renders real app shell; SignedOut renders demo/landing"
  - "Pattern: Modal-based auth — isModalOpen state in App.tsx, <SignIn routing='hash'> in backdrop overlay"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 02 Plan 01: Frontend Scaffold + Clerk Auth + DemoChat Summary

**React/Vite scaffold with Tailwind v4, Clerk modal auth (SignedIn/SignedOut routing), hardcoded DemoChat guest view, and AppShell skeleton with 7 green tests and 19 todo stubs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T12:22:06Z
- **Completed:** 2026-03-09T12:28:10Z
- **Tasks:** 2 (Task 0: scaffold + stubs, Task 1: TDD auth components)
- **Files modified:** 15 created + 2 modified

## Accomplishments

- Vite React-TS scaffold with @tailwindcss/vite (v4), zustand, @clerk/clerk-react, and full vitest jsdom test setup
- ClerkProvider root in main.tsx with early guard on VITE_CLERK_PUBLISHABLE_KEY
- App.tsx wiring SignedIn -> AppShell and SignedOut -> DemoChat with isModalOpen state controlling Clerk SignIn overlay
- DemoChat component with 4 hardcoded research Q&A messages, disabled input, and visible "Sign in to start your own conversation" CTA
- 7 tests green: 3 App routing tests (signed-out, signed-in, modal open) + 4 DemoChat tests (messages, disabled, CTA text, no fetch)
- 19 todo stubs in place for sessionStore, selectors, and api.chat — ready for Plans 02-02 and 02-03

## Task Commits

1. **Task 0: Wave 0 — Vite scaffold + test stub files** - `0a831c7` (feat)
2. **Task 1: TDD RED — failing tests for App and DemoChat** - `3f8231d` (test)
3. **Task 1: TDD GREEN — Clerk provider, App routing, DemoChat + AppShell** - `46af8b0` (feat)

## Files Created/Modified

- `frontend/vite.config.ts` — react + @tailwindcss/vite plugins, @/ alias, /api proxy to localhost:3001
- `frontend/vitest.config.ts` — jsdom environment, globals:true, setupFiles pointing to src/tests/setup.ts
- `frontend/tsconfig.app.json` — rootDir=../.. for shared types, paths @/*, includes tests/
- `frontend/src/main.tsx` — ClerkProvider root with VITE_CLERK_PUBLISHABLE_KEY guard
- `frontend/src/App.tsx` — SignedIn/SignedOut routing, AuthModal (routing=hash), LogoutButton
- `frontend/src/index.css` — @import "tailwindcss" + @variant dark class strategy
- `frontend/src/tests/setup.ts` — @testing-library/jest-dom + global vi.mock @clerk/clerk-react
- `frontend/src/components/demo/DemoChat.tsx` — hardcoded demo messages, disabled input, sign-in CTA
- `frontend/src/components/layout/AppShell.tsx` — Phase 3 skeleton with header/main/footer areas
- `frontend/tests/unit/App.test.tsx` — 3 passing tests for auth routing
- `frontend/tests/unit/DemoChat.test.tsx` — 4 passing tests for DemoChat behavior
- `frontend/tests/unit/sessionStore.test.ts` — 9 todo stubs
- `frontend/tests/unit/selectors.test.ts` — 5 todo stubs
- `frontend/tests/unit/api.chat.test.ts` — 5 todo stubs
- `frontend/.env.example` — VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL

## Decisions Made

- **Clerk mock in .ts not .tsx:** The setup.ts file uses vi.mock() with React.createElement (not JSX) to avoid esbuild parse errors in non-tsx files.
- **UserButton added to Clerk mock:** App.tsx imports UserButton from @clerk/clerk-react; the global mock must include it or Vitest throws a missing export error.
- **DemoChat CTA text as visible element:** The "Sign in to start your own conversation" text is rendered in a `<p>` tag (not only as input placeholder) so `screen.getByText()` can locate it.
- **tsconfig.app.json not tsconfig.json:** The Vite scaffold creates a composite project with tsconfig.app.json for app code — rootDir and paths go in that file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added UserButton to Clerk mock in setup.ts**
- **Found during:** Task 1 (implementing App.tsx)
- **Issue:** App.tsx imports UserButton from @clerk/clerk-react; the plan's mock spec in setup.ts did not include it. Vitest throws "No UserButton export defined on mock" when tests run.
- **Fix:** Added `UserButton: () => React.createElement('div', { 'data-testid': 'clerk-user-button' })` to the mock object in setup.ts.
- **Files modified:** frontend/src/tests/setup.ts
- **Committed in:** 46af8b0 (Task 1 feat commit)

**2. [Rule 1 - Bug] DemoChat CTA text must be visible element, not only placeholder**
- **Found during:** Task 1 (DemoChat TDD green phase)
- **Issue:** `getByText(/sign in to start your own conversation/i)` fails because the text only appears as an input placeholder attribute, not as rendered text content.
- **Fix:** Added a `<p>` element with the CTA text above the input row in DemoChat.tsx.
- **Files modified:** frontend/src/components/demo/DemoChat.tsx
- **Committed in:** 46af8b0 (Task 1 feat commit)

**3. [Rule 1 - Bug] App test with multiple sign-in buttons needed getAllByRole**
- **Found during:** Task 1 (App auth routing test 3)
- **Issue:** DemoChat has 2 "Sign in" buttons (header + footer area); `getByRole('button', {name:/sign in/i})` throws "Found multiple elements".
- **Fix:** Switched test to `getAllByRole('button', {name:/sign in/i})` and click index [0] (header button).
- **Files modified:** frontend/tests/unit/App.test.tsx
- **Committed in:** 46af8b0 (Task 1 feat commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical mock, 2 bugs)
**Impact on plan:** All three were necessary for tests to pass. No scope creep — each fix addressed a real correctness issue.

## Issues Encountered

- setup.ts JSX parse error: setup file was initially written with JSX syntax (`<>{children}</>`), but `.ts` files are not transformed for JSX by esbuild. Resolved by switching to `React.createElement` calls (Rule 1 auto-fix during Task 0).

## User Setup Required

None — no external service configuration required at this stage. Clerk publishable key is documented in `frontend/.env.example` and will be needed when running `npm run dev`.

## Next Phase Readiness

- Frontend scaffold complete; `cd frontend && npm run dev` starts (throws on missing VITE_CLERK_PUBLISHABLE_KEY as designed)
- 19 todo stubs in sessionStore.test.ts, selectors.test.ts, and api.chat.test.ts are ready targets for Plan 02-02 (store) and 02-03 (SSE client)
- AppShell.tsx is a skeleton — Phase 3 fills in thread view, breadcrumb bar, and chat input

## Self-Check: PASSED

- FOUND: frontend/vite.config.ts
- FOUND: frontend/vitest.config.ts
- FOUND: frontend/src/main.tsx
- FOUND: frontend/src/App.tsx
- FOUND: frontend/src/components/demo/DemoChat.tsx
- FOUND: frontend/src/components/layout/AppShell.tsx
- FOUND: frontend/src/tests/setup.ts
- FOUND commit: 0a831c7 (Task 0 scaffold)
- FOUND commit: 3f8231d (Task 1 TDD RED)
- FOUND commit: 46af8b0 (Task 1 TDD GREEN)

---
*Phase: 02-frontend-foundation*
*Completed: 2026-03-09*
