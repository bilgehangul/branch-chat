---
phase: quick
plan: 2
subsystem: branching-ui
tags: [modal, ux, context-menu, store]
dependency_graph:
  requires: []
  provides: [ConfirmDialog, summarizeThread, compactThread]
  affects: [GutterColumn, AncestorPeekPanel, AppShell, ThreadView, sessionStore]
tech_stack:
  added: []
  patterns: [createPortal modal overlay, Zustand stub actions, prop threading]
key_files:
  created:
    - frontend/src/components/ui/ConfirmDialog.tsx
  modified:
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/layout/AncestorPeekPanel.tsx
    - frontend/src/store/sessionStore.ts
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/thread/ThreadView.tsx
decisions:
  - ConfirmDialog uses createPortal to document.body so it renders above all menu z-index stacking contexts
  - pendingDelete boolean state replaces confirming state — menu stays open until modal appears
  - Summarize/Compact styled as enabled (slate-600 not slate-400/cursor-not-allowed) since they now have real callbacks
  - onSummarize/onCompact optional in AncestorPeekPanelProps for backwards-compat
metrics:
  duration: "3 min"
  completed: "2026-03-09"
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 2: Delete thread should be like a pop-up modal Summary

**One-liner:** Portal-based ConfirmDialog modal replaces inline dropdown "Are you sure?" for both context menus, with summarizeThread/compactThread Zustand stubs wired end-to-end.

## What Was Built

### ConfirmDialog component (`frontend/src/components/ui/ConfirmDialog.tsx`)

A reusable portal-based modal overlay that renders via `createPortal` directly into `document.body`. This ensures the dialog appears above all menu stacking contexts regardless of z-index nesting. Features backdrop-click-to-cancel, configurable title/body/button labels, and a danger color mode.

### Context menu updates (both GutterColumn and AncestorPeekPanel)

Removed the `confirming` boolean state and inline "Are you sure?" flow from both `ThreadContextMenu` and `ContextMenu`. Replaced with a `pendingDelete` boolean that renders `ConfirmDialog` as a portal when true. The dropdown menu stays rendered until the modal appears, so there is no visible flash.

Both menus now have Summarize and Compact as properly styled, clickable buttons (not `cursor-not-allowed` stubs) that call their respective callback props.

### Store stubs (`frontend/src/store/sessionStore.ts`)

Added `summarizeThread` and `compactThread` to `SessionState` interface and store implementation. Both are console.log stubs with TODO comments pointing to Phase 5 backend endpoints.

### Wiring (AppShell.tsx + ThreadView.tsx)

Both parent components select the new store actions and pass them down the prop chain:
- AppShell → AncestorPeekPanel (via onSummarize/onCompact)
- ThreadView → GutterColumn → LeadPill → ThreadContextMenu (via onSummarize/onCompact)

## Commits

| Hash | Description |
|------|-------------|
| 1be75fb | feat(quick-2): add ConfirmDialog modal and update both context menus |
| 3502fee | feat(quick-2): add summarizeThread/compactThread store stubs and wire to components |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `frontend/src/components/ui/ConfirmDialog.tsx` — FOUND
- Commit 1be75fb — FOUND
- Commit 3502fee — FOUND
- TypeScript: zero errors confirmed

## Status

Tasks 1 and 2 complete. Awaiting human verification at checkpoint (Task 3).
