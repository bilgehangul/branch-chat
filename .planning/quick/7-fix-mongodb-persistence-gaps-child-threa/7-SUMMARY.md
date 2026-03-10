---
phase: quick-7
plan: 01
subsystem: persistence
tags: [mongodb, threads, messages, fire-and-forget, backend-routes, frontend-wiring]
dependency_graph:
  requires: [backend/src/routes/sessions.ts, frontend/src/api/sessions.ts]
  provides: [POST /api/threads, PATCH /api/threads/:id, DELETE /api/threads/:id, PATCH /api/messages/:id]
  affects: [frontend/src/components/thread/ThreadView.tsx]
tech_stack:
  added: []
  patterns: [fire-and-forget void fn(), BFS descendant collection, ownership check pattern]
key_files:
  created: []
  modified:
    - backend/src/routes/sessions.ts
    - backend/src/routes/index.ts
    - backend/src/index.ts
    - frontend/src/api/sessions.ts
    - frontend/src/components/thread/ThreadView.tsx
decisions:
  - "threadsRouter and messagesRouter appended to sessions.ts (not a new file) — keeps all route code collocated, file is not large enough to split"
  - "Fire-and-forget pattern: all persistence calls use void fn() and catch-all try/catch — zero UI blocking, non-fatal failures"
  - "BFS uses in-session Thread.find() snapshot to collect descendants — avoids recursive DB queries"
  - "$set patch for annotations/childLeads replaces whole arrays — consistent with addAnnotation/updateAnnotation Zustand behavior"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_modified: 5
---

# Quick Task 7: Fix MongoDB Persistence Gaps (Child Threads) Summary

**One-liner:** Four ownership-checked backend routes (POST/PATCH/DELETE threads, PATCH messages) + fire-and-forget frontend wiring at all six mutation sites in ThreadView.

## What Was Built

### Backend (Task 1)

Added `threadsRouter` and `messagesRouter` to `backend/src/routes/sessions.ts`, exported and registered in `backend/src/routes/index.ts`. Added `DELETE` to the CORS methods array.

**POST /api/threads**
- Creates a child thread document with full IThread fields
- Verifies session ownership (session.userId === req.verifiedUser.sub)
- Pushes new threadId into parent thread's `childThreadIds` via `$push`

**PATCH /api/threads/:id**
- Accepts `{ title?, scrollPosition? }` patch body
- Thread ownership check before update
- Uses `$set` for targeted field replacement

**DELETE /api/threads/:id**
- Thread ownership check
- BFS traversal: loads all threads in the session once, builds Map, walks childThreadIds to collect all descendants
- `Thread.deleteMany` + `Message.deleteMany` on collected IDs in two bulk operations

**PATCH /api/messages/:id**
- Accepts `{ annotations?, childLeads? }` — both optional, each validated as array
- Ownership check against message.userId
- `$set` replaces whole arrays (not merge) — matches Zustand store behavior

### Frontend (Task 2)

**`frontend/src/api/sessions.ts`** — four new exported functions:
- `createThreadOnBackend(payload, getToken)` — POST /api/threads
- `updateThreadOnBackend(threadId, patch, getToken)` — PATCH /api/threads/:id
- `deleteThreadFromDB(threadId, getToken)` — DELETE /api/threads/:id
- `updateMessageOnBackend(messageId, patch, getToken)` — PATCH /api/messages/:id

All use try/catch with empty catch blocks — non-fatal, fire-and-forget.

**`frontend/src/components/thread/ThreadView.tsx`** — six mutation sites wired:

1. **handleGoDeeper**: after `setActiveThread(newThreadId)` — calls `createThreadOnBackend` with full thread payload, then `updateMessageOnBackend` with updated childLeads snapshot
2. **handleFindSources (doFetch success path)**: after `setPendingAnnotation(null)` — calls `updateMessageOnBackend` with updated annotations snapshot
3. **handleSimplify (doFetch success path)**: after `setPendingAnnotation(null)` — calls `updateMessageOnBackend` with updated annotations snapshot
4. **scroll-save useEffect**: after `setScrollPosition(prevId, ...)` — calls `updateThreadOnBackend(prevId, { scrollPosition })`
5. **GutterColumn onDeleteThread**: inline arrow replaces bare `deleteThread` ref — calls `deleteThread(threadId)` then `void deleteThreadFromDB(threadId, getToken)`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `backend/src/routes/sessions.ts` — threadsRouter and messagesRouter present: FOUND
- `backend/src/routes/index.ts` — threadsRouter and messagesRouter registered: FOUND
- `backend/src/index.ts` — DELETE in CORS methods: FOUND
- `frontend/src/api/sessions.ts` — four new exported functions: FOUND
- `frontend/src/components/thread/ThreadView.tsx` — imports + six wiring sites: FOUND
- Backend tsc --noEmit: PASSED (zero errors)
- Frontend tsc --noEmit: PASSED (zero errors)
- Commit 87b3ee05: Task 1 backend routes — FOUND
- Commit f3f2e4a0: Task 2 frontend wiring — FOUND

## Self-Check: PASSED
