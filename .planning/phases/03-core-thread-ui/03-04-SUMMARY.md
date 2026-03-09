---
phase: 03-core-thread-ui
plan: "04"
subsystem: frontend-thread-view
tags: [react, zustand, scroll, animation, streaming, clerk]
dependency_graph:
  requires: [03-02, 03-03]
  provides: [ThreadView, MessageList, AppShell-wired, createSession-fix]
  affects: [03-05]
tech_stack:
  added: []
  patterns:
    - useRef for scroll position tracking (isAtBottomRef, scrollRef, bottomAnchorRef)
    - Passive scroll event listener for at-bottom detection
    - requestAnimationFrame for scroll position restore
    - Zustand separate selectors to avoid getSnapshot infinite loop
    - CSS transition-transform for slide animation
key_files:
  created:
    - frontend/src/components/thread/MessageList.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/layout/BreadcrumbBar.tsx
    - frontend/src/components/layout/SpineStrip.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/tests/unit/App.test.tsx
decisions:
  - "Zustand selectors must be separate calls (not object spread) to avoid getSnapshot infinite loop in React concurrent mode"
  - "scrollIntoView guarded with typeof check for jsdom test environment compatibility"
  - "App test updated from 'Start a conversation' to 'Ask anything to begin' — old text was AppShell placeholder, new text is ThreadView empty state"
metrics:
  duration: "3 min"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
---

# Phase 3 Plan 4: ThreadView + createSession Wiring Summary

**One-liner:** ThreadView with passive auto-scroll, 200ms CSS slide transition, scroll save/restore via requestAnimationFrame, and App.tsx createSession(userId) wired on Clerk sign-in.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | MessageList + ThreadView with auto-scroll and slide transition | 8cc66d5 | MessageList.tsx, ThreadView.tsx |
| 2 | Fix App.tsx createSession + wire AppShell slots | 7c93c94 | App.tsx, AppShell.tsx, BreadcrumbBar.tsx, SpineStrip.tsx |

## What Was Built

### MessageList.tsx
Renders ContextCard (only visible at depth >= 1 with anchorText) followed by MessageBlock components in messageIds order. Simple composition component.

### ThreadView.tsx
The composed view layer:
- Reads `threads`, `messages`, `activeThreadId`, `setScrollPosition` from Zustand store
- `useStreamingChat(getToken)` called here — the only place in the codebase
- Auto-scroll: `isAtBottomRef` tracks within-50px proximity; scrolls to `bottomAnchorRef` on message change only if at bottom
- Passive scroll listener updates `isAtBottomRef.current`
- Scroll save: `useEffect` detects `prevActiveThreadIdRef` change, saves scrollTop before transition
- Scroll restore: `requestAnimationFrame` restores `thread.scrollPosition` when `activeThreadId` changes
- Slide transition: `isTransitioning` state, set true on thread change, cleared after 200ms via setTimeout; drives `translate-x-[-100%]` → `translate-x-0` CSS transition
- Empty state: "Ask anything to begin" in zinc-400 when no messages

### App.tsx Fix
- Added `userId` to `useAuth()` destructure
- Added three separate `useSessionStore` selector calls (not object spread — avoids getSnapshot loop)
- Added `createSession(userId)` useEffect — fires when `isSignedIn && userId && !session`
- Removed old UserButton wrapper div — AppShell renders directly inside SignedIn

### AppShell.tsx
Replaced placeholder skeleton with real wired layout: SpineStrip (left), BreadcrumbBar (header), ThreadView (main).

### BreadcrumbBar.tsx + SpineStrip.tsx
Stub components returning null — full implementation deferred to Plan 03-05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] scrollIntoView not a function in jsdom**
- **Found during:** Task 2 (running App.test.tsx after wiring AppShell → ThreadView)
- **Issue:** jsdom does not implement `scrollIntoView`, causing TypeError in test environment
- **Fix:** Guarded call with `typeof bottomAnchorRef.current.scrollIntoView === 'function'`
- **Files modified:** frontend/src/components/thread/ThreadView.tsx
- **Commit:** 7c93c94 (included in Task 2 commit)

**2. [Rule 1 - Bug] Zustand object selector caused getSnapshot infinite loop**
- **Found during:** Task 2 (running full test suite)
- **Issue:** `useSessionStore((s) => ({ session: s.session, createSession: s.createSession, clearSession: s.clearSession }))` creates new object reference each render — React concurrent mode detects snapshot instability
- **Fix:** Replaced with three separate `useSessionStore` selector calls, each returning a stable primitive/function
- **Files modified:** frontend/src/App.tsx
- **Commit:** 7c93c94

**3. [Rule 1 - Bug] App.test.tsx expected stale placeholder text**
- **Found during:** Task 2 (App test suite after AppShell was wired)
- **Issue:** Test expected "Start a conversation" (old AppShell placeholder) but ThreadView now shows "Ask anything to begin" empty state
- **Fix:** Updated test assertion to match new empty state text
- **Files modified:** frontend/tests/unit/App.test.tsx
- **Commit:** 7c93c94

## Verification Results

- Full test suite: 57 passed, 14 todo, 0 failed
- TypeScript: clean (no errors)
- ThreadView.test.tsx: 3 todo stubs pass as expected (mocking complexity too high for scroll/animation behavior)

## Self-Check: PASSED

Files exist:
- frontend/src/components/thread/MessageList.tsx: FOUND
- frontend/src/components/thread/ThreadView.tsx: FOUND
- frontend/src/components/layout/BreadcrumbBar.tsx: FOUND
- frontend/src/components/layout/SpineStrip.tsx: FOUND

Commits exist:
- 8cc66d5: MessageList + ThreadView
- 7c93c94: App.tsx createSession + AppShell wiring
