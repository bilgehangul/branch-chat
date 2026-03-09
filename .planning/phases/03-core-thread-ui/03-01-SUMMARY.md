---
phase: 03-core-thread-ui
plan: "01"
subsystem: testing
tags: [vitest, react-testing-library, test-stubs, tdd]

# Dependency graph
requires:
  - phase: 02-frontend-foundation
    provides: Vitest 4.x + jsdom + @testing-library/react test infrastructure, existing passing tests

provides:
  - 7 Wave 0 test stub files covering all 13 Phase 3 requirements (CHAT-01 through CHAT-06, NAV-01 through NAV-07)
  - Verified verify commands for all subsequent Phase 3 plans (npx vitest run tests/unit/<file>)
  - test.todo() stubs targeting correct future component paths

affects:
  - 03-core-thread-ui (plans 02 onward use these stubs as RED baselines)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "test.todo() for Wave 0 stubs — no module imports, zero failures before implementation"
    - "All stub files target final component paths (src/hooks/, src/components/thread/, src/components/layout/)"

key-files:
  created:
    - frontend/tests/unit/useStreamingChat.test.ts
    - frontend/tests/unit/MarkdownRenderer.test.tsx
    - frontend/tests/unit/MessageBlock.test.tsx
    - frontend/tests/unit/ContextCard.test.tsx
    - frontend/tests/unit/BreadcrumbBar.test.tsx
    - frontend/tests/unit/SpineStrip.test.tsx
    - frontend/tests/unit/ThreadView.test.tsx
  modified: []

key-decisions:
  - "test.todo() chosen over test.skip() — avoids any import of non-existent modules while satisfying Nyquist compliance"
  - "No describe-level imports of future modules — each stub file only imports { describe } from vitest, keeping files import-error-free"

patterns-established:
  - "Wave 0 stubs: use test.todo() with no top-level module imports when target module does not yet exist"
  - "One describe block per component file, grouped by requirement ID in comments"

requirements-completed:
  - CHAT-01
  - CHAT-02
  - CHAT-03
  - CHAT-04
  - CHAT-05
  - CHAT-06
  - NAV-01
  - NAV-02
  - NAV-03
  - NAV-04
  - NAV-05
  - NAV-06
  - NAV-07

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 3 Plan 01: Wave 0 Test Stubs Summary

**7 Vitest test stub files with 32 test.todo() entries wiring all 13 Phase 3 CHAT and NAV requirements before implementation begins**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-09T14:11:17Z
- **Completed:** 2026-03-09T14:15:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All 7 stub files created at correct paths targeting future component locations
- Full unit suite: 28 passing, 32 todo, 0 failures — existing Phase 2 tests unaffected
- Nyquist compliance achieved: every CHAT and NAV requirement has an automated verify command wired

## Task Commits

Each task was committed atomically:

1. **Task 1: Create hook + message component test stubs (CHAT requirements)** - `5cb7d40` (test)
2. **Task 2: Create navigation component test stubs (NAV requirements)** - `8d4c684` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `frontend/tests/unit/useStreamingChat.test.ts` - 5 stubs for CHAT-01, CHAT-03, CHAT-04, and abort behavior
- `frontend/tests/unit/MarkdownRenderer.test.tsx` - 5 stubs for CHAT-02 markdown rendering
- `frontend/tests/unit/MessageBlock.test.tsx` - 5 stubs for CHAT-06 streaming visual state and role labels
- `frontend/tests/unit/ContextCard.test.tsx` - 3 stubs for CHAT-05 anchor text display
- `frontend/tests/unit/BreadcrumbBar.test.tsx` - 6 stubs for NAV-01, NAV-02, NAV-03
- `frontend/tests/unit/SpineStrip.test.tsx` - 5 stubs for NAV-04, NAV-05
- `frontend/tests/unit/ThreadView.test.tsx` - 3 stubs for NAV-06, NAV-07

## Decisions Made
- Used `test.todo()` rather than `test.skip()` to avoid any module import at the file top level — prevents "cannot find module" errors when implementations don't exist yet.
- Each stub file imports only `{ describe }` from vitest, nothing from src/.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 stub files exist and run cleanly — subsequent plans (03-02 onward) can immediately wire verify commands
- RED phase for TDD is established: each stub test will fail when implementations are partially wrong
- No blockers identified

---
*Phase: 03-core-thread-ui*
*Completed: 2026-03-09*
