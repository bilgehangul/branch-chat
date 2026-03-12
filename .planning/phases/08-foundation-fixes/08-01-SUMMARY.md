---
phase: 08-foundation-fixes
plan: 01
subsystem: ui
tags: [react, text-selection, action-bubble, scroll-dismiss, absolute-positioning]

# Dependency graph
requires:
  - phase: 03-branching
    provides: useTextSelection hook, ActionBubble, ThreadView scroll container
provides:
  - Role-filtered text selection (data-message-role on MessageBlock)
  - No-selection zones (data-no-selection on ContextCard)
  - Absolutely-positioned ActionBubble inside scroll content wrapper
  - Scroll-dismiss behavior (100px delta threshold)
  - Persistent HighlightOverlay after bubble dismiss
  - annotationType prop wired to HighlightOverlay
affects: [08-foundation-fixes, 09-layout-overhaul]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-message-role attribute for DOM-based role filtering"
    - "data-no-selection attribute for opt-out zones"
    - "Absolute positioning inside position:relative content wrapper for scroll-synced UI"
    - "useRef for persisting highlight rects across bubble lifecycle"

key-files:
  created: []
  modified:
    - frontend/src/hooks/useTextSelection.ts
    - frontend/src/components/thread/MessageBlock.tsx
    - frontend/src/components/thread/ContextCard.tsx
    - frontend/src/components/branching/ActionBubble.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/tests/unit/useTextSelection.test.ts

key-decisions:
  - "Used data-message-role attribute on MessageBlock for DOM-based role filtering rather than passing role through hook"
  - "Absolute positioning with wrapperRef second parameter rather than refactoring hook to use a single ref"
  - "Scroll-dismiss uses passive scroll listener with 100px threshold, instant dismiss (no fade)"
  - "HighlightOverlay rects persisted in useRef, cleared on mousedown outside bubble"

patterns-established:
  - "data-no-selection: any element with this attribute opts out of text selection bubble"
  - "ActionBubble flipped prop: renders below selection when absoluteTop < 60"

requirements-completed: [TSEL-01, TSEL-02, TSEL-03, TSEL-04, TSEL-05, TSEL-06]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 8 Plan 1: Text Selection Filtering and ActionBubble Repositioning Summary

**Role-filtered text selection with data-message-role checks, absolute-positioned ActionBubble inside scroll wrapper, and scroll-dismiss at 100px threshold**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T03:29:24Z
- **Completed:** 2026-03-12T03:33:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Text selection in user messages, ContextCard, and no-selection zones no longer triggers ActionBubble
- ActionBubble repositioned from position:fixed to position:absolute inside contentWrapperRef, now scrolls with text
- Scroll-dismiss: bubble clears instantly after 100px of scrolling, highlight overlay persists until click elsewhere
- ActionBubble flips below selection when insufficient space above (absoluteTop < 60)
- annotationType prop wired to HighlightOverlay for future annotation-type-specific colors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add data attributes and filter text selection by role** - `33e05f7c` (feat)
2. **Task 2: Reposition ActionBubble to absolute, add scroll-dismiss, wire HighlightOverlay annotationType** - `87368d6c` (feat)

## Files Created/Modified
- `frontend/src/hooks/useTextSelection.ts` - Added role filtering, no-selection zone check, absoluteTop/absoluteLeft coords, optional wrapperRef parameter
- `frontend/src/components/thread/MessageBlock.tsx` - Added data-message-role attribute
- `frontend/src/components/thread/ContextCard.tsx` - Added data-no-selection attribute
- `frontend/src/components/branching/ActionBubble.tsx` - Changed fixed to absolute, added flipped prop, added data-action-bubble attribute
- `frontend/src/components/thread/ThreadView.tsx` - Moved ActionBubble inside contentWrapperRef, added scroll-dismiss effect, persistent highlight rects, annotationType wiring
- `frontend/tests/unit/useTextSelection.test.ts` - Updated tests to include data-message-role="assistant" on mock message elements

## Decisions Made
- Used data-message-role attribute on MessageBlock for DOM-based role filtering rather than passing role info through the hook -- keeps the hook generic and decoupled from React component props
- Absolute positioning uses a second wrapperRef parameter rather than merging scrollRef and wrapperRef -- preserves backward compatibility
- Scroll-dismiss is instant (no fade animation) per plan spec
- HighlightOverlay rects stored in useRef rather than useState to avoid unnecessary re-renders on clear

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated useTextSelection tests for role filtering**
- **Found during:** Task 2 verification
- **Issue:** Existing useTextSelection tests did not include data-message-role="assistant" on mock DOM elements, causing test failures after role filtering was added
- **Fix:** Added data-message-role="assistant" to all mock message elements in useTextSelection.test.ts
- **Files modified:** frontend/tests/unit/useTextSelection.test.ts
- **Verification:** All 8 useTextSelection tests pass
- **Committed in:** 87368d6c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test fix was necessary for correctness after role filtering. No scope creep.

## Issues Encountered
- HighlightOverlay.tsx was auto-modified by a linter between reads (already had annotationType prop and color mapping added). No action needed -- the existing implementation was compatible with the plan.
- 5 pre-existing test failures in unrelated files (App routing, DemoChat, useStreamingChat) -- not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Text selection filtering and ActionBubble repositioning complete
- Ready for Plan 08-02 (annotation-type-specific highlight colors, SimplificationBlock/CitationBlock no-selection zones)
- HighlightOverlay already accepts annotationType prop with color mapping

---
*Phase: 08-foundation-fixes*
*Completed: 2026-03-12*
