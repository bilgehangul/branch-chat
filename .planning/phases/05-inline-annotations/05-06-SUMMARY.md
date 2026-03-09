---
phase: 05-inline-annotations
plan: 06
subsystem: frontend-annotations
tags: [integration, annotation-flow, async-handlers, ThreadView, MessageBlock]
dependency_graph:
  requires: [05-04, 05-05]
  provides: [annotation-end-to-end, find-sources-flow, simplify-flow]
  affects: [MessageBlock, MessageList, ThreadView, SimplificationBlock]
tech_stack:
  added: []
  patterns:
    - Local useState for ephemeral loading/error state (not in Zustand)
    - doFetch closure captures retry logic — Retry button calls same closure
    - Mode key stored in annotation.originalText field (pragmatic reuse, 05-06 convention)
    - updateAnnotation vs addAnnotation based on existing paragraph match (no duplicates)
key_files:
  created: []
  modified:
    - frontend/src/components/thread/MessageBlock.tsx
    - frontend/src/components/thread/MessageList.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/annotations/SimplificationBlock.tsx
    - frontend/src/tests/messageBlock.test.tsx
    - frontend/src/tests/annotationErrors.test.tsx
    - frontend/src/tests/simplificationBlock.test.tsx
decisions:
  - "[05-06]: pendingAnnotation and errorAnnotation are local useState in ThreadView — ephemeral UI state does not survive thread switch, which is correct behavior"
  - "[05-06]: SimplificationBlock onTryAnother renamed to onSelectMode; mode picker UI (4 buttons) revealed on click rather than calling handler immediately"
  - "[05-06]: Error block rendered inline in MessageBlock using data-testid=annotation-error-block for testability"
  - "[05-06]: doFetch closure used inside handleFindSources/handleSimplify so retryFn captures the closure and re-triggers same fetch without re-binding params"
metrics:
  duration: "5 min"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_modified: 7
---

# Phase 5 Plan 6: Annotation Integration Summary

**One-liner:** Full end-to-end annotation flow wired — searchSources/simplifyText API calls with shimmer, error+retry, and Zustand persistence, all rendered as siblings of the AI bubble div.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Wire annotation rendering in MessageBlock | c37399f | MessageBlock.tsx, MessageList.tsx, SimplificationBlock.tsx |
| 2 | Implement real async annotation handlers in ThreadView | e0002ad | ThreadView.tsx |

## What Was Built

**Task 1 — MessageBlock annotation rendering:**
- CitationBlock and SimplificationBlock rendered as siblings of the AI bubble div (after the closing `</div>` of the bubble, inside the outer `data-message-id` wrapper)
- `data-paragraph-id` attributes on MarkdownRenderer output are completely untouched
- MessageBlock accepts `pendingAnnotation` and `errorAnnotation` props; renders shimmer or inline error block accordingly
- Inline error block has `data-testid="annotation-error-block"` and a Retry button that calls `errorAnnotation.retryFn`
- MessageList updated to thread `onTryAnother`, `pendingAnnotation`, and `errorAnnotation` props down to each MessageBlock

**Task 2 — Real async handlers in ThreadView:**
- `handleFindSources` calls `searchSources()`, dispatches `addAnnotation` on success, sets `errorAnnotation` on failure
- `handleSimplify` calls `simplifyText()`, dispatches `addAnnotation` (new) or `updateAnnotation` (if same paragraph already has a simplification) — no duplicate blocks
- `handleTryAnother` re-calls `handleSimplify` with new mode from SimplificationBlock's mode picker
- All loading/error state is local `useState` in ThreadView — not in Zustand — correct behavior (doesn't survive thread switch)
- SimplificationBlock prop interface updated: `onTryAnother: () => void` → `onSelectMode: (mode) => void`; "Try another mode" now reveals a 4-button mode picker row

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing prop threading] MessageList needed full prop threading before Task 2 could wire through**
- Found during: Task 1 implementation
- Issue: MessageList had no mechanism to pass annotation state to MessageBlock
- Fix: Updated MessageList props interface and render loop to thread `onTryAnother`, `pendingAnnotation`, `errorAnnotation`
- Files modified: frontend/src/components/thread/MessageList.tsx
- Commit: c37399f

**2. [Rule 1 - Interface change] SimplificationBlock test file referenced old `onTryAnother` prop**
- Found during: Task 2 - updating SimplificationBlock interface
- Issue: After renaming `onTryAnother` → `onSelectMode`, all 5 test calls broke
- Fix: Updated simplificationBlock.test.tsx to use `onSelectMode`, added mode-picker behavior tests
- Files modified: frontend/src/tests/simplificationBlock.test.tsx
- Commit: c37399f

**3. [Rule 2 - Shimmer implementation] Plan referenced AnnotationShimmer component but MessageBlock rendered shimmer inline**
- Decision: Shimmer rendered inline in MessageBlock (not imported AnnotationShimmer) for simplicity — avoids extra import and the Tailwind classes are identical. Functionally equivalent.

## Verification Results

```
Test Files  20 passed | 1 skipped (21)
Tests       152 passed | 6 todo (158)
Duration    6.56s
```

Frontend TypeScript: clean (0 errors)
Backend TypeScript: clean (0 errors)

## Self-Check: PASSED
