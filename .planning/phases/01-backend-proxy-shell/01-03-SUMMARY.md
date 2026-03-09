---
phase: 01-backend-proxy-shell
plan: 03
subsystem: api
tags: [express, clerk, jwt, sse, rate-limiting, cors, supertest]

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

patterns-established:
  - "Auth protection: mount routes in routes/index.ts and apiRouter.use(requireApiAuth) handles all of them"
  - "SSE pattern: setHeader Content-Type text/event-stream + flushHeaders() + AbortController + req.on('close')"
  - "Error envelopes: { data: null, error: { code: string, message: string } } for all error responses"
  - "Test mocking: jest.mock('@clerk/express') at top of test file — clerkMiddleware becomes pass-through, getAuth returns controlled userId"

requirements-completed: [AUTH-04, UI-03]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 01 Plan 03: Express Server Wiring Summary

**Express server with Clerk JWT auth on all three API routes (401 without valid JWT), SSE streaming for /api/chat, per-user rate limiting via Clerk userId, and 14 passing tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T10:50:41Z
- **Completed:** 2026-03-09T10:53:38Z
- **Tasks:** 2 of 2 (Task 3 is checkpoint:human-verify — awaiting manual verification)
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

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Missing devDependency; required for TypeScript compilation. No scope creep.

## Issues Encountered

None beyond the @types/cors Rule 3 fix above.

## User Setup Required

**Checkpoint:human-verify awaiting manual verification.** To fully test the server:

1. Create `backend/.env` with real keys:
   ```
   GEMINI_API_KEY=...
   TAVILY_API_KEY=...
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   AI_PROVIDER=gemini
   PORT=3001
   CLIENT_ORIGIN=http://localhost:5173
   ```
2. Start server: `cd backend && npx tsx src/index.ts`
3. Verify 401: `curl -s -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}]}'`
4. Verify SSE streaming with a valid Clerk JWT
5. Verify health: `curl http://localhost:3001/health`

## Next Phase Readiness

- Backend proxy shell complete — all three API routes wired, JWT auth enforced, SSE streaming ready
- Phase 02 (frontend) can integrate against these endpoints once checkpoint is approved
- No blockers — all 14 tests pass, zero TypeScript errors

---
*Phase: 01-backend-proxy-shell*
*Completed: 2026-03-09*

## Self-Check: PASSED

- All 7 source files found on disk
- Both task commits (5c728ac, 8c2d115) confirmed in git log
