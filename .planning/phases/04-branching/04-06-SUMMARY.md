---
phase: 04-branching
plan: "06"
subsystem: frontend-branching
tags: [gutter, lead-pills, branching, tdd, dom-measurement]
dependency_graph:
  requires: [04-05]
  provides: [GutterColumn, lead-pill-rendering, hover-preview, gutter-navigation]
  affects: [ThreadView, frontend-layout]
tech_stack:
  added: []
  patterns: [ResizeObserver-guard, rAF-batching, useRef-for-dom-positions, TDD-red-green]
key_files:
  created:
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/tests/unit/GutterColumn.test.tsx
  modified:
    - frontend/src/components/thread/ThreadView.tsx
key_decisions:
  - "DOM pill positions stored in useRef (never Zustand) — per established decision from Phase 04 planning"
  - "ResizeObserver guarded with typeof check — consistent with Phase 03-05 pattern for jsdom"
  - "posVersion counter state triggers re-render only when position changes exceed 1px threshold — avoids infinite loop"
  - "GutterColumn rendered inside flex row with overflow-hidden — enables proper layout alongside scroll container"
  - "MessageBlock already had data-message-id from 04-05 — no changes needed to MessageBlock"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 4 Plan 6: GutterColumn — Lead Pills and Hover Preview Summary

**One-liner:** 200px right gutter with absolute-positioned lead pills (arrow + truncated title + message count + accent pip), hover preview card, and ResizeObserver-driven DOM positioning.

## What Was Built

### GutterColumn.tsx

A new component in `frontend/src/components/branching/` that:

- Returns `null` immediately when `activeThread.childThreadIds.length === 0` (BRANCH-08)
- Collects `childLeads` from all messages in the active thread via `flatMap`
- Tracks pill vertical positions in `useRef<Record<string, number>>` — never in Zustand
- Uses a `posVersion` counter state that increments only when a position changes by >1px — triggers re-render without infinite loop
- `recomputePositions()` uses `measurePillTop()` to read DOM positions via `getBoundingClientRect` on `[data-message-id][data-paragraph-id]` elements
- ResizeObserver guarded with `typeof ResizeObserver !== 'undefined'` (jsdom safe)
- Scroll listener on the container triggers `requestAnimationFrame(recomputePositions)`

### LeadPill sub-component

Defined in the same file as GutterColumn:

- `position: absolute` with `top` from measured pill position
- Shows: `→` arrow + `title.slice(0, 32)` + `messageIds.length` badge + accent color pip with `data-testid="accent-pip"` (BRANCH-09)
- Hover state (useState) shows preview card with: anchorText, first user message, first line of first AI response (BRANCH-10)
- `onClick` calls `onNavigate(lead.threadId)` (BRANCH-11)

### ThreadView.tsx Integration

Layout changed from a single scroll div to a flex row:

```
<div flex flex-col h-full>
  <div flex flex-1 overflow-hidden>          ← new wrapper
    <div ref={scrollRef} flex-1 overflow-y-auto>   ← existing scroll container
    <GutterColumn ...>                              ← new
  </div>
  <ChatInput ...>
</div>
```

GutterColumn is conditioned on `activeThread` being non-null. When the thread has no children, GutterColumn itself returns null, so no layout space is taken.

## Test Coverage

10 new tests covering BRANCH-08 through BRANCH-11, promoted from `it.todo()` stubs:

| Requirement | Tests |
|-------------|-------|
| BRANCH-08 | renders nothing when no childThreadIds; renders gutter when children present |
| BRANCH-09 | arrow visible; title truncated to 32 chars; message count; accent pip backgroundColor |
| BRANCH-10 | hover shows anchor text; hover shows first user message; hover shows first AI line |
| BRANCH-11 | click calls onNavigate with correct threadId |

Full suite result: **117 tests pass** across 14 test files.

## Deviations from Plan

### Auto-noted (not requiring fixes)

**MessageBlock.tsx data-message-id:** The plan noted this attribute needed to be added to `MessageBlock.tsx`. It was already present from Phase 04-05 work (`data-message-id={message.id}` on the outer div). No change was required — this was a pre-existing correct implementation, not a deviation.

No bugs found. No architectural changes. Plan executed as written.

## Self-Check

Files created/modified:
- `frontend/src/components/branching/GutterColumn.tsx` — created
- `frontend/tests/unit/GutterColumn.test.tsx` — promoted from stubs to real tests
- `frontend/src/components/thread/ThreadView.tsx` — layout integrated

Commits:
- `8624eb0` — test(04-06): add failing tests for GutterColumn BRANCH-08/09/10/11
- `910464d` — feat(04-06): implement GutterColumn with lead pills and hover preview
- `a843842` — feat(04-06): integrate GutterColumn into ThreadView layout

## Self-Check: PASSED
