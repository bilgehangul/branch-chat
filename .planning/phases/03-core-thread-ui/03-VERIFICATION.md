---
phase: 03-core-thread-ui
verified: 2026-03-09T11:30:00Z
status: gaps_found
score: 12/13 must-haves verified
gaps:
  - truth: "AI message history is passed correctly to the API (multi-turn conversation context)"
    status: partial
    reason: "One test fails: useStreamingChat maps 'assistant' role to 'model' for the Gemini backend (correct for production), but the test at useStreamingChat.test.ts:228 expects the role to remain 'assistant'. This is a test-expectation mismatch — the hook behavior is correct (backend enforces role:'model'), but the suite is not green."
    artifacts:
      - path: "frontend/tests/unit/useStreamingChat.test.ts"
        issue: "Line 228 expects role:'assistant' in the history passed to streamChat, but useStreamingChat.ts:72 correctly maps 'assistant' -> 'model' to satisfy backend validation (chat.ts route rejects non-'model' role with 400). Test assertion is wrong."
    missing:
      - "Fix test expectation at useStreamingChat.test.ts:228 — change { role: 'assistant', content: 'Previous answer' } to { role: 'model', content: 'Previous answer' }"
human_verification:
  - test: "Streaming token-by-token delivery"
    expected: "Typing dots appear, then tokens stream in character-by-character; blinking underscore visible during stream"
    why_human: "Animation timing and visual streaming behavior cannot be verified programmatically"
  - test: "Stop button mid-stream"
    expected: "Clicking Stop halts the SSE stream immediately, partial content is preserved, Send button returns"
    why_human: "Real network abort behavior requires browser and live Gemini connection"
  - test: "Auto-scroll behavior"
    expected: "Auto-scroll follows new tokens; stops following when user scrolls up; resumes if user scrolls back to bottom"
    why_human: "Scroll tracking requires real DOM layout, scrollHeight/clientHeight not available in jsdom"
  - test: "200ms slide-left transition animation"
    expected: "When navigating to an ancestor, content slides in from the left over 200ms ease-out"
    why_human: "CSS transition timing requires browser rendering pipeline"
---

# Phase 3: Core Thread UI Verification Report

**Phase Goal:** Users can have a complete multi-turn conversation in the root thread with streaming AI responses, and all navigation chrome is present (even if non-functional beyond root)
**Verified:** 2026-03-09T11:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can type a message and submit it; user message and AI placeholder both appear in the store | VERIFIED | useStreamingChat.ts creates user msg + aiMsg with isStreaming:true, addMessage called for both |
| 2 | AI message content accumulates chunk-by-chunk via accRef (not raw chunk assignment) | VERIFIED | useStreamingChat.ts:85 — `accRef.current += chunk; updateMessage(aiMsgId, { content: accRef.current })` |
| 3 | Stop button aborts the stream and re-enables input | VERIFIED | ChatInput renders 'Stop' when isStreaming; onClick calls onStop->abort(); abort() calls abortRef.current() |
| 4 | Input is disabled and Send changes to Stop while streaming is active | VERIFIED | ChatInput.tsx:49 — textarea `disabled={isStreaming}`; button text: `{isStreaming ? 'Stop' : 'Send'}` |
| 5 | Thread title updates to first 6 words of first user message | VERIFIED | useStreamingChat.ts:49-52 — isFirstMessage check + setThreadTitle(activeThreadId, text.split(' ').slice(0,6).join(' ')) |
| 6 | AI response text renders as GFM Markdown with syntax-highlighted code blocks | VERIFIED | MarkdownRenderer.tsx uses react-markdown + remark-gfm + Prism light build; 6 real tests pass |
| 7 | Streaming message is ~80% opacity with user-select-none | VERIFIED | MessageBlock.tsx:7 — `streamingClasses = message.isStreaming ? 'opacity-80 select-none pointer-events-none' : ''` |
| 8 | Child thread context card shows anchor text | VERIFIED | ContextCard.tsx — renders only when depth >= 1 && anchorText != null; 5 tests pass |
| 9 | Messages render in messageIds order with correct composition | VERIFIED | MessageList.tsx renders ContextCard + MessageBlock[] from ordered messages array |
| 10 | Scroll position saved when navigating away, restored on return | VERIFIED | ThreadView.tsx — prevActiveThreadIdRef + setScrollPosition on change; requestAnimationFrame restore on activeThreadId change |
| 11 | 200ms slide-left CSS transition on thread navigation | VERIFIED | ThreadView.tsx:44-45 — isTransitioning state, setTimeout 200ms; div with `transition-transform duration-200 ease-out` |
| 12 | Breadcrumb bar shows full thread path; ancestors clickable; middle crumbs collapse to ellipsis | VERIFIED | BreadcrumbBar.tsx — selectThreadAncestry, ancestry.length > 3 collapse, dropdown; 6 tests pass |
| 13 | Left spine strip 28px wide, visible at depth >= 1, shows parent title and accentColor border | VERIFIED | SpineStrip.tsx — returns null at depth 0; renders 28px strip with borderLeft accentColor + vertical rotated title; 5 tests pass |
| 14 | createSession(userId) called when user signs in | VERIFIED | App.tsx:29-33 — useEffect with isSignedIn && userId && !session guard |
| 15 | Multi-turn conversation history passed correctly to API | PARTIAL | Hook sends full history including new user message. BUT: test suite has 1 FAILURE — see gaps below |

