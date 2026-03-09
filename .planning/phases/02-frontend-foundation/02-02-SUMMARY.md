---
phase: 02-frontend-foundation
plan: 02
subsystem: ui
tags: [zustand, typescript, react, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-backend-proxy-shell
    provides: shared/types.ts (API wire types), backend SSE contract

provides:
  - Flat normalized Zustand v5 store (Record<id,Thread>, Record<id,Message>) with all 9 actions fully implemented
  - Pure selector functions: selectCurrentThread, selectThreadAncestry, isAtMaxDepth
  - Frontend TypeScript types: Session, Thread, Message, Annotation, ChildLead, SourceResult, CreateThreadParams, MAX_THREAD_DEPTH
  - 16 passing tests (9 store actions + 7 selectors)

affects:
  - 02-03-frontend-api-client
  - phase-03-chat-ui
  - phase-04-thread-branching
  - phase-05-annotations

# Tech tracking
tech-stack:
  added: [zustand@5, vitest@4, @testing-library/react, @testing-library/jest-dom, jsdom]
  patterns:
    - Zustand v5 curried create<SessionState>()() pattern for TypeScript inference
    - Flat normalized store shape — messages at root, threads reference by ID only
    - Pure selector functions accepting data as parameters (no store import in selectors)
    - TDD with afterEach reset via useSessionStore.setState(initialState, true)

key-files:
  created:
    - frontend/src/types/index.ts
    - frontend/src/store/sessionStore.ts
    - frontend/src/store/selectors.ts
    - frontend/tests/unit/sessionStore.test.ts
    - frontend/tests/unit/selectors.test.ts
    - frontend/vitest.config.ts
    - frontend/src/tests/setup.ts
  modified: []

key-decisions:
  - "Messages live flat in Record<string, Message> at store root — Thread.messageIds holds string[] references only, never Message copies (locked shape)"
  - "Zustand v5 curried create<SessionState>()() used for proper TypeScript generic inference"
  - "setMessageStreaming delegates to updateMessage internally — single mutation path for all message patches"
  - "initialState exported after store creation for test reset pattern — not inside the store factory"
  - "Selector functions are pure (no store import) — they accept data as parameters enabling offline/unit testing without store setup"
  - "Frontend bootstrap (vitest.config.ts + tsconfig paths) created as Rule 3 auto-fix since plan 02-01 scaffold was missing"

patterns-established:
  - "Store reset in tests: afterEach(() => useSessionStore.setState(initialState, true))"
  - "Thread depth computed as Math.min(parentDepth + 1, 4) capped at MAX_THREAD_DEPTH"
  - "addMessage appends both to messages Record AND to thread.messageIds in a single set() call"

requirements-completed: [AUTH-05]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 02 Plan 02: Zustand Store and Selectors Summary

**Flat normalized Zustand v5 store with 9 fully-implemented actions and pure selector functions — messages at store root in Record<string,Message>, threads holding string[] references only**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T08:23:00Z
- **Completed:** 2026-03-09T08:26:00Z
- **Tasks:** 2
- **Files modified:** 7 created

## Accomplishments
- Typed Zustand v5 store with curried `create<SessionState>()()` pattern — all 9 actions fully implemented (not stubs)
- Flat normalized shape locked: `messages: Record<string, Message>` at store root; `Thread.messageIds: string[]` references only
- Three pure selector functions: `selectCurrentThread`, `selectThreadAncestry`, `isAtMaxDepth`
- 16 tests passing (exceeds plan's 14 minimum): 9 store actions + 7 selectors

## Task Commits

Each task was committed atomically:

1. **Task 1: Frontend types and Zustand store with full actions** - `2ccf85e` (feat)
2. **Task 2: Selectors — currentThread, threadAncestry, isAtMaxDepth** - `a639861` (feat)

_Note: TDD tasks each had RED (failing test) then GREEN (implementation) phases_

## Files Created/Modified
- `frontend/src/types/index.ts` - All frontend store types: Session, Thread, Message, Annotation, ChildLead, SourceResult, CreateThreadParams, MAX_THREAD_DEPTH=4
- `frontend/src/store/sessionStore.ts` - Zustand v5 store with 9 actions; exports useSessionStore and initialState
- `frontend/src/store/selectors.ts` - Three pure selector functions (no store import)
- `frontend/tests/unit/sessionStore.test.ts` - 9 action tests with afterEach reset pattern
- `frontend/tests/unit/selectors.test.ts` - 7 selector tests using inline fixtures
- `frontend/vitest.config.ts` - Vitest config with jsdom, globals, @/ path alias
- `frontend/src/tests/setup.ts` - @testing-library/jest-dom import

## Decisions Made
- Zustand v5 curried `create<SessionState>()()` used for TypeScript generic inference
- Messages locked at store root — no future plan may nest them inside Thread objects
- `setMessageStreaming` delegates to `updateMessage` — single mutation code path
- Selectors are pure functions (not hooks) — usable outside React components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bootstrapped frontend Vitest infrastructure**
- **Found during:** Pre-execution (plan 02-01 scaffold was not yet executed)
- **Issue:** frontend/ directory did not exist; 02-02 requires it to run Vitest tests
- **Fix:** Created minimal frontend scaffold: Vite + React-TS via `npm create vite`, installed zustand + vitest + testing-library, created vitest.config.ts and tsconfig path aliases
- **Files modified:** frontend/ (new), frontend/vitest.config.ts, frontend/src/tests/setup.ts, frontend/tsconfig.app.json
- **Verification:** `npx vitest run` exits 0 with stub todos collected before implementation
- **Committed in:** 2ccf85e (included in Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking infrastructure missing)
**Impact on plan:** Required bootstrapping that plan 02-01 would have handled. No scope creep — only minimum needed to execute 02-02 tests was created.

## Issues Encountered
- Frontend scaffold from plan 02-01 was absent — bootstrapped minimum needed (vitest config, tsconfig paths, test setup). The full scaffold (Clerk, DemoChat, AppShell) remains for plan 02-01 to implement.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Store shape locked and tested — all future phases can import `useSessionStore` without risk of breaking the flat Record structure
- Selectors ready for Phase 3 hooks to consume via `useShallow`
- `frontend/src/types/index.ts` is the authoritative frontend type source; `shared/types.ts` remains the API wire format source

---
*Phase: 02-frontend-foundation*
*Completed: 2026-03-09*
