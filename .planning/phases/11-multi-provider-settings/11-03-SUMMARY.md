---
phase: 11-multi-provider-settings
plan: "03"
subsystem: frontend-settings
tags: [settings, byok, crypto, modal, focus-trap, context]
dependency_graph:
  requires: ["11-01"]
  provides: ["SettingsContext", "cryptoStorage", "useFocusTrap", "SettingsModal", "FreeTierSection", "ByokSection"]
  affects: ["AppShell", "App", "main.tsx"]
tech_stack:
  added: ["Web Crypto AES-GCM", "createPortal for modal", "useFocusTrap hook"]
  patterns: ["Provider pattern (matching AuthProvider)", "TDD red-green on cryptoStorage+SettingsContext", "Portal rendering at z-[9000]"]
key_files:
  created:
    - frontend/src/utils/cryptoStorage.ts
    - frontend/src/contexts/SettingsContext.tsx
    - frontend/src/hooks/useFocusTrap.ts
    - frontend/src/components/settings/SettingsModal.tsx
    - frontend/src/components/settings/FreeTierSection.tsx
    - frontend/src/components/settings/ByokSection.tsx
    - frontend/src/tests/cryptoStorage.test.ts
    - frontend/src/tests/settingsContext.test.ts
    - frontend/src/tests/settingsModal.test.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/layout/AppShell.tsx
decisions:
  - "SettingsProvider placed in App.tsx (not main.tsx) to access user.sub from AuthContext for crypto keying"
  - "AppInner renamed from App to avoid naming collision; App export becomes thin SettingsProvider wrapper"
  - "isModalOpen renamed isSignInModalOpen in App.tsx to avoid conflict with SettingsContext isModalOpen"
  - "SettingsModal self-renders via portal when isModalOpen=true; no prop drilling needed"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-12"
  tasks_completed: 3
  files_created: 9
  files_modified: 2
  tests_added: 21
---

# Phase 11 Plan 03: Settings Modal Foundation Summary

**One-liner:** AES-GCM encrypted BYOK settings with SettingsContext, focus-trapped modal portal, free-tier label, and collapsible BYOK form with provider selector and key input.

## What Was Built

Settings infrastructure for multi-provider BYOK support: context, crypto utility, focus trap hook, and the full modal UI shell.

### Task 1: cryptoStorage + SettingsContext (TDD)

**cryptoStorage.ts** — AES-GCM encryption keyed to `userId + 'contextdive_byok_v1'`:
- `encryptApiKey(userId, key)`: SHA-256 derives CryptoKey, random 12-byte IV, combines IV+ciphertext, returns base64
- `decryptApiKey(userId, stored)`: base64 decode, split IV/ciphertext, decrypt
- `clearApiKey(userId)`: removes `byok_key_${userId}` from localStorage
- Wrong-user decryption throws (AES-GCM authentication tag fails)

**SettingsContext.tsx** — Provider matching AuthProvider pattern:
- State: `tier`, `byokProvider`, `byokModel`, `byokApiKey` (memory-only), `byokKeyVerified`, `searchProvider`, `isModalOpen`
- Mount useEffect decrypts stored key into memory for signed-in users
- `setByokProvider` resets model and verified on provider switch
- `saveByokSettings` encrypts key + persists JSON settings to localStorage
- `clearByokKey` resets all state to free tier, removes localStorage entries

### Task 2: useFocusTrap + Modal Shell + UI Sections

**useFocusTrap.ts** — ~55 lines, zero external dependencies:
- Queries focusable elements on activation, focuses first one
- Tab/Shift+Tab wrapping at boundaries
- Cleans up event listener on deactivation

**SettingsModal.tsx** — `createPortal(modal, document.body)` at `z-[9000]`:
- Semi-transparent backdrop (`bg-black/50`) with click-to-close
- Escape key closes via useEffect listener
- `useFocusTrap(isModalOpen)` ref on dialog panel
- Contains FreeTierSection and ByokSection

**FreeTierSection.tsx** — Informational label with sparkle icon: "Current Model: Gemini Flash 2.0 (Free)"

**ByokSection.tsx** — Collapsible (collapsed by default, `useState(false)`):
- Provider selector: 3 buttons (Gemini | OpenAI | Anthropic) with active highlighting
- API key input: show/hide toggle with eye/eye-off icons; provider-specific placeholder
- Verify Key button (disabled until key+provider set; wiring deferred to 11-04)
- Model selector (disabled until `byokKeyVerified`; wiring deferred to 11-04)
- Search provider dropdown (visible only for OpenAI provider)
- Save Settings button (disabled until verified)
- "Clear Key & Reset to Free" button (visible only when `tier === 'byok'`)

### Task 3: App Wiring

**App.tsx** refactored:
- `AppInner` (renamed from `App`) contains all existing logic
- `App` export wraps `<SettingsProvider userId={user?.sub ?? null}><SettingsModal /><AppInner /></SettingsProvider>`
- `isModalOpen` renamed to `isSignInModalOpen` to avoid SettingsContext name conflict

**AppShell.tsx** — Gear icon button added between ThemeToggle and user name area:
- `aria-label="Open settings"`, `onClick={openSettings}` from `useSettings()`
- Full gear SVG path, focus-visible ring pattern

## Tests

| File | Tests | Coverage |
|------|-------|----------|
| cryptoStorage.test.ts | 5 | Round-trip, different-user isolation, random IV, clearApiKey |
| settingsContext.test.ts | 7 | Defaults, openModal, closeModal, setByokProvider reset, setByokApiKey memory-only, clearByokKey |
| settingsModal.test.tsx | 9 | Gear icon, open, backdrop close, Escape close, heading, free-tier label, BYOK collapsed, expand BYOK, close button |
| **Total** | **21** | |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SettingsProvider placed in App.tsx not main.tsx**
- **Found during:** Task 3
- **Issue:** main.tsx has no access to AuthContext user.sub, which is required for the mount useEffect to decrypt stored keys on sign-in
- **Fix:** Placed SettingsProvider in App.tsx after `useAuth()` call, wrapping both AppInner and SettingsModal; renamed inner function to AppInner to preserve clean App export
- **Files modified:** frontend/src/App.tsx
- **Commit:** 3d2fbac6

**2. [Rule 1 - Bug] isModalOpen naming conflict in App.tsx**
- **Found during:** Task 3
- **Issue:** App.tsx already used `isModalOpen` for the sign-in modal state variable, which would shadow SettingsContext's `isModalOpen`
- **Fix:** Renamed App.tsx local variable to `isSignInModalOpen`
- **Files modified:** frontend/src/App.tsx
- **Commit:** 3d2fbac6

**3. [Rule 1 - Cleanup] Removed dead TestHarness code in settingsModal.test.tsx**
- Dead `TestHarness` function referencing a created context was cleaned up; replaced with direct `GearButton` harness using `useSettings()`
- The test file imported correctly and all 9 tests pass

## Self-Check: PASSED

All 9 created files found on disk. All 3 task commits verified in git log.
