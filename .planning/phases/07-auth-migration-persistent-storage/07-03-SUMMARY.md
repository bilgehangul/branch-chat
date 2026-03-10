---
phase: 07-auth-migration-persistent-storage
plan: 03
subsystem: backend-db
tags: [mongodb, mongoose, schemas, persistence]
one-liner: "Installed Mongoose, defined four schema models (User/Session/Thread/Message) with TTL index and model guard pattern, and wired connectDB fire-and-forget in index.ts"
decisions:
  - "connectDB uses graceful skip (console.warn + return) when MONGODB_URI absent — tests run without real DB"
  - "connectDB called fire-and-forget after app.listen() — maintains synchronous server export for supertest compatibility"
  - "Thread._id and Message._id use frontend UUID strings (not ObjectId) — stored directly as Mongoose _id"
  - "messageIds NOT stored in Thread schema — reconstructed from Message.find({threadId}) sorted by createdAt on load"
  - "annotations and childLeads stored as Schema.Types.Mixed (JSON blobs) — avoids schema explosion for Phase 7"
  - "Model guard pattern: mongoose.models.X ?? model('X', schema) — prevents test re-registration errors"
  - "Session TTL index: expireAfterSeconds = 90 * 24 * 60 * 60 (90 days of inactivity)"
key-files:
  created:
    - backend/src/db/connection.ts
    - backend/src/db/models/User.ts
    - backend/src/db/models/Session.ts
    - backend/src/db/models/Thread.ts
    - backend/src/db/models/Message.ts
    - backend/tests/sessions.test.ts
  modified:
    - backend/src/index.ts
metrics:
  duration: 8
  completed: "2026-03-10"
  tasks: 2
  files: 7
---

# Phase 7 Plan 03: Mongoose Connection + Schemas Summary

## What Was Built

Installed Mongoose and defined the database schema layer. Four models: User (googleSub lookup for upsert), Session (userId + TTL cleanup), Thread (branch relationships + UUID _id), Message (content + annotations/childLeads as Mixed blobs). connectDB() skips gracefully when MONGODB_URI is absent so all tests remain fast and DB-free.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Install mongoose, create db/connection.ts + 4 model files | 8faae30f |
| 2 | Wire connectDB into index.ts + sessions test scaffold | 8faae30f |

## Verification

- `npm run build` — exits 0, zero TypeScript errors
- `npx jest` — 14 tests pass, 7 todos (sessions scaffold)
- `ls backend/src/db/models/` — User.ts, Session.ts, Thread.ts, Message.ts all exist

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `backend/src/db/connection.ts` — graceful skip when MONGODB_URI absent
- [x] `backend/src/db/models/User.ts` — googleSub unique+indexed
- [x] `backend/src/db/models/Session.ts` — TTL index 90 days
- [x] `backend/src/db/models/Thread.ts` — String _id, depth 0-4
- [x] `backend/src/db/models/Message.ts` — Mixed annotations/childLeads
- [x] `backend/src/index.ts` — connectDB() called fire-and-forget
- [x] `backend/tests/sessions.test.ts` — todo stubs exist
