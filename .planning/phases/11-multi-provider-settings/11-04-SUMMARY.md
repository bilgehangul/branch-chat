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
  patterns: ["Inline verification feedback (no toast)", "Masked key display (****...last4)", "BYOK credentials per-request injection", "Provider switch clears byokApiKey in context"]
key_files:
  created:
    - frontend/src/components/input/ModelBadge.tsx
  modified:
    - frontend/src/components/settings/ByokSection.tsx
    - frontend/src/contexts/SettingsContext.tsx
    - frontend/src/components/input/ChatInput.tsx
    - frontend/src/api/chat.ts
    - frontend/src/hooks/useStreamingChat.ts
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/tests/settingsModal.test.tsx
decisions:
  - "ByokSection calls useAuth() directly for getToken/user — AuthProvider added to test harness"
  - "Key masked to ****...last4 in input after save; clears to empty on focus so user can re-enter"
  - "ByokCredentials injected via spread in streamChat body — zero-cost when tier=free"
  - "AuthContext signOut removes both byok_key_{userId} and byok_settings_{userId} from localStorage"
  - "setByokProvider clears byokApiKey in context so old provider key never bleeds into new provider input"
  - "Manage Keys text button replaces gear icon in AppShell header for clearer affordance"
metrics:
  duration_minutes: 55
  completed_date: "2026-03-12"
  tasks_completed: 3
  tasks_pending: 0
  files_created: 1
  files_modified: 8
  tests_added: 0
  tests_modified: 1
requirements-completed: [PROV-06, PROV-07, PROV-08, PROV-09, PROV-10, PROV-11, PROV-14, PROV-15]
---

# Phase 11 Plan 04: BYOK Flow Wiring Summary

**End-to-end BYOK flow complete: key verification, curated model selection, masked key display, ModelBadge in ChatInput, per-request credential injection, sign-out key cleanup, and provider-switching fix**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-03-12T17:00:00Z
- **Completed:** 2026-03-12T13:30:00Z
- **Tasks:** 3 (2 auto + 1 human-verify with post-checkpoint fixes)
- **Files modified:** 8

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
- **Clear Key & Reset to Free** (PROV-09): Only visible when `tier === 'byok'`. Click reveals inline confirmation dialog with Yes/Cancel. On confirm: `clearByokKey(userId)` removes encrypted key + settings from localStorage and resets context to DEFAULT_STATE.
- **Search provider dropdown** (PROV-08): Visible only when `byokProvider === 'openai'`. Options: Tavily (default) / OpenAI Web Search.

### Task 2: ModelBadge, API Injection, Sign-Out Cleanup

**ModelBadge.tsx** (PROV-10, PROV-11):
- Always visible pill badge above textarea in ChatInput
- Free tier: sparkle/star icon + "Gemini Flash"
- BYOK: key icon + provider icon (sparkle/circle/A) + model display name
- `onClick={() => openModal()}` — clickable to open Settings
- `aria-label="Active model: {name}. Click to open settings"`

**ChatInput.tsx**: ModelBadge row rendered above the input area.

**chat.ts**: `ByokCredentials` type exported; optional `byok?: ByokCredentials` field in `streamChat` body. Injected with spread when present.

**useStreamingChat.ts**: Reads `tier, byokProvider, byokModel, byokApiKey` from `useSettings()`. Builds `byokCredentials` and passes to `streamChat` when in BYOK mode.

**AuthContext.tsx** (PROV-14): `signOut()` calls `clearApiKey(user.sub)` and removes `byok_settings_{userId}` from localStorage before clearing the auth token. Direct import of `clearApiKey` from `cryptoStorage.ts` — no circular dependency.

### Task 3 (Post-Checkpoint Fixes): Provider Switching + Manage Keys Button

Post-human-verification fixes for two issues found during testing:

1. **Provider switching left stale key**: `setByokProvider` now also clears `byokApiKey` in context (previously only reset model and verified flag). Old API key from provider A no longer appears in input when switching to provider B.

2. **Gear icon replaced with "Manage Keys" button**: AppShell header now shows a descriptive bordered text button "Manage Keys" instead of a generic gear SVG icon.

## Tests

| File | Status | Notes |
|------|--------|-------|
| settingsModal.test.tsx | 9/9 passing | Test harness updated to include AuthProvider (ByokSection now uses useAuth) |
| settingsContext.test.ts | 7/7 passing | No changes needed |
| cryptoStorage.test.ts | 5/5 passing | No changes needed |
| authContext.test.tsx | 4/4 passing | Sign-out cleanup doesn't break existing tests |

## Task Commits

