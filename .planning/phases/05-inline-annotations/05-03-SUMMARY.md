---
phase: 05-inline-annotations
plan: 03
subsystem: frontend
tags: [action-bubble, simplify-mode, find-sources, tdd, ui]
dependency_graph:
  requires: [05-01]
  provides: [ActionBubble with onFindSources/onSimplify props, ThreadView stub wiring]
  affects: [05-06]
tech_stack:
  added: []
  patterns: [TDD red-green, BubbleMode state, useEffect paragraphId reset]
key_files:
  created: []
  modified:
    - frontend/src/components/branching/ActionBubble.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/tests/actionBubble.test.tsx
    - frontend/tests/unit/ActionBubble.test.tsx
decisions:
  - "BubbleMode ('default' | 'simplify') is local state; useEffect resets to default on bubble.paragraphId change"
  - "SimplifyMode type defined locally in ActionBubble (matches backend gemini.ts shape)"
  - "onSimplify calls then onDismiss inline in mode button onClick — no intermediate state"
  - "ThreadView stub handlers use console.log + TODO 05-06 comment — no async logic yet"
metrics:
  duration: "3 min"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_changed: 4
requirements:
  - INLINE-01
  - INLINE-05
---

# Phase 5 Plan 3: ActionBubble Multi-mode Expansion Summary

**One-liner:** ActionBubble upgraded from disabled stubs to live multi-mode component with in-place Simplify picker (4 mode buttons + back arrow) and enabled Find Sources, wired to ThreadView with stub handlers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD RED) | Failing tests for ActionBubble | 34d83ca | frontend/src/tests/actionBubble.test.tsx |
| 1 (TDD GREEN) | Upgrade ActionBubble with expanded simplify mode | 1c36136 | frontend/src/components/branching/ActionBubble.tsx |
| 2 | Wire onFindSources/onSimplify stubs in ThreadView | a15461f | frontend/src/components/thread/ThreadView.tsx, frontend/tests/unit/ActionBubble.test.tsx |

## What Was Built

### ActionBubble.tsx
- Added `messageId` to `bubble` prop shape (already present in `SelectionState`)
- Added `onFindSources(anchorText, paragraphId, messageId)` and `onSimplify(anchorText, paragraphId, messageId, mode)` required props
- Internal `BubbleMode` state: `'default' | 'simplify'`
- `useEffect` resets mode to `'default'` when `bubble.paragraphId` changes
- **Default mode:** Find Sources and Simplify are now enabled with `bg-zinc-700 hover:bg-zinc-600` styling
- **Simplify mode:** Back arrow button + 2x2 grid of 4 mode buttons (Simpler, Example, Analogy, Technical)
- All buttons call `e.preventDefault()` on `onMouseDown`
- Mode buttons call `onSimplify(...)` then `onDismiss()` on click

### ThreadView.tsx
- `handleFindSources` stub: logs args, TODO 05-06 comment
- `handleSimplify` stub: logs args, TODO 05-06 comment
- ActionBubble JSX passes `onFindSources={handleFindSources}` and `onSimplify={handleSimplify}`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Old ActionBubble unit test assertions were stale**
- **Found during:** Task 2 full suite verification
- **Issue:** `tests/unit/ActionBubble.test.tsx` tested the Phase 4 behavior (buttons disabled). After enabling buttons in this plan, two tests asserted `toBeDisabled()` which now fail. The file also lacked `messageId`, `onFindSources`, and `onSimplify` in `defaultProps`.
- **Fix:** Added `messageId` to `defaultBubble`, added `onFindSources`/`onSimplify` to `defaultProps`, changed disabled assertions to `not.toBeDisabled()` with updated test names.
- **Files modified:** `frontend/tests/unit/ActionBubble.test.tsx`
- **Commit:** a15461f (included in Task 2 commit)

## Verification Results

- TypeScript: `npx tsc --noEmit` — clean (no errors)
- Vitest: 128 passed, 26 todo, 0 failed (up from 121 before this plan)
- ActionBubble-specific tests: 7/7 pass (new suite in `src/tests/actionBubble.test.tsx`)

## Self-Check: PASSED

- ActionBubble.tsx: FOUND
- ThreadView.tsx: FOUND
- 05-03-SUMMARY.md: FOUND
- Commit 34d83ca (TDD RED): FOUND
- Commit 1c36136 (TDD GREEN): FOUND
- Commit a15461f (Task 2): FOUND
