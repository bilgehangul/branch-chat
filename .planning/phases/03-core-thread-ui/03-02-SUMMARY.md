---
phase: 03-core-thread-ui
plan: 02
subsystem: ui
tags: [react, zustand, streaming, sse, hooks, typescript, vitest]

requires:
  - phase: 03-01
    provides: test stub infrastructure (useStreamingChat.test.ts todo stubs, vitest setup)
  - phase: 02-03
    provides: streamChat function in frontend/src/api/chat.ts
  - phase: 02-02
    provides: sessionStore with addMessage, updateMessage, setMessageStreaming actions

provides:
  - useStreamingChat hook (sendMessage, abort, isStreaming) wiring user text → API → Zustand
  - ChatInput component (auto-expanding textarea, Send/Stop toggle)
  - streamChat AbortSignal support (signal?: AbortSignal, AbortError → onDone)
  - sessionStore.setThreadTitle action

affects:
  - 03-03: MessageList renders from store state populated by useStreamingChat
  - 03-04: ThreadView integrates ChatInput + useStreamingChat
  - 03-05: MarkdownRenderer renders AI message content accumulated by accRef pattern

tech-stack:
  added: []
  patterns:
    - "accRef accumulator pattern: useRef('') reset each sendMessage, += chunk, prevents content bleed between messages"
    - "messageIds snapshot before addMessage: capture thread.messageIds BEFORE any store mutations to build clean history"
    - "AbortController ref pattern: abortRef.current = controller.abort bound before await, cleared in finally"
    - "isStreaming derived from store: activeThread.messageIds.some(id => messages[id]?.isStreaming)"

key-files:
  created:
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/src/components/input/ChatInput.tsx
  modified:
    - frontend/src/api/chat.ts
    - frontend/src/store/sessionStore.ts
    - frontend/tests/unit/useStreamingChat.test.ts
    - frontend/tests/unit/api.chat.test.ts
    - frontend/tests/unit/sessionStore.test.ts

key-decisions:
  - "AbortError detection uses both err.name === 'AbortError' AND DOMException code 20 — jsdom test environment uses DOMException which may not satisfy instanceof Error"
  - "messageIds snapshot taken before addMessage calls — prevents history double-counting when mock mutates thread.messageIds synchronously"
  - "setThreadTitle called after addMessage(userMsg) — title reflects actual submitted text, not pre-trim"
  - "Test split across 3 files: AbortSignal tests in api.chat.test.ts, setThreadTitle in sessionStore.test.ts, hook tests in useStreamingChat.test.ts — vi.mock hoisting prevents mixing real and mocked imports in same file"

patterns-established:
  - "Hook returns plain object { sendMessage, abort, isStreaming } — no context provider needed"
  - "ChatInput is dumb: props only (onSend, onStop, isStreaming) — no store coupling in component"

requirements-completed: [CHAT-01, CHAT-03, CHAT-04, CHAT-06]

duration: 6min
completed: 2026-03-09
---

# Phase 03 Plan 02: Chat Input + Streaming Hook Summary

**SSE streaming hook (useStreamingChat) and ChatInput component with accRef accumulator, AbortController abort, and setThreadTitle on first message**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-09T10:15:00Z
- **Completed:** 2026-03-09T10:21:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `useStreamingChat` hook implements the full streaming data flow: user text → Zustand store (user msg + AI placeholder) → streamChat SSE → accRef chunk accumulation → store update → streaming cleanup
- `ChatInput` component: auto-expanding textarea (1–4 rows via scrollHeight), Send/Stop toggle button, disabled + opacity-50 during streaming, Enter = newline
- `streamChat` in `chat.ts` extended with `signal?: AbortSignal` — AbortError treated as clean stop (onDone, not onError) using dual detection (Error name + DOMException code 20)
- `setThreadTitle` action added to sessionStore interface and implementation
- 10 new passing tests (7 hook + 2 AbortSignal + 1 setThreadTitle); all 38 unit tests pass

## Task Commits

1. **Task 1: Add AbortSignal to chat.ts + setThreadTitle to store** - `82322ac` (feat)
2. **Task 2: Implement useStreamingChat hook + ChatInput component** - `fb73d78` (feat)

## Files Created/Modified

- `frontend/src/hooks/useStreamingChat.ts` — Created: sendMessage, abort, isStreaming hook
- `frontend/src/components/input/ChatInput.tsx` — Created: auto-expanding textarea + Send/Stop button
- `frontend/src/api/chat.ts` — Modified: AbortSignal parameter, AbortError catch
- `frontend/src/store/sessionStore.ts` — Modified: setThreadTitle interface + implementation
- `frontend/tests/unit/useStreamingChat.test.ts` — Rewrote: 7 real hook tests (replaced todo stubs)
- `frontend/tests/unit/api.chat.test.ts` — Extended: 2 AbortSignal tests added
- `frontend/tests/unit/sessionStore.test.ts` — Extended: 1 setThreadTitle test added

## Decisions Made

- **AbortError dual detection:** `err.name === 'AbortError' || (err instanceof DOMException && err.code === 20)` — jsdom's DOMException may not satisfy `instanceof Error`, so checking both prevents AbortError being re-thrown as unhandled
- **messageIds snapshot pattern:** The hook captures `[...activeThread.messageIds]` before any `addMessage` calls. In tests with synchronous mock mutations this is critical for correct history construction; in production Zustand sets new state objects so the reference is safe either way
- **Test file separation:** `vi.mock` is hoisted and module-level in Vitest — mixing real and mocked imports for the same module in one file breaks tests. AbortSignal tests (real streamChat) and setThreadTitle tests (real store) were moved to their respective test files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DOMException AbortError not caught by `instanceof Error` check alone**

- **Found during:** Task 1 (AbortSignal implementation)
- **Issue:** `err instanceof Error && err.name === 'AbortError'` fails in jsdom — `DOMException` is not a subclass of `Error` in all environments
- **Fix:** Added `|| (err instanceof DOMException && (err.name === 'AbortError' || err.code === 20))` to catch clause
- **Files modified:** `frontend/src/api/chat.ts`
- **Verification:** Test "treats AbortError as clean stop" passes
- **Committed in:** `82322ac` (Task 1 commit)

**2. [Rule 1 - Bug] History double-counting when messageIds mutated before streamChat call**

- **Found during:** Task 2 (history context test)
- **Issue:** Mock's `addMessage` mutated `thread.messageIds` synchronously — hook read the already-mutated array to build history, resulting in 5 messages instead of 3
- **Fix:** Snapshot `existingMessageIds = [...activeThread.messageIds]` BEFORE calling `addMessage` for user/AI messages
- **Files modified:** `frontend/src/hooks/useStreamingChat.ts`
- **Verification:** "sendMessage passes full thread message history" test expects 3 messages, now passes
- **Committed in:** `fb73d78` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both necessary for correctness. The snapshot pattern is also a better design for production (immune to future Zustand behavior changes). No scope creep.

## Issues Encountered

- `vi.mock` hoisting in Vitest prevented mixing real and mocked module tests in `useStreamingChat.test.ts`. AbortSignal tests (needing real `streamChat`) and `setThreadTitle` test (needing real store) were moved to their dedicated test files. This is the correct structure — each test file tests one module.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Store is ready: user messages, AI messages with streaming state, thread titles all flow correctly
- `useStreamingChat` hook ready to be integrated into ThreadView (Plan 03-04)
- `ChatInput` component ready to mount in ThreadView
- Plan 03-03 (MessageList/MarkdownRenderer) can now render from store data populated by this hook

---
*Phase: 03-core-thread-ui*
*Completed: 2026-03-09*
