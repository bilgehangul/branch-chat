---
phase: quick-26
plan: "01"
subsystem: settings
tags: [byok, model-selection, bug-fix, type-safety]
dependency_graph:
  requires: []
  provides: [byok-model-auto-selection]
  affects: [frontend/src/contexts/SettingsContext.tsx, frontend/src/components/settings/SettingsModal.tsx, backend/src/routes/chat.ts]
tech_stack:
  added: [frontend/src/constants/models.ts]
  patterns: [shared-constants, auto-default-selection]
key_files:
  created:
    - frontend/src/constants/models.ts
  modified:
    - frontend/src/contexts/SettingsContext.tsx
    - frontend/src/components/settings/SettingsModal.tsx
    - backend/src/routes/chat.ts
decisions:
  - MODEL_LISTS extracted to frontend/src/constants/models.ts (not exported from SettingsModal) to avoid context importing from a component
  - saveByokSettings uses modelToSave = state.byokModel ?? MODEL_LISTS[provider][0].id so existing explicit selections are preserved
metrics:
  duration: "~10 minutes"
  completed: "2026-03-14T15:52:28Z"
  tasks: 2
  files: 4
---

# Quick Task 26: Fix Model Selection Not Applying When Saving BYOK Key

**One-liner:** `saveByokSettings` now auto-selects the first provider model when `byokModel` is null, ensuring `byokCredentials` in `useStreamingChat` is always truthy after a BYOK save.

## What Was Done

### Task 1: Auto-select first model on BYOK save (165e695a)

Root cause: `setByokProvider` clears `byokModel` to `null`. When the user goes through the add-key flow, `byokModel` is never restored before `saveByokSettings` runs. This left `tier='byok'` but `byokModel=null`, causing `byokCredentials` in `useStreamingChat` to evaluate as `undefined` (all four fields must be truthy), falling back silently to the free-tier Gemini provider.

Fix:
- Created `frontend/src/constants/models.ts` — canonical `MODEL_LISTS` record (same data that was inline in `SettingsModal.tsx`)
- Imported `MODEL_LISTS` in `SettingsContext.tsx`
- In `saveByokSettings`: `const modelToSave = state.byokModel ?? MODEL_LISTS[provider]?.[0]?.id ?? null;`
- `settingsData.byokModel` and the `setState` call both use `modelToSave`
- `SettingsModal.tsx` now imports `MODEL_LISTS` from the constants file (duplicate removed)

### Task 2: Add 'anthropic' to byok.provider type cast in chat.ts (cca9a7d4)

`createByokProvider(byok.provider as 'gemini' | 'openai', ...)` was missing `'anthropic'`. Updated to `'gemini' | 'openai' | 'anthropic'` to match the actual function signature and prevent future confusion.

## Deviations from Plan

None - plan executed exactly as written. Chose the `constants/models.ts` approach (alternative mentioned in plan) over direct import from SettingsModal for cleaner architectural direction (context should not import from components).

## Verification

- Frontend TypeScript: clean (no output from `npx tsc --noEmit`)
- Backend TypeScript: clean (no output from `npx tsc --noEmit`)

## Self-Check: PASSED

- `frontend/src/constants/models.ts`: FOUND
- `frontend/src/contexts/SettingsContext.tsx`: FOUND (modified)
- `frontend/src/components/settings/SettingsModal.tsx`: FOUND (modified)
- `backend/src/routes/chat.ts`: FOUND (modified)
- Commit 165e695a: FOUND
- Commit cca9a7d4: FOUND
