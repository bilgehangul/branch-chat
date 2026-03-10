---
phase: 07-auth-migration-persistent-storage
plan: 04
subsystem: backend-routes + frontend-store
tags: [persistence, sessions-api, chat-save, zustand, hydrateSession]
one-liner: "Implemented session CRUD API (list/load/create), message save-on-done in chat route, and hydrateSession Zustand action with matching frontend API client"
decisions:
  - "Chat route accumulates fullContent via chunk callback before save — save fires after res.end() is called"
  - "Save-on-done is fire-and-forget with catch logging — never delays or breaks SSE response"
  - "Session.create uses _id override (as never cast) — Mongoose doesn't natively accept custom _id without special handling"
  - "GET /api/sessions/:id reconstructs messageIds by sorting Message docs by createdAt ascending"
  - "hydrateSession sets userId to empty string — hydrated sessions belong to the current user, auth context provides identity separately"
  - "frontend/src/api/sessions.ts uses direct fetch (not apiRequest from client.ts) — avoids circular dependency and matches chat.ts pattern"
key-files:
  created:
    - backend/src/routes/sessions.ts
    - frontend/src/api/sessions.ts
  modified:
    - backend/src/routes/index.ts
    - backend/src/routes/chat.ts
    - frontend/src/store/sessionStore.ts
metrics:
  duration: 10
  completed: "2026-03-10"
  tasks: 2
  files: 5
---

# Phase 7 Plan 04: Session Routes + Chat Persistence + hydrateSession Summary

## What Was Built

Three session API routes: GET /api/sessions (list, most recent 20), GET /api/sessions/:id (load all threads+messages for Zustand hydration), POST /api/sessions (create session + root thread, upsert user). Chat route now accumulates full AI response content and saves both user + AI messages to MongoDB after the SSE stream completes. Zustand store gained `hydrateSession` action. Frontend gained `sessions.ts` API client.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | sessions.ts routes + wire into router + chat save-on-done | b42820ca |
| 2 | hydrateSession Zustand action + frontend sessions API client | b42820ca |

## Verification

- `npm run build` — exits 0, zero TypeScript errors
- `npx jest` — 14 tests pass, 7 todos (sessions scaffold awaiting route implementation)
- `npx tsc --noEmit` (frontend) — exits 0, zero TypeScript errors
- `grep "hydrateSession" frontend/src/store/sessionStore.ts` — matches

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `backend/src/routes/sessions.ts` — 3 routes (GET /, GET /:id, POST /)
- [x] `backend/src/routes/index.ts` — sessionsRouter mounted at /sessions
- [x] `backend/src/routes/chat.ts` — Message.create + Session.findByIdAndUpdate after SSE done
- [x] `frontend/src/store/sessionStore.ts` — hydrateSession action in interface + implementation
- [x] `frontend/src/api/sessions.ts` — fetchSessions, loadSession, createSessionOnBackend
