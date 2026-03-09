---
phase: 01-backend-proxy-shell
plan: 01
subsystem: testing
tags: [typescript, jest, ts-jest, express, node, gemini]

# Dependency graph
requires: []
provides:
  - backend Node.js project with all runtime and dev dependencies installed
  - jest + ts-jest test infrastructure with 3 Wave 0 stub files (13 todo items)
  - shared/types.ts as single source of truth for Message, ApiResponse, SseEvent types
  - backend/.env.example documenting all 6 required environment variables
affects:
  - 01-backend-proxy-shell
  - 02-frontend-shell

# Tech tracking
tech-stack:
  added:
    - express 5.x (HTTP server)
    - cors (cross-origin middleware)
    - dotenv (env var loading)
    - "@google/genai v1.x (Gemini AI SDK — NOT deprecated @google/generative-ai)"
    - "@tavily/core (web search)"
    - "@clerk/express (auth middleware)"
    - express-rate-limit (rate limiting)
    - typescript 5.x
    - ts-jest 29.x (Jest TypeScript transform)
    - jest 30.x
    - supertest (HTTP test client)
    - tsx (TypeScript runner for dev)
    - nodemon (file watcher for dev)
    - ts-node (required for TypeScript jest.config.ts parsing)
  patterns:
    - Wave 0 test stubs (it.todo) before implementation — satisfies Nyquist rule
    - Shared types in repo root shared/ directory imported by both backend and frontend
    - ts-jest configured with module:CommonJS override to avoid ESM/CJS conflicts with Jest

key-files:
  created:
    - backend/package.json
    - backend/tsconfig.json
    - backend/.env.example
    - backend/jest.config.ts
    - backend/tests/auth.test.ts
    - backend/tests/providers.test.ts
    - backend/tests/rateLimiter.test.ts
    - shared/types.ts
  modified: []

key-decisions:
  - "Used jest.config.ts (TypeScript) requiring ts-node install — installed automatically as Rule 3 blocking fix"
  - "No type:module in package.json — ts-jest uses CommonJS transform to avoid ESM/CJS conflicts"
  - "@google/genai v1.x used (not deprecated @google/generative-ai which EOL'd Nov 2025)"
  - "shared/types.ts placed at repo root (not inside backend/) so frontend Phase 2 can import without cross-package boundaries"

patterns-established:
  - "Wave 0 stub pattern: it.todo() stubs before any implementation — test files exist and pass before source files exist"
  - "Shared types pattern: repo-root shared/ directory is canonical type source for full-stack sharing"

requirements-completed:
  - UI-04
  - AUTH-04
  - UI-03

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 01 Plan 01: Backend Scaffold and Wave 0 Test Stubs Summary

**Node.js backend scaffolded with express/ts-jest infrastructure and 13 Wave 0 todo stubs across 3 test files, plus shared/types.ts as single source of truth for Message, ApiResponse, and SseEvent types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T10:39:11Z
- **Completed:** 2026-03-09T10:41:26Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Backend Node.js project initialized with all runtime and dev dependencies installed
- Jest + ts-jest test infrastructure running; `npx jest --passWithNoTests` exits 0
- Three Wave 0 test stub files with 13 todo items covering auth, providers, and rate limiter
- shared/types.ts canonical data model (Message, ApiResponse, ApiError, SseEvent) created at repo root

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold backend project and install dependencies** - `81e9226` (chore)
2. **Task 2: Create shared types and Wave 0 test stubs** - `4247fbc` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `backend/package.json` - npm manifest with all runtime/dev deps and dev/build/start/test scripts
- `backend/tsconfig.json` - TypeScript config with module:NodeNext, strict:true, esModuleInterop
- `backend/.env.example` - Documents 6 required env vars (GEMINI_API_KEY, TAVILY_API_KEY, CLERK keys, AI_PROVIDER, PORT, CLIENT_ORIGIN)
- `backend/jest.config.ts` - Jest + ts-jest config with CommonJS transform override
- `backend/tests/auth.test.ts` - 4 todo stubs for 401 integration tests (filled in Plan 03)
- `backend/tests/providers.test.ts` - 6 todo stubs for provider factory and OpenAI stub (filled in Plan 02)
- `backend/tests/rateLimiter.test.ts` - 3 todo stubs for keyGenerator behavior (filled in Plan 03)
- `shared/types.ts` - Role, Message, SearchResult, ApiError, ApiResponse, SseEvent types

## Decisions Made
- No `"type": "module"` in package.json — ts-jest uses CommonJS transform, adding ESM type causes conflicts
- `@google/genai` v1.x installed (not `@google/generative-ai` which EOL'd November 2025)
- `shared/types.ts` placed at repo root so frontend can import without package boundary issues in Phase 2

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing ts-node dependency**
- **Found during:** Task 1 (jest verification)
- **Issue:** `jest.config.ts` is a TypeScript file; Jest requires `ts-node` to parse TypeScript config files, but it was not listed in the plan's dependencies
- **Fix:** Ran `npm install -D ts-node` in backend/
- **Files modified:** backend/package.json, backend/package-lock.json
- **Verification:** `npx jest --passWithNoTests` exits 0 after installation
- **Committed in:** 81e9226 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for Jest to parse TypeScript config. No scope creep.

## Issues Encountered
None beyond the ts-node deviation documented above.

## User Setup Required
None - no external service configuration required at this stage. Environment variables are documented in `backend/.env.example` and will be needed when running the server (Phase 1 Plans 02-03).

## Next Phase Readiness
- Test infrastructure ready; Plans 02 and 03 can fill in the todo stubs with real implementations
- shared/types.ts locked in as canonical type source — Plans 02 and 03 should import from `../../shared/types`
- No blockers

---
*Phase: 01-backend-proxy-shell*
*Completed: 2026-03-09*
