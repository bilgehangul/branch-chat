---
phase: quick-17
plan: 17
subsystem: frontend-sidebar
tags: [sidebar, resize, menu, tree, UX]
key-files:
  created:
    - frontend/src/hooks/useResizableSidebar.ts
  modified:
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/history/SessionHistory.tsx
decisions:
  - "localStorage key 'sidebar-width' for persistence; default 192px matches original w-48"
  - "Session-level rename/delete deferred until backend PATCH/DELETE endpoints exist; thread-level uses Zustand directly"
  - "Inline paddingLeft style for thread depth indentation instead of dynamic Tailwind classes"
metrics:
  duration: "3 min"
  completed: "2026-03-11"
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 17: Resizable Sidebar with Drag Handle + 3-Dot Menu + Thread Tree Summary

Draggable sidebar resize (200-500px) with localStorage persistence, per-chat 3-dot hover menu with inline rename and delete confirmation, and hierarchical thread tree with expand/collapse toggles.

## What Was Done

### Task 1: useResizableSidebar hook + AppShell wiring
- Created `useResizableSidebar` hook managing width state with mouse+touch drag support
- Width clamped between 200px and 500px, initialized from localStorage or default 192px
- Persists to localStorage on drag end
- AppShell sidebar uses inline width style instead of fixed `w-48`
- Drag handle rendered as 4px absolute-positioned strip on sidebar right edge
- Visual feedback: hover highlight + active highlight during drag
- Root container gets `select-none cursor-col-resize` during drag

### Task 2: 3-dot menu + hierarchical thread tree
- Each chat entry (session and thread) shows "..." button on hover via group/opacity pattern
- Dropdown menu with "Edit title" and "Delete" options
- Edit title: inline `<input>` with Enter/blur to save, Escape to cancel
- Delete: confirmation with Yes/No buttons inline, then Zustand deleteThread
- Thread tree uses expand/collapse toggles (down/right triangle Unicode)
- Leaf nodes show en-dash instead of corner bracket
- Indentation via `paddingLeft: depth * 16px` (reliable, no Tailwind safelist needed)
- Active thread highlighted with semibold + bg tint
- Outside click closes open menus

### Task 3: AppShell prop wiring
- activeThreadId already passed to SessionHistory from Task 1
- Added TODO comment noting session-level rename/delete requires backend API support

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8c5f93bb | Resizable sidebar with drag handle and localStorage persistence |
| 2 | ae116698 | 3-dot menu per chat + hierarchical thread tree with collapse |
| 3 | 35d98e3b | Wire activeThreadId through AppShell to SessionHistory |

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors
- Build: `npx vite build` succeeds (490KB JS, 35KB CSS)
