---
phase: 09-layout-positioning
plan: 02
subsystem: ui
tags: [react, tailwind, crossfade, opacity-transition, preview-card, css-triangle, pill-collapse]

# Dependency graph
requires:
  - phase: 09-layout-positioning
    provides: CSS Grid pill layout (Plan 09-01) with inline BranchPillCell in grid cells
provides:
  - Interruptible opacity crossfade (75ms out + 75ms in) for thread transitions
  - Preview card auto-flip positioning (getBoundingClientRect vs innerHeight)
  - CSS triangle pointer on preview cards (6px border technique)
  - Descendant pill collapse with hover-expand animation
affects: [09-03-ancestor-rails]

# Tech tracking
tech-stack:
  added: []
  patterns: [fadeState state machine for crossfade, getBoundingClientRect flip detection, CSS border-triangle pointer, max-h-0 collapse with transition]

key-files:
  created:
    - frontend/src/tests/threadTransition.test.tsx
    - frontend/src/tests/previewCard.test.tsx
  modified:
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/tests/threadView.test.tsx

key-decisions:
  - "Crossfade uses fadeState state machine (idle/fading-out/fading-in) with targetThreadIdRef for interruptibility"
  - "Scroll position restored during fade-out (opacity 0) before fade-in starts — invisible to user"
  - "Preview card flip threshold: pill bottom > innerHeight - 220px"
  - "Descendant pills use max-h-0/max-h-[200px] with transition-[max-height] duration-200 for collapse/expand"

patterns-established:
  - "fadeState machine: three-state (idle/fading-out/fading-in) with timer refs for cancellation"
  - "Auto-flip pattern: useEffect computes flipAbove on hover via getBoundingClientRect"
  - "CSS border-triangle: 6px borders with transparent sides for arrow pointer"

requirements-completed: [PILL-04, PILL-05, PILL-06, PILL-07, PILL-08]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 9 Plan 2: Crossfade Transition and Pill Interaction Enhancements Summary

**Interruptible 150ms opacity crossfade replacing slide transition, with auto-flip preview cards (CSS triangle pointer) and collapsed descendant pills expanding on hover**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T04:40:26Z
- **Completed:** 2026-03-12T04:45:00Z
- **Tasks:** 2 (both TDD: RED + GREEN)
- **Files modified:** 5

## Accomplishments
- Thread navigation now uses smooth 150ms opacity crossfade (75ms out + 75ms in) instead of 200ms horizontal slide
- Rapid A->B->C navigation cancels intermediate fades via clearTimeout — only final target shown
- Scroll position restored during opacity-0 phase (invisible to user) before fade-in
- Preview card auto-flips above pill when near viewport bottom (getBoundingClientRect check)
- CSS triangle pointer (6px border technique) indicates which pill the preview card belongs to
- Descendant pills hidden by default (max-h-0 overflow-hidden), expand on parent hover with 200ms slide-down

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for crossfade** - `d0718521` (test)
2. **Task 1 (GREEN): Opacity crossfade implementation** - `baf78205` (feat)
3. **Task 2 (RED): Failing tests for preview card and collapse** - `9ffad27f` (test)
4. **Task 2 (GREEN): Auto-flip, triangle, descendant collapse** - `1829994a` (feat)

_TDD tasks: test commit followed by implementation commit for each task_

## Files Created/Modified
- `frontend/src/components/thread/ThreadView.tsx` - fadeState state machine, crossfade CSS classes on content wrapper
- `frontend/src/components/branching/GutterColumn.tsx` - pillRef, flipAbove, auto-flip logic, CSS triangle, descendant collapse
- `frontend/src/tests/threadTransition.test.tsx` - New: 13 tests for crossfade behavior and interruptibility
- `frontend/src/tests/previewCard.test.tsx` - New: 13 tests for auto-flip, triangle pointer, descendant collapse
- `frontend/src/tests/threadView.test.tsx` - Updated grid class test for template literal className

## Decisions Made
- fadeState state machine (idle/fading-out/fading-in) chosen over boolean toggle for clean three-phase control
- targetThreadIdRef used for interruptibility — if target changes mid-fade, current fade is cancelled
- Scroll restoration happens at opacity 0 (during fade-out timeout) to prevent visible scroll jump
- Preview card flip threshold set at 220px from viewport bottom (matches card approximate height)
- Descendant collapse uses max-h-[200px] as expanded limit — sufficient for typical nesting depth

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated threadView grid class test for template literal**
- **Found during:** Task 1 GREEN (full test suite verification)
- **Issue:** threadView.test.tsx expected `className="grid` but crossfade changed to template literal `className={`
- **Fix:** Updated test to use regex match `className.*grid` instead of exact string
- **Files modified:** frontend/src/tests/threadView.test.tsx
- **Verification:** All threadView tests pass
- **Committed in:** baf78205 (part of Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test update was necessary due to className format change. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Crossfade and pill interaction enhancements complete
- Plan 09-03 (ancestor rails) is independent — ready for execution
- All 227 unit tests passing (pre-existing failures in 4 unrelated test files unchanged)

---
*Phase: 09-layout-positioning*
*Completed: 2026-03-12*
