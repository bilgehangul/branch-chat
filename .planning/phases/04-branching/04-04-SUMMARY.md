---
phase: 04-branching
plan: "04"
subsystem: frontend-branching
tags: [component, tdd, selection, action-bubble, branching]
dependency_graph:
  requires: [04-02]
  provides: [ActionBubble, ActionBubbleProps]
  affects: [ThreadView, AppShell]
tech_stack:
  added: []
  patterns: [TDD red-green, fixed positioning, document mousedown listener, preventDefault focus-steal prevention]
key_files:
  created:
    - frontend/src/components/branching/ActionBubble.tsx
  modified:
    - frontend/tests/unit/ActionBubble.test.tsx
decisions:
  - "ActionBubble reads anchorText/paragraphId from props (captured at selection time), NOT window.getSelection() at click time — prevents collapsed-selection bug"
  - "All buttons call onMouseDown preventDefault — prevents focus steal that collapses browser selection before click fires"
  - "HTML entity arrows/icons used (&#8594;, &#128269;, &#10022;) instead of emoji literals — avoids encoding issues"
metrics:
  duration: "2 min"
  completed: "2026-03-09"
  tasks: 1
  files: 2
---

# Phase 4 Plan 4: ActionBubble Component Summary

**One-liner:** Fixed-position floating action bubble with three buttons (Go Deeper primary, Find Sources + Simplify disabled ghost), depth-gated Go Deeper, and outside-click dismiss via document mousedown listener.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Build ActionBubble component (TDD red-green) | 99648de | ActionBubble.tsx, ActionBubble.test.tsx |

## What Was Built

**ActionBubble component** (`frontend/src/components/branching/ActionBubble.tsx`):
- Exports `ActionBubble` function component and `ActionBubbleProps` interface
- Positioned via `position:fixed` with `top: bubble.top`, `left: bubble.left`, `transform: translateY(calc(-100% - 8px))` — appears 8px above the top-right corner of the selection
- `z-index: z-50` via Tailwind class — floats above all content
- Container: `bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2`
- **Go Deeper button:** `bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium` — primary accent. When `isAtMaxDepth=true`: `disabled`, `opacity-50 cursor-not-allowed`, `title="Maximum depth reached"`
- **Find Sources button:** `bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed`, `disabled` — placeholder for Phase 5
- **Simplify button:** same as Find Sources — placeholder for Phase 5
- All three buttons call `e.preventDefault()` on `onMouseDown` to prevent focus steal
- `useEffect` attaches `mousedown` to `document`; calls `onDismiss()` when click target is outside bubble `ref`

## Test Results

- **ActionBubble**: 12 tests pass, 0 todo
  - Renders at correct fixed position (top: bubble.top, left: bubble.left) [BRANCH-02]
  - Applies transform translateY(calc(-100% - 8px)) [BRANCH-02]
  - Go Deeper has primary accent style (bg-blue-600) [BRANCH-03]
  - Find Sources has ghost style (bg-zinc-700) [BRANCH-03]
  - Simplify has ghost style (bg-zinc-700) [BRANCH-03]
  - Find Sources is disabled [BRANCH-03]
  - Simplify is disabled [BRANCH-03]
  - Go Deeper disabled when isAtMaxDepth=true [BRANCH-12]
  - Go Deeper shows "Maximum depth reached" title when disabled [BRANCH-12]
  - Go Deeper enabled when isAtMaxDepth=false [BRANCH-12]
  - onGoDeeper called with anchorText and paragraphId on click
  - onDismiss called when clicking outside bubble

- **Full suite**: 100 passed, 16 todo, 2 skipped (no regressions)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