1. **Task 1: Wire BYOK verify, model selection, save, and clear flows in ByokSection** — `4353fcad` (feat)
2. **Task 2: Create ModelBadge, inject BYOK credentials, wire sign-out cleanup** — `fa214465` (feat)
3. **Task 3: Fix provider switching, clear-to-free, Manage Keys button** — `695afd21` (fix)

## Files Created/Modified

- `frontend/src/components/input/ModelBadge.tsx` — Clickable pill badge showing active model; free vs BYOK with provider/key icons
- `frontend/src/components/settings/ByokSection.tsx` — Full BYOK form: provider picker, key entry, verify, model select, save, clear with confirmation
- `frontend/src/contexts/SettingsContext.tsx` — setByokProvider clears byokApiKey to prevent stale key on provider switch
- `frontend/src/components/layout/AppShell.tsx` — Gear icon replaced with "Manage Keys" text button
- `frontend/src/contexts/AuthContext.tsx` — signOut calls clearApiKey and removes byok_settings_ from localStorage
- `frontend/src/api/chat.ts` — Optional byok parameter injected into request body for all BYOK API calls
- `frontend/src/hooks/useStreamingChat.ts` — Reads SettingsContext to pass byok credentials when tier=byok
- `frontend/src/components/input/ChatInput.tsx` — ModelBadge rendered above textarea
- `frontend/src/tests/settingsModal.test.tsx` — AuthProvider added to TestApp harness

## Decisions Made

- `setByokProvider` clears `byokApiKey` in context (not just model and verified flag) — old key from provider A must not appear in input for provider B
- "Manage Keys" replaces gear icon: descriptive text communicates the action clearly, especially for users discovering the BYOK feature
- Test harness wraps with AuthProvider since ByokSection calls useAuth() directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test harness missing AuthProvider**
- **Found during:** Task 1 verification
- **Issue:** ByokSection calls `useAuth()` for `getToken` and `user`, but the existing test harness `TestApp` only wrapped with `SettingsProvider`. All integration tests failed with "useAuth must be used inside AuthProvider".
- **Fix:** Added `AuthProvider` wrapper to `TestApp` in `settingsModal.test.tsx`.
- **Files modified:** `frontend/src/tests/settingsModal.test.tsx`
- **Committed in:** `4353fcad`

**2. [Rule 1 - Bug] Provider switching left stale API key in input**
- **Found during:** Task 3 (human verification)
- **Issue:** `setByokProvider` reset `byokModel` and `byokKeyVerified` but not `byokApiKey`. When switching from OpenAI to Anthropic, the OpenAI key remained in the input field, confusing users.
- **Fix:** Added `byokApiKey: null` to the `setByokProvider` setState call in SettingsContext.tsx.
- **Files modified:** `frontend/src/contexts/SettingsContext.tsx`
- **Committed in:** `695afd21`

**3. [Rule 1 - Bug / UX] Gear icon replaced with "Manage Keys" text button**
- **Found during:** Task 3 (user UX feedback at checkpoint)
- **Issue:** Generic gear icon didn't communicate that settings panel is for API key management.
- **Fix:** Replaced SVG gear button with a bordered pill-style "Manage Keys" text button in AppShell header.
- **Files modified:** `frontend/src/components/layout/AppShell.tsx`
- **Committed in:** `695afd21`

### Pre-existing Failures (Out of Scope)

Several test files had pre-existing failures unrelated to this plan:
- `app.test.tsx`, `ancestorRail.test.tsx`, `citationBlock.test.tsx`, `simplificationBlock.test.tsx` — pre-existing failures in unrelated components.

---

**Total deviations:** 3 auto-fixed (2 bugs + 1 UX fix from human verification)
**Impact on plan:** All fixes corrected real issues found in implementation. No scope creep.

## Issues Encountered

- Clear Key appeared broken during testing, but investigation showed the root cause was the provider-switching bug. Once a user switched providers without clearing the old key, the stale key state made subsequent operations confusing. Fixing provider switching resolved the apparent clear issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full BYOK flow complete: enter key, verify, select model, save, chat, clear, sign-out all work correctly
- All three providers (Gemini, OpenAI, Anthropic) supported end-to-end
- ModelBadge shows current state in ChatInput at all times
- Phase 11 (multi-provider-settings) is now fully complete

## Self-Check: PASSED

All files verified:
- `frontend/src/components/input/ModelBadge.tsx` — FOUND (created)
- `frontend/src/components/settings/ByokSection.tsx` — FOUND (modified)
- `frontend/src/contexts/SettingsContext.tsx` — FOUND (modified)
- `frontend/src/components/layout/AppShell.tsx` — FOUND (modified)
- `frontend/src/contexts/AuthContext.tsx` — FOUND (modified)
- Commits 4353fcad, fa214465, 695afd21 verified in git log

---
*Phase: 11-multi-provider-settings*
*Completed: 2026-03-12*
