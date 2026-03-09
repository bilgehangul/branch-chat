---
phase: 04-branching
plan: "03"
subsystem: frontend-api-hooks
tags: [system-prompt, child-threads, streaming, tdd]
requirements: [BRANCH-04]

dependency_graph:
  requires: ["04-01"]
  provides: ["child-thread-context-propagation"]
  affects: ["frontend/src/api/chat.ts", "frontend/src/hooks/useStreamingChat.ts"]

tech_stack:
  added: []
  patterns: ["TDD red-green", "pure exported function for testability", "conditional body spreading"]

key_files:
  created: []
  modified:
    - frontend/src/api/chat.ts
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/tests/unit/api.chat.test.ts
    - frontend/tests/unit/useStreamingChat.test.ts

decisions:
  - "Frontend parameter named systemInstruction; serialized as systemPrompt in JSON body to match existing backend req.body.systemPrompt"
  - "buildChildSystemPrompt exported as pure function from useStreamingChat.ts for direct unit testing without hook harness"
  - "systemPrompt omitted from POST body entirely when empty (falsy check) — not sent as empty string"

metrics:
  duration: "2 min"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_modified: 4
---

# Phase 4 Plan 3: Child Thread Context Propagation Summary

Frontend-only wiring of system prompt injection for child threads: `buildChildSystemPrompt` pure function derives focused conversation prompt from thread depth, anchorText, and parent message content, forwarded through `streamChat` as `systemPrompt` in POST body (matching existing backend `req.body.systemPrompt`).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend streamChat to accept and forward systemInstruction | 303d98d | frontend/src/api/chat.ts, frontend/tests/unit/api.chat.test.ts |
| 2 | Derive and inject system prompt in useStreamingChat | e38bbad | frontend/src/hooks/useStreamingChat.ts, frontend/tests/unit/useStreamingChat.test.ts |

## What Was Built

**Task 1 — streamChat body extension:**
- Added optional `systemInstruction?: string` to the `streamChat` body parameter type
- Serialized as `systemPrompt` key in the POST JSON body (aligns with `req.body.systemPrompt` in backend `chat.ts` line 11)
- Omitted entirely from body when absent or empty string (conditional spread)
- 3 new tests: systemPrompt included, absent, empty-string cases (10 total in api.chat.test.ts)

**Task 2 — useStreamingChat system prompt derivation:**
- Exported `buildChildSystemPrompt(anchorText: string, parentContext: string): string` pure function
- Template: "You are in a focused sub-conversation about: {anchorText}. Context from parent message: {parentContext.slice(0,200)}. Stay focused on this specific topic unless the user redirects."
- `sendMessage` derives `systemInstruction` before `streamChat` call: empty for depth=0, full template for depth>=1
- Graceful fallbacks: null anchorText → empty string; missing parentMessageId or message → empty string
- 6 new tests: `buildChildSystemPrompt` unit tests (4) + depth=0 no-prompt + depth=1 with-prompt (23 total in useStreamingChat.test.ts)

## Verification

Full test suite: 84 tests pass, 28 todo (pre-existing), 0 failures across 12 test files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Key alignment] Backend uses `systemPrompt` not `systemInstruction` as JSON key**
- **Found during:** Task 1 (pre-implementation read of backend/src/routes/chat.ts line 11)
- **Issue:** Plan's code snippet used `systemInstruction` as both TypeScript param name and JSON key. Backend reads `req.body.systemPrompt`.
- **Fix:** TypeScript parameter stays `systemInstruction`; JSON body key serialized as `systemPrompt` to match backend expectation
- **Files modified:** frontend/src/api/chat.ts
- **Commit:** 303d98d

## Self-Check

- [x] frontend/src/api/chat.ts modified with systemInstruction param + systemPrompt serialization
- [x] frontend/src/hooks/useStreamingChat.ts exports buildChildSystemPrompt + injects systemInstruction
- [x] frontend/tests/unit/api.chat.test.ts has 10 passing tests
- [x] frontend/tests/unit/useStreamingChat.test.ts has 23 passing tests
- [x] Commits 303d98d and e38bbad exist

## Self-Check: PASSED
