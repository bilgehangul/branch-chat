---
phase: 01-backend-proxy-shell
plan: 03
subsystem: api
tags: [express, clerk, jwt, sse, rate-limiting, cors, supertest, ipKeyGenerator]

# Dependency graph
requires:
  - phase: 01-01
    provides: backend scaffold, tsconfig, test infrastructure, shared/types.ts
  - phase: 01-02
    provides: AIProvider/SearchProvider interfaces, GeminiProvider, TavilyProvider, config.ts singleton exports

provides:
  - Express app entry point with correct middleware order (clerkMiddleware first)
  - requireApiAuth middleware — 401 JSON on unauthenticated requests
  - apiRateLimiter — per-user rate limiting using Clerk userId or req.ip
  - POST /api/chat — SSE streaming via aiProvider.streamChat() with AbortController
  - POST /api/simplify — single-shot JSON via aiProvider.simplify()
  - POST /api/find-sources — single-shot JSON via searchProvider.findSources()
  - Authenticated router (routes/index.ts) — requireApiAuth on all sub-routes in one place
  - 14 passing tests (4 auth integration + 6 providers + 4 rateLimiter keyGenerator)

affects:
  - phase 02 frontend (needs /api/chat SSE endpoint, /api/simplify, /api/find-sources)
  - phase 05 auth enforcement (clerkMiddleware order established here)

# Tech tracking
tech-stack:
  added: [@types/cors (devDep — missing type declaration)]
  patterns:
    - clerkMiddleware() registered first on app — before all other middleware
    - requireApiAuth on authenticated sub-router, not per-route — single protection point
    - SSE: flushHeaders() before async call, AbortController on req.on('close')
    - Route handlers import { aiProvider, searchProvider } from config.ts singletons — never branch on AI_PROVIDER
    - Tests mock @clerk/express at module level so no real Clerk keys needed in CI

key-files:
  created:
    - backend/src/middleware/auth.ts
    - backend/src/middleware/rateLimiter.ts
    - backend/src/routes/chat.ts
    - backend/src/routes/simplify.ts
    - backend/src/routes/find-sources.ts
    - backend/src/routes/index.ts
    - backend/src/index.ts
  modified:
    - backend/tests/auth.test.ts (replaced todo stubs with real supertest assertions)
    - backend/tests/rateLimiter.test.ts (replaced todo stubs with keyGenerator logic tests)
    - backend/package.json (added @types/cors devDependency)

key-decisions:
  - "apiRouter uses a single requireApiAuth at the top — every route mounted in routes/index.ts is automatically protected without per-route decoration"
  - "SSE flushHeaders() called before aiProvider.streamChat() — required so response headers reach client before async streaming begins"
  - "rateLimiter tests test keyGenerator LOGIC directly (mock + manual invocation) rather than through full middleware pipeline — avoids needing a running server for this unit test"
  - "@types/cors added as devDependency — cors package had no bundled types, blocked TypeScript compilation (Rule 3 auto-fix)"
  - "ipKeyGenerator(ip: string) from express-rate-limit accepts an IP string not a Request object — pass req.ip, not req itself"

patterns-established:
  - "Auth protection: mount routes in routes/index.ts and apiRouter.use(requireApiAuth) handles all of them"
  - "SSE pattern: setHeader Content-Type text/event-stream + flushHeaders() + AbortController + req.on('close')"
  - "Error envelopes: { data: null, error: { code: string, message: string } } for all error responses"
  - "Test mocking: jest.mock('@clerk/express') at top of test file — clerkMiddleware becomes pass-through, getAuth returns controlled userId"

requirements-completed: [AUTH-04, UI-03]

# Metrics
duration: 20min
completed: 2026-03-09
---

# Phase 01 Plan 03: Express Server Wiring Summary

**Express server with Clerk JWT auth on all three API routes (401 without valid JWT), SSE streaming for /api/chat, per-user rate limiting via Clerk userId and ipKeyGenerator, and 14 passing tests — human-verify checkpoint passed**

## Performance

- **Duration:** ~20 min (including human-verify checkpoint)
- **Started:** 2026-03-09T10:50:41Z
- **Completed:** 2026-03-09
- **Tasks:** 3 of 3 (Tasks 1-2 auto, Task 3 checkpoint:human-verify — approved)
- **Files modified:** 10

## Accomplishments

