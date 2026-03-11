---
phase: quick-15
plan: 01
subsystem: frontend-ui
tags: [ui, sidebar, thread-naming, multi-chat]
dependency_graph:
  requires: []
  provides: [35-char-thread-titles, new-chat-button, folder-style-sidebar, reduced-pill-padding]
  affects: [useStreamingChat, ThreadView, AppShell, SessionHistory, App]
tech_stack:
  added: []
  patterns: [folder-tree-sidebar, char-slice-title]
key_files:
  created: []
  modified:
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/history/SessionHistory.tsx
    - frontend/src/App.tsx
decisions:
  - Thread title uses text.slice(0, 35) instead of 6-word split for more predictable truncation
  - Sidebar always visible on sm+ screens so users can start new chats even on first visit
  - Child threads in SessionHistory only shown for active session (we don't have thread data for inactive sessions)
  - Thread type has no createdAt field so child threads are listed in store insertion order
metrics:
  duration: 2 min
  completed: "2026-03-11T02:14:36Z"
---

# Quick Task 15: UI Adjustments - Thread Naming, Multi-Chat, Folder Sidebar, Child Pill Proximity

35-char thread titles, "+ New Chat" button in always-visible "Chats" sidebar, folder-style child thread tree for active session, reduced child pill padding by 40-60px.

## Task Results

### Task 1: Thread title fix + child thread proximity
**Commit:** 98949c0b

- Changed title derivation from `text.split(' ').slice(0, 6).join(' ')` to `text.slice(0, 35)` in useStreamingChat.ts (first message auto-title)
- Applied same fix in ThreadView.tsx Go Deeper handler
- Reduced child thread pill padding from `pr-[120px] sm:pr-[200px]` to `pr-[80px] sm:pr-[140px]`

### Task 2: Multi-chat button + folder-style "Chats" sidebar
**Commit:** 2489ff6c

- Added `handleNewChat` in App.tsx: clears session, creates new one, persists to backend, refreshes list
- Renamed sidebar header from "History" to "Chats"
- Added "+ New Chat" button styled in blue above session list
- Removed `sessions.length > 0` conditional so sidebar always renders on sm+ screens
- Converted SessionHistory to folder-style tree: active session shows depth > 0 child threads indented with "- " prefix
- Added `threads` and `onNavigateThread` props to SessionHistory for child thread navigation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Thread type has no createdAt field**
- **Found during:** Task 2
- **Issue:** Plan suggested sorting child threads by creation time, but Thread interface has no createdAt property
- **Fix:** Removed sort, rely on store insertion order (which is chronological)
- **Files modified:** frontend/src/components/history/SessionHistory.tsx

## Verification

- TypeScript compiles clean (`npx tsc --noEmit` passes)
- Thread titles use `text.slice(0, 35)` in both useStreamingChat and ThreadView
- Child thread pills use reduced padding `pr-[80px] sm:pr-[140px]`
- Sidebar header says "Chats" with "+ New Chat" button
- Active session shows child threads in folder tree
