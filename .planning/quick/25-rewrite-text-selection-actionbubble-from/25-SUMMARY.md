---
phase: quick-25
plan: 01
subsystem: text-selection, sidebar
tags: [portal, fixed-positioning, text-selection, action-bubble, sidebar]
dependency_graph:
  requires: []
  provides: [working-text-selection, collapsed-sidebar-nodes]
  affects: [frontend/src/hooks/useTextSelection.ts, frontend/src/components/branching/ActionBubble.tsx, frontend/src/components/branching/HighlightOverlay.tsx, frontend/src/components/thread/ThreadView.tsx, frontend/src/components/history/SessionHistory.tsx]
tech_stack:
  added: [react-dom/createPortal]
  patterns: [position:fixed portal rendering, viewport-relative coordinates]
key_files:
  modified:
    - frontend/src/hooks/useTextSelection.ts
    - frontend/src/components/branching/ActionBubble.tsx
    - frontend/src/components/branching/HighlightOverlay.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/history/SessionHistory.tsx
decisions:
  - "ActionBubble uses position:fixed via createPortal to document.body — escapes CSS Grid entirely"
  - "HighlightOverlay converts scroll-container-relative rects to viewport coords using scrollRef"
  - "flipped threshold changed from absoluteTop < 60 to bubble.top < 80 (viewport coords)"
  - "Sidebar ThreadNode collapsed by default (useState(false) instead of useState(true))"
metrics:
  duration_seconds: 249
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 5
---

# Quick Task 25: Rewrite Text Selection/ActionBubble from Scratch Summary

**One-liner:** Portal-based position:fixed ActionBubble and HighlightOverlay replace overlay divs inside CSS Grid, fixing mouse event blocking; sidebar ThreadNodes collapse by default.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Rewrite text selection system with position:fixed portal | 37cb9b76 |
| 2 | Fix sidebar ThreadNode collapsed by default | 5a581ff4 |

## What Was Built

### Task 1: Text Selection System Rewrite

The core bug: overlay divs rendered inside the CSS Grid were blocking mouse events from reaching the text content, making text selection non-functional.

**useTextSelection.ts** — Simplified to viewport-coords-only:
- Removed `wrapperRef` parameter, `absoluteTop`, and `absoluteLeft` fields from `SelectionState`
- `top` and `left` are now viewport-relative from `getBoundingClientRect()` (for `position:fixed` use)
- `selectionRects` remain scroll-container-relative (converted to viewport in HighlightOverlay)
- All validation logic (assistant-only, same-message, no-selection zones) preserved

**ActionBubble.tsx** — Changed `className="absolute ..."` to `className="fixed ..."`:
- Now uses viewport coordinates directly
- All button logic, dismiss-on-click-outside, mode switching unchanged

**HighlightOverlay.tsx** — Rewrote for portal rendering:
- Added `scrollRef` prop to convert scroll-container-relative rects to viewport coords
- Each rect rendered with `position: fixed` using converted viewport coordinates
- Clips to visible viewport to avoid rendering off-screen rects

**ThreadView.tsx** — Clean grid, no overlay hacks:
- Added `import { createPortal } from 'react-dom'`
- Removed `contentWrapperRef` ref entirely
- Updated `useTextSelection(scrollRef)` — no second arg
- Removed `relative` class from grid div
- Removed entire overlay div block (the `height:0 overflow:visible pointer-events:none` hack)
- ActionBubble rendered via `createPortal(..., document.body)` outside the grid
- HighlightOverlay rendered via `createPortal(..., document.body)` with `scrollRef` prop
- `flipped` threshold updated: `bubble.top < 80` (viewport coords, was `absoluteTop < 60`)

### Task 2: Sidebar ThreadNode Collapsed by Default

Single-line change in `SessionHistory.tsx`:
- `useState(true)` → `useState(false)` in `ThreadNode`'s `expanded` state
- Each node's expand/collapse toggle remains independent

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` (from frontend dir): passes with zero errors
- Build errors present are all pre-existing and unrelated to this task's scope (confirmed by stash test)

## Self-Check

- [x] `frontend/src/hooks/useTextSelection.ts` — modified, no `wrapperRef`/`absoluteTop`/`absoluteLeft`
- [x] `frontend/src/components/branching/ActionBubble.tsx` — `fixed` class applied
- [x] `frontend/src/components/branching/HighlightOverlay.tsx` — `scrollRef` prop, `position: fixed` rects
- [x] `frontend/src/components/thread/ThreadView.tsx` — overlay div removed, portals in place
- [x] `frontend/src/components/history/SessionHistory.tsx` — `useState(false)`
- [x] Commit 37cb9b76 exists
- [x] Commit 5a581ff4 exists

## Self-Check: PASSED