- requireApiAuth middleware returns 401 JSON `{ data: null, error: { code: 'UNAUTHORIZED' } }` on all three routes when no valid Clerk JWT is present
- SSE streaming chat route with AbortController on client disconnect — headers flushed before async streaming begins
- Per-user rate limiting with keyGenerator using Clerk userId for authenticated requests and req.ip/anonymous for guests
- clerkMiddleware() registered as first global middleware — correct order enforced in comments
- All 14 tests passing: 4 auth integration (supertest), 6 provider unit tests, 4 rateLimiter keyGenerator tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth middleware, rate limiter, and fill rateLimiter test stubs** - `5c728ac` (feat)
2. **Task 2: Three API routes, authenticated router, and Express entry point** - `8c2d115` (feat)
3. **Task 3: Checkpoint approved — ipKeyGenerator fix post-verification** - `83d6232` (fix)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN), committed together per task_

## Files Created/Modified

- `backend/src/middleware/auth.ts` — requireApiAuth: calls getAuth(req), 401 JSON if no userId
- `backend/src/middleware/rateLimiter.ts` — apiRateLimiter: express-rate-limit with Clerk userId keyGenerator
- `backend/src/routes/chat.ts` — POST /api/chat: SSE streaming via aiProvider.streamChat()
- `backend/src/routes/simplify.ts` — POST /api/simplify: single-shot JSON via aiProvider.simplify()
- `backend/src/routes/find-sources.ts` — POST /api/find-sources: single-shot JSON via searchProvider.findSources()
- `backend/src/routes/index.ts` — apiRouter with requireApiAuth on all sub-routes
- `backend/src/index.ts` — Express entry point with correct 5-step middleware order
- `backend/tests/auth.test.ts` — 4 supertest integration tests (401 on all routes without JWT)
- `backend/tests/rateLimiter.test.ts` — 4 keyGenerator logic tests
- `backend/package.json` — added @types/cors devDependency

## Decisions Made

- Single `apiRouter.use(requireApiAuth)` in routes/index.ts protects all sub-routes automatically — no per-route decoration needed
- SSE `flushHeaders()` called before `aiProvider.streamChat()` — streaming headers must reach client before async work begins
- Rate limiter tests test keyGenerator logic directly via mocked getAuth calls — avoids full middleware pipeline overhead in unit tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/cors devDependency**
- **Found during:** Task 2 (Express entry point creation)
- **Issue:** `cors` package had no bundled TypeScript declarations; `import cors from 'cors'` failed with TS7016: Could not find a declaration file
- **Fix:** Ran `npm install --save-dev @types/cors`
- **Files modified:** backend/package.json, backend/package-lock.json
- **Verification:** `npx tsc --noEmit` reports zero errors after install
- **Committed in:** `8c2d115` (Task 2 commit)

---

**2. [Rule 1 - Bug] Fixed ipKeyGenerator call signature — passed IP string not Request object**
- **Found during:** Post-checkpoint fix (rateLimiter.ts)
- **Issue:** `ipKeyGenerator(req)` passed the full Request object; function expects an IP address string. Caused TS2345 type error and broke 5 tests.
- **Fix:** Extract IP first: `const ip = req.ip ?? 'anonymous'`, then call `ipKeyGenerator(ip)` only when ip is a real address
- **Files modified:** `backend/src/middleware/rateLimiter.ts`
- **Verification:** `npx jest` 14/14 pass; `npx tsc --noEmit` zero errors
- **Committed in:** `83d6232`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes required for correctness. No scope creep.

## Issues Encountered

- `@types/cors` missing — blocked TypeScript compilation during Task 2 (Rule 3, resolved inline)
- `ipKeyGenerator` API mismatch — function expects IP string, not Request object; caused TS2345 and 5 test failures post-checkpoint (Rule 1, resolved in `83d6232`)

## User Setup Required

**Human-verify checkpoint approved.** All 6 manual steps passed:
- Server starts without error
- 401 without JWT confirmed on all routes
- SSE streaming with valid Clerk JWT produces progressive chunks ending with `{"type":"done"}`
- AI_PROVIDER=openai switch does not crash server
- Health endpoint returns `{"status":"ok"}`

`backend/.env` with real keys required for live operation (already set up by user during checkpoint verification).

## Next Phase Readiness

- Backend proxy shell complete — all three API routes wired, JWT auth enforced, SSE streaming verified live
- Phase 02 (frontend shell) can integrate against `/api/chat`, `/api/simplify`, `/api/find-sources`
- No blockers — all 14 tests pass, zero TypeScript errors, human-verify checkpoint approved

---
*Phase: 01-backend-proxy-shell*
*Completed: 2026-03-09*

## Self-Check: PASSED

- All 7 source files confirmed on disk
- All task commits confirmed in git log: 5c728ac, 8c2d115, 83d6232
- 14/14 tests passing post-fix
- Zero TypeScript errors
