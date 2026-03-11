---
phase: quick-19
plan: 1
subsystem: frontend-ui
tags: [ui-fix, sidebar, menu-visibility, chat-title]
dependency_graph:
  requires: []
  provides: [always-visible-3dot-menu, root-title-filter]
  affects: [SessionHistory, App]
tech_stack:
  added: []
  patterns: [vertical-ellipsis-menu, title-fallback-filter]
key_files:
  created: []
  modified:
    - frontend/src/components/history/SessionHistory.tsx
    - frontend/src/App.tsx
decisions:
  - "Vertical ellipsis chosen over horizontal for better clickability"
  - "Case-insensitive 'Root' filter added to liveTitle alongside existing 'New chat' filter"
  - "Session list refresh after hydration ensures stale sidebar titles update from backend"
metrics:
  duration: "1 min"
  completed: "2026-03-10"
---

# Quick Task 19: Make 3-dot Menu More Visible + Fix Chat Title "Root" Summary

Always-visible vertical ellipsis menu button with higher contrast, plus "Root" title filtered from sidebar display and session list refresh on session switch.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Make 3-dot menu always visible and fix chat title "Root" fallback | be90cdb6 | Done |

## Changes Made

### ThreeDotButton (SessionHistory.tsx)
- Removed `opacity-0 group-hover:opacity-100` so button is always visible
- Changed horizontal ellipsis to vertical ellipsis (`&#x22EE;`)
- Increased padding from `px-1 py-0.5` to `px-1.5 py-1` and font from `text-xs` to `text-sm`
- Improved default color contrast: `text-stone-500 dark:text-slate-400` (was `text-stone-400 dark:text-slate-500`)

### liveTitle Logic (SessionHistory.tsx)
- Added `liveRootThread.title.toLowerCase() !== 'root'` condition to filter out backend default "Root" title
- Sidebar now falls back to `session.title` from the sessions list when root thread title is "Root"

### handleLoadSession (App.tsx)
- Added `fetchSessions()` + `setSessionsList()` call after `hydrateSession()` completes
- Ensures sidebar titles refresh from backend when switching sessions

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED (zero errors)

## Self-Check: PASSED
