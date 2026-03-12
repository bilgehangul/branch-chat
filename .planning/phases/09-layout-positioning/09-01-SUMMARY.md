---
phase: 09-layout-positioning
plan: 01
subsystem: ui
tags: [css-grid, react, tailwind, branch-pills, layout]

# Dependency graph
requires:
  - phase: 08-foundation-fixes
    provides: Stable branching infrastructure with GutterColumn pills and ThreadView layout
provides:
  - CSS Grid message-pill layout replacing JS measurement pipeline
  - BranchPillCell component for inline pill rendering in grid cells
  - Grid-compatible MessageList emitting col-start-1/col-start-2 cell pairs
affects: [09-02-crossfade, 09-03-ancestor-rails]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS Grid 1fr auto for message-pill alignment, grid-row per message with pill cell]

key-files:
  created:
    - frontend/src/tests/gutterColumn.test.tsx
    - frontend/src/tests/threadView.test.tsx
  modified:
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/thread/MessageList.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/tests/unit/GutterColumn.test.tsx

key-decisions:
  - "BranchPillCell exported from GutterColumn.tsx for import compatibility — file name preserved"
  - "Pill title truncated to 20 chars (down from 32) for compact grid layout"
  - "HighlightOverlay and ActionBubble wrapped in col-span-full absolute containers with pointer-events-none"
  - "Slide transition removed entirely (no replacement yet) — crossfade deferred to Plan 09-02"

patterns-established:
  - "CSS Grid 1fr auto: contentWrapperRef uses grid with auto-collapsing pill column"
  - "Grid row pairs: each message emits two cells (content + pill) via React.Fragment"
  - "col-span-full: non-message elements (ContextCard, overlays, anchors) span both columns"

requirements-completed: [PILL-01, PILL-02, PILL-03]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 9 Plan 1: CSS Grid Pill Layout Migration Summary

**Branch pills migrated from JS-measured absolute positioning to CSS Grid inline layout with 1fr auto columns, eliminating measurePillTop, ResizeObserver, and all conditional padding**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T04:30:27Z
- **Completed:** 2026-03-12T04:37:29Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 6

## Accomplishments
- Eliminated entire JS measurement pipeline: measurePillTop, pillPositions ref, posVersion state, ResizeObserver
- ThreadView content wrapper is now CSS Grid (1fr auto) — pills align to anchor message row natively
- MessageList emits grid-compatible markup with message cell + pill cell per row
- Removed pr-[80px]/pr-[140px] conditional padding hack — grid auto column handles separation
- All overlays (HighlightOverlay, ActionBubble) and non-message elements use col-span-full

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for grid layout** - `264e38aa` (test)
2. **Task 1 (GREEN): CSS Grid implementation** - `6e492be2` (feat)

_TDD task: test commit followed by implementation commit_

## Files Created/Modified
- `frontend/src/components/branching/GutterColumn.tsx` - Rewritten: removed measurement code, exports BranchPillCell
- `frontend/src/components/thread/MessageList.tsx` - Grid-compatible markup with pill cells per message row
- `frontend/src/components/thread/ThreadView.tsx` - CSS Grid wrapper, removed slide transition and standalone GutterColumn
- `frontend/tests/unit/GutterColumn.test.tsx` - Updated for BranchPillCell API (was testing old GutterColumn)
- `frontend/src/tests/gutterColumn.test.tsx` - New: no-JS-measurement tests and BranchPillCell rendering
- `frontend/src/tests/threadView.test.tsx` - New: grid layout, no conditional padding, col-span-full tests

## Decisions Made
- Preserved GutterColumn.tsx filename for import compatibility but removed old GutterColumn export
- Pill title truncation reduced from 32 to 20 chars for the compact grid layout
- Slide transition completely removed (was translate-x with pr-[80px]/pr-[140px]) — crossfade replacement is Plan 09-02
- HighlightOverlay and ActionBubble wrapped in col-span-full absolute containers with pointer-events-none to prevent grid cell clipping

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated old GutterColumn unit tests for new API**
- **Found during:** Task 1 GREEN (full test suite verification)
- **Issue:** tests/unit/GutterColumn.test.tsx imported old GutterColumn component with wrapperRef prop that no longer exists
- **Fix:** Rewrote tests to use BranchPillCell with leads-based API, updated aria-label queries
- **Files modified:** frontend/tests/unit/GutterColumn.test.tsx
- **Verification:** All 10 existing BRANCH-08/09/10/11 tests pass with new API
- **Committed in:** 6e492be2 (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test update was necessary for correctness. No scope creep.

## Issues Encountered
- GutterColumn.tsx doc comment contained "ResizeObserver" string which caused the no-ResizeObserver test to fail. Reworded the comment to avoid the keyword.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS Grid layout in place, ready for Plan 09-02 (crossfade thread transition)
- MessageList now receives threads/messages/handlers for pill rendering — same pattern can be extended
- Ancestor panels (Plan 09-03) are independent of this grid change

---
*Phase: 09-layout-positioning*
*Completed: 2026-03-12*
