---
phase: quick-4
plan: 01
subsystem: backend-gemini, frontend-store, frontend-components
tags: [bug-fix, responsive, gemini, summarize, compact, action-bubble, mobile]
key-files:
  modified:
    - backend/src/providers/gemini.ts
    - backend/src/routes/simplify.ts
    - frontend/src/api/simplify.ts
    - frontend/src/store/sessionStore.ts
    - frontend/src/components/branching/ActionBubble.tsx
    - frontend/src/components/layout/SpineStrip.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/layout/AncestorPeekPanel.tsx
    - frontend/tests/unit/ActionBubble.test.tsx
decisions:
  - "Summarize/compact reuse /api/simplify with mode=simpler — no new backend route needed"
  - "ActionBubble dismiss deferred via setTimeout(0) to let browser finalize selection state"
  - "GutterColumn uses inline window.innerWidth check (not a hook) for mobile pill sizing"
  - "AppShell wraps AncestorPeekPanel in hidden sm:block div — panels invisible on mobile without changing component internals"
  - "ActionBubble test updated to use vi.useFakeTimers() + act(vi.runAllTimers()) for deferred dismiss assertion"
---

# Quick Task 4: Fix 4 Bugs (Gemini Model Iteration, Summarize/Compact, Text Selection Bubble, Mobile Responsive)

**One-liner:** Fixed Gemini model hammering (5→2 models + 1s delays), implemented real summarize/compact via /api/simplify, guarded ActionBubble dismiss with selection check, and added responsive classes for mobile layouts.

## Files Changed and What Was Fixed

### backend/src/providers/gemini.ts
- Reduced `FREE_TIER_MODELS` from 5 entries to 2 (`gemini-2.0-flash`, `gemini-2.0-flash-lite`)
- Added `await new Promise(resolve => setTimeout(resolve, 1000))` between model retry attempts in all 3 methods: `streamChat()`, `simplify()`, `generateCitationNote()`

### backend/src/routes/simplify.ts
- Changed catch-block error message from `'AI provider request failed'` to `'AI is temporarily overloaded. Please try again in a moment.'` for user-readable error display in SimplificationBlock

### frontend/src/api/simplify.ts
- Added exported `summarizeMessages()` function that calls `/api/simplify` with `mode: 'simpler'` — used by store actions for summarize/compact

### frontend/src/store/sessionStore.ts
- Updated `summarizeThread` and `compactThread` interface signatures to accept `getToken: () => Promise<string | null>` and return `Promise<void>`
- Implemented `summarizeThread`: collects all thread messages, formats as `[User]/[AI]` pairs, calls `summarizeMessages`, replaces `messageIds` with a single summary message
- Implemented `compactThread`: same logic but keeps the last 3 messages, only summarizes the older ones

### frontend/src/components/branching/ActionBubble.tsx
- Updated `handleMouseDown` to wrap `onDismiss()` in `setTimeout(0)` with a `window.getSelection().isCollapsed` check — dismisses only when selection is collapsed (plain click), preserves bubble when user is re-selecting text

### frontend/src/components/layout/SpineStrip.tsx
- Changed width class from `w-7` to `w-5 sm:w-7` — narrower on mobile

### frontend/src/components/thread/ThreadView.tsx
- Changed `pr-[200px]` to `pr-[120px] sm:pr-[200px]` for child-thread right padding — 120px on mobile, 200px on sm+
- Updated `onSummarize` and `onCompact` GutterColumn props to wrap store actions with `getToken`

### frontend/src/components/branching/GutterColumn.tsx
- Added `isMobile` check (`window.innerWidth < 640`) inside `LeadPill` at render time
- `pillWidth`: 120 on mobile, 184 on sm+; `pillRight`: 4 on mobile, 8 on sm+
- `LeadPill` button uses `bg-white/90` on mobile, `bg-white` on desktop

### frontend/src/components/layout/AppShell.tsx
- Added `useAuth` import and `const { getToken } = useAuth()` inside component
- Wrapped each `AncestorPeekPanel` in `<div className="hidden sm:block flex-shrink-0" style={{ width: w }}>` — panels hidden on mobile
- Updated `onSummarize`/`onCompact` to wrap store actions with `getToken`

### frontend/src/components/layout/AncestorPeekPanel.tsx
- Root div: `bg-slate-50` → `bg-slate-50/80 sm:bg-slate-50` (slightly transparent on mobile)
- Border: `3px` → `${width < 100 ? 2 : 3}px` — thinner accent border for narrow panels

### frontend/tests/unit/ActionBubble.test.tsx (deviation — test fix)
- Added `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`
- Updated `'calls onDismiss when clicking outside the bubble'` test to call `act(() => { vi.runAllTimers(); })` after firing mousedown, so the setTimeout(0) callback runs before assertion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ActionBubble test broke due to deferred dismiss timing**
- **Found during:** Task 2 verification (full test suite run)
- **Issue:** Existing test `'calls onDismiss when clicking outside the bubble'` asserted `onDismiss` was called synchronously after `fireEvent.mouseDown`. The fix wraps `onDismiss` in `setTimeout(0)`, making it asynchronous.
- **Fix:** Updated test to use `vi.useFakeTimers()` and advance timers with `act(() => { vi.runAllTimers(); })` before assertion.
- **Files modified:** `frontend/tests/unit/ActionBubble.test.tsx`
- **Commit:** `abe22e72`

## Verification Results

### TypeScript
- Backend: `npx tsc --noEmit` — zero errors
- Frontend: `npx tsc --noEmit` — zero errors

### Tests
- 152 unit tests pass, 0 failures
- 6 E2E test files fail — pre-existing behavior (no running server in test environment, unrelated to these changes)

### Commits
- `96e15de9`: fix(quick-4-01): fix Gemini model iteration and implement summarize/compact
- `ef10b00a`: fix(quick-4-01): fix ActionBubble dismissing prematurely on selection adjust
- `3e51b2a8`: fix(quick-4-01): make branch/thread visuals responsive on mobile
- `abe22e72`: fix(quick-4-01): update ActionBubble test for async dismiss timing

## Self-Check: PASSED

All modified files verified present. All 4 task commits verified in git log.
