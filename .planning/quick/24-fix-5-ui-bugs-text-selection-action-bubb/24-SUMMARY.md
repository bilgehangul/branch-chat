---
phase: quick-24
plan: 24
type: quick-task
subsystem: frontend/ui
tags: [bugfix, text-selection, action-bubble, branch-pills, sidebar, gutter-column]
dependency_graph:
  requires: []
  provides: [text-selection-working, action-bubble-visible, pills-aligned, subbranches-visible, sidebar-stacked]
  affects: [ThreadView, GutterColumn, MessageList, SessionHistory]
tech_stack:
  added: []
  patterns: [css-grid-height-zero-overflow-visible, border-left-accent-stacking]
key_files:
  created: []
  modified:
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/thread/MessageList.tsx
    - frontend/src/components/history/SessionHistory.tsx
decisions:
  - "Overlay/bubble wrapper uses height:0 overflow:visible col-span-full row to avoid being a grid item with height while still allowing absolute positioning relative to contentWrapperRef"
  - "Descendant pills made always-visible (removed max-h-0 transition) — hover handlers moved to parent div for preview card correctness"
  - "Sidebar connecting lines replaced with border-left on li using thread accentColor — cleaner stacking without absolute-positioned span overlap"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 4
---

# Quick Task 24: Fix 5 UI Bugs Summary

**One-liner:** Fixed text selection blocking, ActionBubble visibility, branch pill vertical alignment, subbranch hover collapse, and sidebar stacking with targeted CSS changes across 4 components.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix text selection, ActionBubble visibility, and overlay interaction | dd36a16e | ThreadView.tsx |
| 2 | Fix branch pill vertical alignment and subbranch hover collapse | ea121f31 | MessageList.tsx, GutterColumn.tsx |
| 3 | Fix sidebar parent branch sections — open by default, collapsible, stacked | 00887af0 | SessionHistory.tsx |

## Bug Fixes

### Bug 1 & 2 — Text selection and ActionBubble (ThreadView.tsx)

**Problem:** The two overlay/bubble wrapper divs used `className="col-span-full"` which made them grid items. Even though their inner divs had `position: absolute` and `pointer-events: none`, the outer grid-item div still participated in the grid layout and created invisible stacking contexts that interfered with mouse event dispatch for text selection.

**Fix:** Replaced the two separate `col-span-full` wrapper divs with a single `col-span-full` div that has `height: 0; overflow: visible; pointer-events: none`. This div claims no grid row height, so it doesn't push content or create blocking stacking contexts. Both the HighlightOverlay and ActionBubble live inside it via `position: absolute`, positioned relative to `contentWrapperRef` which has `position: relative`.

### Bug 3 — Branch pill vertical alignment (MessageList.tsx)

**Problem:** Pill column div used `self-start pt-2` which pinned all pills to the top of the message row.

**Fix:** Changed to `self-center` so pills vertically center within their message grid row. Provides much better alignment for the common case of single-pill messages.

### Bug 4 — Subbranch hover collapse (GutterColumn.tsx)

**Problem:** `onMouseEnter`/`onMouseLeave` were on the `<button>` element. Moving the cursor from the button to the descendant list (a sibling, not a child of the button) triggered `onMouseLeave`, collapsing the list before it could be interacted with.

**Fix:** Moved hover handlers from `<button>` to the parent `<div className="relative">` wrapper. Also removed the `max-h-0`/`max-h-[200px]` transition entirely — descendant pills are now always visible as the user prefers.

### Bug 5 — Sidebar stacked layout (SessionHistory.tsx)

**Problem:** Absolute-positioned `<span>` elements for VS Code-style connecting lines created visual overlap between thread sections. Sections lacked visual boundaries.

**Fix:** Removed the absolute-positioned connecting line spans. Added `border-left` directly on the `<li>` element using `thread.accentColor` for a clean accent-colored left border. Added card background (`bg-stone-50/50 dark:bg-zinc-800/30`) to depth-1 branch sections for clear stacked separation. Updated child thread container spacing from `ml-2 space-y-0.5` to `pl-1 space-y-1`.

## Deviations from Plan

None — plan executed exactly as written. All three tasks used the recommended approach specified in the plan.

## Self-Check: PASSED

- `frontend/src/components/thread/ThreadView.tsx` — modified, verified exists
- `frontend/src/components/branching/GutterColumn.tsx` — modified, verified exists
- `frontend/src/components/thread/MessageList.tsx` — modified, verified exists
- `frontend/src/components/history/SessionHistory.tsx` — modified, verified exists
- Commits dd36a16e, ea121f31, 00887af0 — all present in git log
- TypeScript: `npx tsc --noEmit` passed with no errors after all changes
