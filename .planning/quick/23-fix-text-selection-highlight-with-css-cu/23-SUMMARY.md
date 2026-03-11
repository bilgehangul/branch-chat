---
phase: quick-23
plan: 1
subsystem: frontend-text-selection
tags: [css-overlay, text-selection, highlight, ux]
dependency_graph:
  requires: [useTextSelection, ThreadView, ActionBubble]
  provides: [HighlightOverlay, selectionRects]
  affects: [useTextSelection, ThreadView]
tech_stack:
  patterns: [CSS overlay highlight, DOMRect-to-container-relative coordinates]
key_files:
  created:
    - frontend/src/components/branching/HighlightOverlay.tsx
  modified:
    - frontend/src/hooks/useTextSelection.ts
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/tests/unit/useTextSelection.test.ts
decisions:
  - "selectionRects computed from range.getClientRects() relative to scroll container — persists through React re-renders"
  - "savedRangeRef + requestAnimationFrame restoration fully removed — replaced by CSS overlay approach"
  - "HighlightOverlay uses pointer-events-none absolute divs with rgba(59,130,246,0.25) — matches Tailwind blue-500 at 25% opacity"
metrics:
  duration_minutes: 2
  completed: "2026-03-11T04:05:33Z"
---

# Quick Task 23: Fix Text Selection Highlight with CSS Overlay

CSS overlay highlight replacing unreliable Range save/restore — captures DOMRect coordinates at selection time, renders absolutely-positioned blue rectangles inside the scroll container that persist through React re-renders.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Capture selection rects and build HighlightOverlay | b0f85038 | useTextSelection.ts, HighlightOverlay.tsx, useTextSelection.test.ts |
| 2 | Wire HighlightOverlay into ThreadView scroll container | 51d599cb | ThreadView.tsx |

## Changes Made

### useTextSelection.ts
- Added `SelectionRect` interface and `selectionRects` field to `SelectionState`
- In mouseup handler: uses `range.getClientRects()` to capture all selection rectangles, converts from viewport to scroll-container-relative coordinates using container's `getBoundingClientRect()` + `scrollTop`/`scrollLeft`
- Removed `savedRangeRef` (useRef) entirely
- Removed the `useEffect` that restored the Range via `requestAnimationFrame` when bubble became non-null
- Removed `range.cloneRange()` call from mouseup handler
- Simplified `clearBubble` to just `setBubble(null)`

### HighlightOverlay.tsx (new)
- Renders an array of absolutely-positioned `<div>` elements with semi-transparent blue background
- Uses `pointer-events-none` to avoid interfering with text selection or clicks
- Returns `null` when rects array is empty

### ThreadView.tsx
- Imports and renders `<HighlightOverlay>` inside the position:relative content wrapper
- Overlay only renders when `bubble` is non-null
- When `clearBubble` fires, bubble becomes null and overlay disappears

### Tests
- Removed `cloneRange` from all mock range objects
- Added `getClientRects` mock to range objects
- Added new test: `returns bubble state with selectionRects for valid single-block selection` — verifies relative coordinate computation
- Added new test: `computes selectionRects accounting for scroll offset` — verifies scrollTop/scrollLeft offset is applied
- All 8 tests pass (3 todos remain from earlier)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `vitest run tests/unit/useTextSelection.test.ts` — 8 passed, 3 todo
- `tsc --noEmit` — no type errors
- Pre-existing test failures in ThreadView.test.tsx and useStreamingChat.test.ts are unrelated to this change