**Score: 14/15 truths verified (1 partial)**

---

## Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `frontend/tests/unit/useStreamingChat.test.ts` | 03-01 | PARTIAL | Exists, substantive (7+ real tests). 1 test FAILS: role assertion mismatch. |
| `frontend/tests/unit/MarkdownRenderer.test.tsx` | 03-01 | VERIFIED | Exists, 6 real tests, all pass |
| `frontend/tests/unit/MessageBlock.test.tsx` | 03-01 | VERIFIED | Exists, 8 real tests, all pass |
| `frontend/tests/unit/ContextCard.test.tsx` | 03-01 | VERIFIED | Exists, 5 real tests, all pass |
| `frontend/tests/unit/BreadcrumbBar.test.tsx` | 03-01 | VERIFIED | Exists, 6 real tests, all pass |
| `frontend/tests/unit/SpineStrip.test.tsx` | 03-01 | VERIFIED | Exists, 5 real tests, all pass |
| `frontend/tests/unit/ThreadView.test.tsx` | 03-01 | VERIFIED | Exists, 3 test.todo stubs (intentional — mocking complexity) |
| `frontend/src/api/chat.ts` | 03-02 | VERIFIED | signal?: AbortSignal param present; AbortError caught, onDone() called |
| `frontend/src/store/sessionStore.ts` | 03-02 | VERIFIED | setThreadTitle action in interface and implementation |
| `frontend/src/hooks/useStreamingChat.ts` | 03-02 | VERIFIED | sendMessage, abort, isStreaming exported; accRef pattern; abortRef pattern |
| `frontend/src/components/input/ChatInput.tsx` | 03-02 | VERIFIED | Auto-expanding textarea; Send/Stop toggle; disabled during streaming |
| `frontend/src/components/thread/MarkdownRenderer.tsx` | 03-03 | VERIFIED | Prism light build (default import); 6 languages; React.memo wrap |
| `frontend/src/components/thread/StreamingCursor.tsx` | 03-03 | VERIFIED | Typing dots (bounce-dot) + blinking underscore; inline style keyframes |
| `frontend/src/components/thread/MessageBlock.tsx` | 03-03 | VERIFIED | Role labels You/Gemini; streaming classes; imports MarkdownRenderer + StreamingCursor |
| `frontend/src/components/thread/ContextCard.tsx` | 03-03 | VERIFIED | depth < 1 or anchorText null returns null; accent border via style |
| `frontend/src/components/thread/ThreadView.tsx` | 03-04 | VERIFIED | Scroll container; auto-scroll; slide transition; scroll save/restore; ChatInput wired |
| `frontend/src/components/thread/MessageList.tsx` | 03-04 | VERIFIED | ContextCard + MessageBlock[] composition |
| `frontend/src/App.tsx` | 03-04 | VERIFIED | createSession(userId) in useEffect; separate Zustand selectors |
| `frontend/src/components/layout/AppShell.tsx` | 03-04 | VERIFIED | SpineStrip + BreadcrumbBar + ThreadView all wired; UserButton in header |
| `frontend/src/components/layout/BreadcrumbBar.tsx` | 03-05 | VERIFIED | Full implementation; selectThreadAncestry; setActiveThread on click; collapse; dropdown |
| `frontend/src/components/layout/SpineStrip.tsx` | 03-05 | VERIFIED | Full implementation; setActiveThread(parentThreadId) on click; returns null at depth 0 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useStreamingChat.ts` | `chat.ts` | streamChat with signal in body | WIRED | Line 81-83: `streamChat({ messages: history, signal: controller.signal }, ...)` |
| `useStreamingChat.ts` | `sessionStore.ts` | addMessage, updateMessage, setMessageStreaming, setThreadTitle | WIRED | store.addMessage, store.updateMessage, store.setMessageStreaming, store.setThreadTitle all called |
| `ChatInput.tsx` | `useStreamingChat.ts` | onSend/onStop props | WIRED | ThreadView.tsx wires `onSend={sendMessage} onStop={abort}` |
| `MessageBlock.tsx` | `MarkdownRenderer.tsx` | renders MarkdownRenderer for role=assistant | WIRED | MessageBlock.tsx:21 — `<MarkdownRenderer content={message.content} />` |
| `MessageBlock.tsx` | `StreamingCursor.tsx` | renders StreamingCursor when isStreaming=true | WIRED | MessageBlock.tsx:22-25 — `<StreamingCursor isStreaming={message.isStreaming} hasContent=.../>` |
| `ThreadView.tsx` | `sessionStore.ts` | useSessionStore for messages/threads/activeThreadId/setScrollPosition | WIRED | ThreadView.tsx:16 destructures all four from useSessionStore() |
| `ThreadView.tsx` | `MessageList.tsx` | renders MessageList with sorted messages | WIRED | ThreadView.tsx:116 — `<MessageList messages={orderedMessages} thread={activeThread} />` |
| `App.tsx` | `sessionStore.ts` | createSession(userId) in useEffect | WIRED | App.tsx:29-33 — useEffect with isSignedIn && userId && !session |
| `BreadcrumbBar.tsx` | `selectors.ts` | selectThreadAncestry | WIRED | BreadcrumbBar.tsx:14 — `selectThreadAncestry(threads, activeThreadId)` |
| `BreadcrumbBar.tsx` | `sessionStore.ts` | setActiveThread on ancestor click | WIRED | BreadcrumbBar.tsx:70 — `onClick={() => setActiveThread(thread.id)}` |
| `SpineStrip.tsx` | `sessionStore.ts` | setActiveThread(parentThreadId) on click | WIRED | SpineStrip.tsx:22 — `onClick={() => setActiveThread(currentThread.parentThreadId!)}` |

---

## Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| CHAT-01 | User can type a message and receive a streaming Gemini response | 03-02, 03-04 | SATISFIED | useStreamingChat + ChatInput + ThreadView wired end-to-end; human approved |
| CHAT-02 | AI responses render as Markdown with GFM support | 03-03 | SATISFIED | MarkdownRenderer with react-markdown + remark-gfm + Prism; 6 tests pass |
| CHAT-03 | Follow-up messages continue multi-turn conversation | 03-02 | PARTIAL | Hook builds and passes full history. 1 test FAILS on role assertion ('assistant' vs 'model'). Hook behavior is correct for Gemini API; test expectation is wrong. |
| CHAT-04 | Child threads support multi-turn conversations | 03-02 | SATISFIED | Hook uses activeThreadId generically — works for any thread depth |
| CHAT-05 | Child threads display context card with anchor text | 03-03 | SATISFIED | ContextCard renders at depth >= 1 with anchorText; 5 tests pass |
| CHAT-06 | Text selection disabled while streaming | 03-03 | SATISFIED | MessageBlock applies `select-none pointer-events-none opacity-80` when isStreaming; 8 tests pass |
| NAV-01 | Persistent breadcrumb bar shows full thread path | 03-05 | SATISFIED | BreadcrumbBar renders ancestry chain with chevron separators; 6 tests pass |
| NAV-02 | Ancestor crumbs are clickable, navigate with slide-left | 03-05 | SATISFIED | BreadcrumbBar ancestor buttons call setActiveThread; ThreadView triggers slide transition |
| NAV-03 | Middle crumbs collapse to ellipsis; clicking shows dropdown | 03-05 | SATISFIED | ancestry.length > 3 collapses; dropdown renders collapsedMiddle crumbs |
| NAV-04 | Left spine strip 28px wide, visible at depth >= 1 | 03-05 | SATISFIED | SpineStrip returns null at depth 0; renders 28px strip at depth >= 1; 5 tests pass |
| NAV-05 | Clicking spine navigates to parent thread | 03-05 | SATISFIED | SpineStrip onClick calls setActiveThread(parentThreadId) |
| NAV-06 | Thread navigation uses 200ms ease-out slide transition | 03-04 | SATISFIED | ThreadView isTransitioning state + `transition-transform duration-200 ease-out` class |
| NAV-07 | Returning to parent restores scroll position | 03-04 | SATISFIED | requestAnimationFrame scroll restore on activeThreadId change; scroll save before navigation |

**All 13 requirements have plans claiming them. No orphaned requirements.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `useStreamingChat.ts` | 54 | Comment: "Add empty AI placeholder message" | Info | Normal inline comment, not a stub — full implementation present |
| `ChatInput.tsx` | 48 | `placeholder="Ask anything..."` | Info | Correct HTML placeholder attribute — not a code stub |
| None | — | No return null / return {} stubs in production components | — | All stubs from Plan 03-04 were replaced by full implementations in 03-05 |

No blocker or warning anti-patterns found. The `useStreamingChat.ts` code comment on line 54 is a legitimate descriptive comment, not a TODO placeholder.

---

## Test Suite Results

**Run command:** `cd frontend && npx vitest run tests/unit/ --reporter=verbose`

| Result | Count |
|--------|-------|
| Passed | 67 |
| Failed | 1 |
| Todo (planned stubs) | 3 |
| Skipped | 0 |

**Failing test:** `useStreamingChat > sendMessage passes full thread message history to streamChat`

**Root cause:** The hook maps `role: 'assistant'` to `role: 'model'` before passing history to `streamChat` (correct behavior — backend validates `role === 'user' || role === 'model'` and rejects 'assistant' with 400). The test expects `role: 'assistant'` to pass through unchanged. This is a wrong test expectation, not a wrong implementation.

**Fix:** In `frontend/tests/unit/useStreamingChat.test.ts` line 228, change:
```
expect(body.messages[1]).toEqual({ role: 'assistant', content: 'Previous answer' });
```
to:
```
expect(body.messages[1]).toEqual({ role: 'model', content: 'Previous answer' });
```

---

## TypeScript Compilation

`npx tsc --noEmit` exits 0 — no type errors.

---

## Human Verification Required

Plan 03-06 included a human verification checkpoint. Per 03-06-SUMMARY.md, the user **APPROVED** on 2026-03-09:

> "Human checkpoint APPROVED: streaming chat token-by-token, GFM Markdown with syntax-highlighted code blocks, multi-turn conversation, Stop button aborting stream, auto-scroll behavior, breadcrumb bar with UserButton, and spine strip all verified working in browser"

The following behaviors remain human-only verifiable but have been approved:

### 1. Streaming token-by-token delivery
**Test:** Start frontend + backend servers. Sign in, send a message.
**Expected:** Typing dots appear immediately, then tokens stream; blinking underscore visible; full opacity returns on completion.
**Why human:** Animation timing and CSS keyframes require real browser rendering.
**Status:** APPROVED by user 2026-03-09

### 2. Stop button mid-stream
**Test:** Send "Write a 1000 word essay on quantum computing", immediately click Stop.
**Expected:** Stream halts, partial content preserved, Send button returns.
**Why human:** Real network abort requires live SSE connection.
**Status:** APPROVED by user 2026-03-09

### 3. Auto-scroll behavior
**Test:** Send a long-response message; scroll up during streaming.
**Expected:** Auto-scroll stops following tokens when user scrolls up; resumes if user returns to bottom.
**Why human:** scrollHeight/clientHeight arithmetic requires real DOM layout.
**Status:** APPROVED by user 2026-03-09

### 4. Slide transition
**Test:** Navigate between threads (Phase 4 will create child threads).
**Expected:** 200ms ease-out slide-left animation visible.
**Why human:** CSS transition timing requires browser rendering pipeline.
**Status:** Verified conceptually; full test requires child thread creation (Phase 4).

---

## Gaps Summary

**1 gap blocking a fully green test suite:**

The test `sendMessage passes full thread message history to streamChat` has a wrong expectation. The hook correctly converts `role: 'assistant'` to `role: 'model'` to satisfy Gemini's API contract (backend validates `role === 'user' || role === 'model'`, confirmed in `backend/src/routes/chat.ts:26`). The test was written with `role: 'assistant'` but the implementation correctly uses `'model'`.

This is a minor test-expectation fix, not a production code defect. The feature works correctly in the browser (human approved). The fix is a single line change in one test file.

**Phase goal achievement assessment:** The phase goal is substantially achieved. All 13 requirements have working implementations, human verification was approved, and TypeScript compiles clean. The single test failure is a test-expectation bug, not a production defect.

---

_Verified: 2026-03-09T11:30:00Z_
_Verifier: Claude (gsd-verifier)_
