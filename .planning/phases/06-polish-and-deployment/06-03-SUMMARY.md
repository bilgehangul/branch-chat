---
phase: 06-polish-and-deployment
plan: "03"
subsystem: ui
tags: [react, error-states, banners, rate-limiting, streaming, custom-events]

# Dependency graph
requires:
  - phase: 06-01-polish-and-deployment
    provides: Playwright scaffold stubs
  - phase: 03-core-thread-ui
    provides: useStreamingChat, ChatInput, AppShell, api/chat.ts, api/client.ts
provides:
  - NetworkBanner: fixed top banner on navigator.onLine=false, auto-dismisses on reconnect
  - AuthExpiredBanner: fixed top banner on 401, dismisses to reload via auth-expired custom event
  - RateLimitBanner: inline banner above ChatInput showing minutes remaining on HTTP 429
  - Mid-stream failure UI: partial text stays visible with Retry button when stream fails
  - api/client.ts 401 handling: dispatches global 'auth-expired' CustomEvent
  - api/chat.ts 429 handling: optional onRateLimit callback with epoch reset time
  - useStreamingChat: exposes rateLimitMinutes and streamError state
affects: [06-05-e2e-specs, 06-06-deployment-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Global custom event pattern for decoupled 401 signaling (api layer → UI layer)
    - Optional callback parameter pattern for new error handling paths in existing streaming API
    - Inline banner slot pattern: error banners rendered above ChatInput in same container

key-files:
  created:
    - frontend/src/components/ui/NetworkBanner.tsx
    - frontend/src/components/ui/AuthExpiredBanner.tsx
    - frontend/src/components/ui/RateLimitBanner.tsx
  modified:
    - frontend/src/api/client.ts
    - frontend/src/api/chat.ts
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/src/components/input/ChatInput.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/thread/ThreadView.tsx

key-decisions:
  - "auth-expired custom event dispatched from api/client.ts on 401 — decouples API layer from React component tree; AuthExpiredBanner subscribes via window.addEventListener"
  - "onRateLimit is optional callback on streamChat (not onError extension) — preserves backward compat and separates 429 semantics from generic error handling"
  - "rateLimitMinutes computed from epoch reset time in useStreamingChat return — component receives ready-to-display value, not raw epoch"
  - "streamError.retry is a closure over original text string — retry replays sendMessage(text) without requiring caller to re-supply arguments"
  - "Mid-stream error does NOT clear partial content from store — partial AI response stays visible; only streaming flag is cleared and streamError is set"

patterns-established:
  - "Global event bus pattern: window.dispatchEvent(new CustomEvent('auth-expired')) in API layer; window.addEventListener in UI component — no prop drilling, no Zustand for transient auth state"
  - "Optional streaming callback: onRateLimit?(resetEpochMs: number) => void added to streamChat signature without breaking existing callers"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 6 Plan 03: Error States Summary

**Four blocking error scenarios wired end-to-end: network offline banner, auth expiry banner (via custom event on 401), rate limit banner with countdown above ChatInput, and mid-stream failure with Retry button preserving partial content**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T21:07:12Z
- **Completed:** 2026-03-09T21:15:00Z
- **Tasks:** 2
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- Created 3 new banner components covering all four error scenarios the plan specified
- Wired 401 detection in api/client.ts via decoupled custom event — AuthExpiredBanner subscribes without any prop threading
- Extended streamChat with optional onRateLimit callback and RateLimit-Reset header parsing; useStreamingChat now surfaces rateLimitMinutes and streamError to callers
- ChatInput renders both inline error states (rate limit banner + mid-stream retry) and disables textarea/send button when rate limited

## Task Commits

1. **Task 1: NetworkBanner, AuthExpiredBanner, and 401 dispatch in api/client.ts** - `a543aa59` (feat)
2. **Task 2: RateLimitBanner, mid-stream error state, and ChatInput wiring** - `cb941536` (feat)

## Files Created/Modified

- `frontend/src/components/ui/NetworkBanner.tsx` - Fixed top banner listening to window online/offline events; auto-dismisses when connection restores
- `frontend/src/components/ui/AuthExpiredBanner.tsx` - Fixed top banner listening for 'auth-expired' custom event; sign-in link triggers page reload
- `frontend/src/components/ui/RateLimitBanner.tsx` - Inline amber banner above ChatInput showing minutes remaining from rate limit reset time
- `frontend/src/api/client.ts` - Added 401 guard: dispatches 'auth-expired' CustomEvent and returns error ApiResponse before JSON parse
- `frontend/src/api/chat.ts` - Added optional onRateLimit callback; 429 branch reads RateLimit-Reset header, computes epoch ms, calls onRateLimit before onError
- `frontend/src/hooks/useStreamingChat.ts` - Added rateLimitReset and streamError useState; clears both on new send; returns rateLimitMinutes and streamError
- `frontend/src/components/input/ChatInput.tsx` - Added rateLimitMinutes/streamError props; renders RateLimitBanner and mid-stream error div with Retry; disables input when rate limited
- `frontend/src/components/layout/AppShell.tsx` - Added NetworkBanner and AuthExpiredBanner as fixed-position children of root div
- `frontend/src/components/thread/ThreadView.tsx` - Destructures rateLimitMinutes/streamError from useStreamingChat; passes both to ChatInput

## Decisions Made

- Global custom event pattern chosen for 401 signaling — api/client.ts dispatches `new CustomEvent('auth-expired')` and AuthExpiredBanner subscribes via `window.addEventListener`. No prop drilling through AppShell, no Zustand for transient auth state.
- `onRateLimit` added as optional parameter to `streamChat` (not modifying `onError` signature) — backward compatible; existing callers (tests) unaffected.
- `rateLimitMinutes` computed in the hook return rather than the component — component receives display-ready integer, not raw epoch milliseconds.
- Mid-stream error preserves partial content in store — `store.setMessageStreaming(aiMsgId, false)` without clearing content; streamError drives Retry UI separately.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all 152 unit tests pass before and after changes. The 6 vitest failures noted in verification are pre-existing Playwright e2e spec files being picked up by vitest configuration (unrelated to this plan).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 error states are built and wired; 06-05 E2E specs can test them via page-level network interception (Playwright route mocking)
- Rate limit reset time relies on `RateLimit-Reset` header (epoch seconds) from backend `express-rate-limit` draft-7 headers — backend already configured correctly in Phase 1
- AppShell banners are fixed-position at `top-12` to sit below the 12-unit header; adjust if header height changes in 06-02 theme work

---
*Phase: 06-polish-and-deployment*
*Completed: 2026-03-09*
