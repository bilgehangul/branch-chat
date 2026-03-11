---
phase: quick-16
plan: 16
subsystem: frontend-ui
tags: [sidebar, hierarchy, actionbubble, positioning, title-update]
dependency_graph:
  requires: [zustand-store, useTextSelection]
  provides: [hierarchical-sidebar, centered-actionbubble, live-title]
  affects: [SessionHistory, useTextSelection]
tech_stack:
  patterns: [recursive-component, viewport-clamping]
key_files:
  modified:
    - frontend/src/components/history/SessionHistory.tsx
    - frontend/src/hooks/useTextSelection.ts
decisions:
  - "ThreadNode recursive component for arbitrary depth nesting"
  - "Live title reads from Zustand root thread (depth 0) for active session only"
  - "ActionBubble centered via rect.left + rect.width/2 with 8px-to-(viewportWidth-200) clamping"
metrics:
  duration: 1 min
  completed: 2026-03-11
---

# Quick Task 16: Fix Sidebar Hierarchy, Chat Name Update, and ActionBubble Position Summary

Recursive ThreadNode component for hierarchical sidebar thread nesting; live Zustand title for active session; ActionBubble centered over selection with viewport clamping.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix sidebar hierarchy and live title update | cf30d2a4 | SessionHistory.tsx |
| 2 | Fix ActionBubble horizontal positioning | 8918a263 | useTextSelection.ts |

## What Was Done

### Task 1: Sidebar Hierarchy + Live Title

**Hierarchy fix:** Replaced flat `childThreads` array with a recursive `ThreadNode` component that resolves children via `thread.childThreadIds` and renders them with increasing indentation (`pl-4`, `pl-6`, `pl-8`, `pl-10` for depths 1-4). Child threads are prefixed with a corner indicator (unicode `└`).

**Live title fix:** For the active session, the sidebar now reads the root thread (depth 0) title from the Zustand store. If the root thread has a non-empty, non-"New chat" title, it displays that instead of the stale `session.title` from the sessions list. This ensures the sidebar reflects the live title set by `useStreamingChat` after the first user message.

### Task 2: ActionBubble Positioning

Changed the `left` calculation in `useTextSelection.ts` from `rect.right` (right edge of selection) to `rect.left + rect.width / 2` (center of selection). Added viewport clamping: `Math.max(8, Math.min(rawLeft, window.innerWidth - 200))` to prevent the bubble from overflowing off-screen in either direction.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (tsc --noEmit passes)
- Manual verification needed: sidebar hierarchy, live title update, ActionBubble centering
