---
phase: 11-multi-provider-settings
plan: "04"
subsystem: frontend-byok-flow
tags: [byok, model-badge, settings, api-injection, sign-out-cleanup, verification-flow]
dependency_graph:
  requires: ["11-02", "11-03"]
  provides: ["ByokSection-wired", "ModelBadge", "BYOK-api-injection", "sign-out-key-cleanup"]
  affects: ["ChatInput", "useStreamingChat", "AuthContext", "chat.ts"]
tech_stack:
  added: ["fetch POST /api/verify-key", "AES-GCM sign-out cleanup"]
  patterns: ["Inline verification feedback (no toast)", "Masked key display (****...last4)", "BYOK credentials per-request injection"]
key_files:
  created:
    - frontend/src/components/input/ModelBadge.tsx
  modified:
    - frontend/src/components/settings/ByokSection.tsx
    - frontend/src/components/input/ChatInput.tsx
    - frontend/src/api/chat.ts
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/tests/settingsModal.test.tsx
decisions:
  - "ByokSection calls useAuth() directly for getToken/user — AuthProvider added to test harness"
  - "Key masked to ****...last4 in input after save; clears to empty on focus so user can re-enter"
  - "ByokCredentials injected via spread in streamChat body — zero-cost when tier=free"
  - "AuthContext signOut removes both byok_key_{userId} and byok_settings_{userId} from localStorage"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-12"
  tasks_completed: 2
  tasks_pending: 1
  files_created: 1
  files_modified: 6
  tests_added: 0
  tests_modified: 1
---

# Phase 11 Plan 04: BYOK Flow Wiring Summary

**One-liner:** End-to-end BYOK flow — verify key against backend, curated model selection, masked key display, ModelBadge in ChatInput, BYOK credentials injected per-request, sign-out clears encrypted key.

## What Was Built

### Task 1: ByokSection Verification, Model Selection, Save, and Clear

**ByokSection.tsx** fully wired with interactive flows:

- **Verify Key** (PROV-06): `POST /api/verify-key` with `{ provider, apiKey }` and auth header. Spinner during request. Inline green checkmark + "Key verified" on success; inline red error message on failure. Key stays in input on failure for correction.
- **Model selector** (PROV-07): Enabled only after `byokKeyVerified === true`. Provider-specific curated lists:
  - Gemini: Flash 2.0, Flash 2.0 Lite, Pro 2.5
  - OpenAI: GPT-4o, GPT-4o Mini
  - Anthropic: Claude Sonnet 4, Claude Haiku
- **Key masking** (PROV-15): After save, input shows `****...last4`. Clearing on focus prompts re-entry and resets verified state.
- **Save Settings**: Enabled when key verified AND model selected. Calls `saveByokSettings(userId)`, shows "Saved!" briefly, then closes modal.
- **Clear Key & Reset to Free** (PROV-09): Only visible when `tier === 'byok'`. Click reveals inline confirmation dialog ("Are you sure? This will remove your API key...") with Yes/Cancel buttons. On confirm: `clearByokKey(userId)`.
- **Search provider dropdown** (PROV-08): Visible only when `byokProvider === 'openai'`. Options: Tavily (default) / OpenAI Web Search.

### Task 2: ModelBadge, API Injection, Sign-Out Cleanup

**ModelBadge.tsx** (PROV-10, PROV-11):
- Always visible pill badge above textarea in ChatInput
- Free tier: sparkle/star icon + "Gemini Flash"
- BYOK: key icon + provider icon (sparkle/circle/A) + model display name
- `onClick={() => openModal()}` — clickable to open Settings
- `aria-label="Active model: {name}. Click to open settings"`

**ChatInput.tsx**: ModelBadge row rendered above the input area via a `px-3 pt-2 pb-0` div.

**chat.ts**: `ByokCredentials` type exported; optional `byok?: ByokCredentials` field in `streamChat` body. Included in request body with `...(body.byok ? { byok: body.byok } : {})`.

**useStreamingChat.ts**: Reads `tier, byokProvider, byokModel, byokApiKey` from `useSettings()`. When `tier === 'byok'` and all three values present, builds `byokCredentials` and passes to `streamChat`. Free tier makes no change to existing behavior.

**AuthContext.tsx** (PROV-14): `signOut()` calls `clearApiKey(user.sub)` and removes `byok_settings_{userId}` from localStorage before clearing the auth token. Uses direct import of `clearApiKey` from `cryptoStorage.ts` — no circular dependency.

## Tests

| File | Status | Notes |
|------|--------|-------|
| settingsModal.test.tsx | 9/9 passing | Test harness updated to include AuthProvider (ByokSection now uses useAuth) |
| settingsContext.test.ts | 7/7 passing | No changes needed |
| cryptoStorage.test.ts | 5/5 passing | No changes needed |
| authContext.test.tsx | 4/4 passing | Sign-out cleanup doesn't break existing tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test harness missing AuthProvider**
- **Found during:** Task 1 verification
- **Issue:** ByokSection calls `useAuth()` for `getToken` and `user`, but the existing test harness `TestApp` only wraps with `SettingsProvider`, not `AuthProvider`. All 8 integration tests failed with "useAuth must be used inside AuthProvider".
- **Fix:** Added `AuthProvider` wrapper to `TestApp` in `settingsModal.test.tsx`. Also cleaned up the dead `TestHarness` function with `React.createContext` that was doing nothing.
- **Files modified:** `frontend/src/tests/settingsModal.test.tsx`
- **Commit:** 4353fcad

### Pre-existing Failures (Out of Scope)

Several test files had pre-existing failures unrelated to this plan's changes:
- `app.test.tsx`: "Unable to find Sign in to start your own conversation" — existed before task 1 commit (confirmed via stash check). Likely a text matching issue against the mocked component tree in SettingsProvider context. Logged to deferred items.
- `ancestorRail.test.tsx`, `citationBlock.test.tsx`, `simplificationBlock.test.tsx`: pre-existing failures in unrelated UI components.

These are out of scope per deviation rules.

## Pending

**Task 3 (checkpoint:human-verify):** Awaiting human verification of the complete end-to-end BYOK flow. All automation is complete in Tasks 1-2.

## Self-Check: PARTIAL (pending Task 3)

Tasks 1-2 verified:
- `frontend/src/components/input/ModelBadge.tsx` — CREATED
- `frontend/src/components/settings/ByokSection.tsx` — MODIFIED
- `frontend/src/components/input/ChatInput.tsx` — MODIFIED
- `frontend/src/api/chat.ts` — MODIFIED
- `frontend/src/hooks/useStreamingChat.ts` — MODIFIED
- `frontend/src/contexts/AuthContext.tsx` — MODIFIED
- Commits 4353fcad and fa214465 verified in git log
