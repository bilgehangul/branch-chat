---
phase: 02-frontend-foundation
plan: 03
subsystem: ui
tags: [fetch, sse, streaming, typescript, vitest, tdd, api-client]

# Dependency graph
requires:
  - phase: 01-backend-proxy-shell
    provides: backend POST /api/chat SSE contract, /api/find-sources, /api/simplify routes
  - plan: 02-02
    provides: shared/types.ts SseEvent/ApiResponse/SearchResult types

provides:
  - apiRequest<T>() base fetch wrapper with Clerk JWT injection via getToken parameter
  - streamChat() SSE client with remainder buffer pattern for split TCP chunks
  - simplifyText() stub wrapping apiRequest -> POST /api/simplify
  - searchSources() stub wrapping apiRequest -> POST /api/find-sources
  - 5 api.chat tests; 28 total tests green

affects:
  - phase-03-chat-ui (useStreamingChat hook consumes streamChat() directly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - fetch + ReadableStream SSE pattern (no EventSource — cannot send auth headers)
    - Remainder buffer pattern: remainder = lines.pop() ?? '' — holds incomplete line across read() calls
    - getToken as function parameter — api/ modules are plain async functions, no React hooks
    - vi.spyOn(globalThis, 'fetch') for mocking fetch in Vitest jsdom environment

key-files:
  created:
    - frontend/src/api/client.ts
    - frontend/src/api/chat.ts
    - frontend/src/api/simplify.ts
    - frontend/src/api/search.ts
  modified:
    - frontend/tests/unit/api.chat.test.ts

key-decisions:
  - "streamChat uses fetch+ReadableStream with remainder buffer — not EventSource (EventSource cannot send Authorization headers)"
  - "getToken passed as function parameter into all api/ modules — hooks never called inside api layer"
  - "backend route is /api/find-sources (not /api/search) in search.ts — matches Phase 1 router"
  - "DONE sentinel checked before JSON.parse — avoids JSON.parse('[DONE]') throw"

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 02 Plan 03: API Client Layer Summary

**fetch+ReadableStream SSE client with remainder buffer for split TCP chunks, plus base fetch wrapper and stubs for simplify/search — all api/ modules are plain async functions with getToken as parameter (no React hooks)**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-03-09
- **Tasks:** 1 of 2 complete (Task 2 is human-verify checkpoint — pending)
- **Files created:** 5

## Accomplishments

- `frontend/src/api/client.ts`: `apiRequest<T>()` attaches Clerk JWT via `getToken` param; sets `Content-Type: application/json` default; returns `ApiResponse<T>`
- `frontend/src/api/chat.ts`: `streamChat()` with the critical remainder buffer pattern (`remainder = lines.pop() ?? ''`) — handles TCP chunks split mid-JSON-line; checks `[DONE]` sentinel before `JSON.parse`; silently skips malformed lines
- `frontend/src/api/simplify.ts`: `simplifyText()` thin wrapper around `apiRequest` -> `POST /api/simplify`
- `frontend/src/api/search.ts`: `searchSources()` thin wrapper -> `POST /api/find-sources` (correct Phase 1 route)
- 5 api.chat tests written and passing; full suite at 28 tests green

## Task Commits

1. **Task 1: API client modules + tests** - `2af42f0` (feat)
   - TDD: RED (todo stubs replaced with real failing tests) -> GREEN (4 api modules implemented)

## Files Created/Modified

- `frontend/src/api/client.ts` — `apiRequest<T>()`, `RequestOptions` interface
- `frontend/src/api/chat.ts` — `streamChat()` with remainder buffer SSE parser
- `frontend/src/api/simplify.ts` — `simplifyText()` stub
- `frontend/src/api/search.ts` — `searchSources()` stub
- `frontend/tests/unit/api.chat.test.ts` — 5 tests: onChunk, onDone/DONE sentinel, onError HTTP, split-chunk buffer, malformed JSON skip

## Decisions Made

- `streamChat` uses `fetch` + `ReadableStream` — `EventSource` cannot send `Authorization` headers (locked decision from Phase 1 research)
- `getToken` passed as function parameter — keeps api/ modules as plain async functions, usable outside React component tree
- Route is `/api/find-sources` not `/api/search` — matches backend Phase 1 router exactly
- DONE sentinel check precedes `JSON.parse` — prevents `JSON.parse('[DONE]')` from throwing unnecessarily

## Deviations from Plan

None — plan executed exactly as written. The 28-test total (vs. planned 23) reflects additional tests added by plans 02-01 and 02-02 during their execution; all pass.

## Checkpoint Status

Task 2 (human-verify checkpoint) is pending — requires Clerk publishable key and browser verification of full Phase 2 auth flow. See checkpoint details in 02-03-PLAN.md.

## Self-Check: PASSED

- `frontend/src/api/client.ts` — exists
- `frontend/src/api/chat.ts` — exists
- `frontend/src/api/simplify.ts` — exists
- `frontend/src/api/search.ts` — exists
- Commit `2af42f0` — exists
- 28 tests green (vitest run passed)
- No EventSource in api/ modules
- No React hooks in api/ modules
- `remainder = lines.pop()` present in chat.ts
