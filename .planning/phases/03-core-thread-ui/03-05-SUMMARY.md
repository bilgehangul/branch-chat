---
phase: 03-core-thread-ui
plan: 05
subsystem: ui
tags: [react, zustand, tailwind, vitest, testing-library, navigation, breadcrumb]

# Dependency graph
requires:
  - phase: 03-04
    provides: BreadcrumbBar and SpineStrip stubs, AppShell layout, selectThreadAncestry selector
provides:
  - BreadcrumbBar component with full ancestry path, chevron separators, and overflow collapse
  - SpineStrip component with 28px vertical strip, parent title, and accent border
  - NAV-01 through NAV-05 requirements fully implemented
affects:
  - 04-annotations
  - 05-child-threads

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ResizeObserver typeof guard for jsdom test compatibility
    - useSessionStore separate selectors (not object spread) per Zustand concurrent mode rule
    - Hex color normalization in tests (jsdom converts #hex to rgb for style assertions)

key-files:
  created:
    - frontend/src/components/layout/BreadcrumbBar.tsx
    - frontend/src/components/layout/SpineStrip.tsx
  modified:
    - frontend/tests/unit/BreadcrumbBar.test.tsx
    - frontend/tests/unit/SpineStrip.test.tsx

key-decisions:
  - "ResizeObserver guarded with typeof check — jsdom does not define ResizeObserver, so typeof undefined check avoids ReferenceError in tests"
  - "BreadcrumbBar collapse uses data-length-based logic (ancestry.length > 3), not pixel-based — ResizeObserver present but no-op, length check is deterministic"
  - "SpineStrip only calls setActiveThread — ThreadView cleanup useEffect handles scroll save before navigation, no ref passing needed"
  - "Test border color assertion uses rgb fallback — jsdom normalizes hex to rgb() in style.borderLeft"

patterns-established:
  - "Component store access: separate useSessionStore calls per selector (not object spread) for Zustand v5 concurrent mode safety"
  - "Mock pattern for useSessionStore: vi.mock + mockImplementation with selector function forwarding to plain object"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04, NAV-05]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 03 Plan 05: Navigation Chrome Summary

**BreadcrumbBar with full ancestry path, overflow-collapsing ellipsis dropdown, and SpineStrip with 28px vertical parent-title navigation strip**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T14:35:39Z
- **Completed:** 2026-03-09T14:38:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- BreadcrumbBar renders full ancestry chain with chevron (›) separators; ancestor crumbs clickable, current crumb non-clickable span
- BreadcrumbBar shows "New Chat" for root threads with no messages; collapses paths longer than 3 to "..." with clickable dropdown showing hidden crumbs
- SpineStrip renders null at depth 0 and a 28px vertical strip at depth >= 1 with parent thread's accentColor as left border and title as rotated vertical text

## Task Commits

Each task was committed atomically:

1. **Task 1: BreadcrumbBar — full path with overflow collapse** - `99209ec` (feat)
2. **Task 2: SpineStrip — 28px vertical navigation** - `b808bfa` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN)_

## Files Created/Modified

- `frontend/src/components/layout/BreadcrumbBar.tsx` - Full implementation replacing stub: ancestry rendering, chevron separators, "New Chat" root label, collapse to "..." for paths > 3 with dropdown, ResizeObserver
- `frontend/src/components/layout/SpineStrip.tsx` - Full implementation replacing stub: 28px strip at depth >= 1, parentThread.accentColor border, vertical text via writingMode + rotate(180deg), onClick setActiveThread
- `frontend/tests/unit/BreadcrumbBar.test.tsx` - 6 tests covering NAV-01/02/03: ancestry rendering, New Chat label, ancestor click, current crumb non-button, collapse ellipsis, dropdown crumbs
- `frontend/tests/unit/SpineStrip.test.tsx` - 5 tests covering NAV-04/05: depth 0 null, depth 1 render, parent title, accent border, click navigation

## Decisions Made

- ResizeObserver guarded with `typeof ResizeObserver === 'undefined'` check — jsdom test environment doesn't define ResizeObserver; guard prevents ReferenceError without mocking
- BreadcrumbBar collapse is data-length-based (`ancestry.length > 3`), not pixel-based — deterministic and testable without layout engine
- SpineStrip does not receive scrollRef — ThreadView's useEffect cleanup handles scroll save when activeThreadId changes; no prop threading needed
- Test for border color uses `includes('rgb(255, 87, 51)')` fallback — jsdom normalizes hex color values in element.style properties

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ResizeObserver ReferenceError in jsdom**
- **Found during:** Task 1 (BreadcrumbBar implementation)
- **Issue:** `new ResizeObserver()` throws ReferenceError in jsdom (vitest test environment), which does not define ResizeObserver
- **Fix:** Added `typeof ResizeObserver === 'undefined'` guard before creating observer instance
- **Files modified:** frontend/src/components/layout/BreadcrumbBar.tsx
- **Verification:** All BreadcrumbBar tests pass after fix
- **Committed in:** 99209ec (Task 1 commit)

**2. [Rule 1 - Bug] Fixed border color test assertion for jsdom rgb normalization**
- **Found during:** Task 2 (SpineStrip test execution)
- **Issue:** Test checked `borderLeft.includes('#FF5733')` but jsdom converts hex to `rgb(255, 87, 51)` in computed styles
- **Fix:** Updated assertion to check for both hex and rgb formats using OR condition
- **Files modified:** frontend/tests/unit/SpineStrip.test.tsx
- **Verification:** SpineStrip border color test passes
- **Committed in:** b808bfa (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2x Rule 1 bug — jsdom environment compatibility)
**Impact on plan:** Both fixes required for test environment compatibility. No behavior change to components. No scope creep.

## Issues Encountered

None beyond the two auto-fixed jsdom compatibility issues.

## Next Phase Readiness

- All Phase 3 navigation requirements (NAV-01 through NAV-07) are now complete
- BreadcrumbBar and SpineStrip are wired into AppShell from Plan 03-04
- Phase 4 (annotations) can begin; ResizeObserver and gutter positioning spike still recommended before Phase 4 ships

## Self-Check: PASSED

- frontend/src/components/layout/BreadcrumbBar.tsx: FOUND
- frontend/src/components/layout/SpineStrip.tsx: FOUND
- .planning/phases/03-core-thread-ui/03-05-SUMMARY.md: FOUND
- Commit 99209ec: FOUND
- Commit b808bfa: FOUND

---
*Phase: 03-core-thread-ui*
*Completed: 2026-03-09*
