---
phase: 06-polish-and-deployment
plan: "02"
subsystem: ui
tags: [react, tailwind, theme, dark-mode, localStorage, context]

# Dependency graph
requires:
  - phase: 02-frontend-foundation
    provides: main.tsx entry point and AppShell layout scaffold
  - phase: 04-branching
    provides: ACCENT_PALETTE and theme.ts constants file

provides:
  - Dark/light theme toggle with localStorage persistence and no FOUC
  - ThemeProvider context with useTheme hook
  - ThemeToggle button in the AppShell header
  - CSS custom properties for light/dark base colors in index.css
  - Dual accent palette (dark + light variants) for branch thread colors

affects:
  - 06-05-plan (Playwright E2E tests should verify .dark class on first load and toggle behavior)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inline script in index.html <head> for FOUC prevention (dark-first strategy)
    - React Context for theme state with localStorage sync via useEffect
    - CSS custom properties on :root and .dark for theme-adaptive colors

key-files:
  created:
    - frontend/src/contexts/ThemeContext.tsx
    - frontend/src/components/ui/ThemeToggle.tsx
  modified:
    - frontend/index.html
    - frontend/src/index.css
    - frontend/src/main.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/constants/theme.ts

key-decisions:
  - "ThemeProvider wraps ClerkProvider in main.tsx (outside auth boundary so theme is available globally)"
  - "Dark is default: inline script adds .dark unless localStorage explicitly holds 'light'"
  - "ACCENT_PALETTE kept as alias for ACCENT_PALETTE_DARK — backward compat for all existing code"
  - "getNextAccentColor accepts isDark=true param — light palette available but not auto-wired to useTheme (deferred)"

patterns-established:
  - "FOUC prevention: inline <script> in <head> before any CSS links reads localStorage and applies class synchronously"
  - "ThemeContext pattern: useState initializer reads localStorage, useEffect syncs DOM + writes storage on change"

requirements-completed:
  - UI-01
  - UI-02

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 06 Plan 02: Dark/Light Theme System Summary

**Dark/light theme toggle with FOUC-prevention inline script, ThemeContext localStorage persistence, moon/sun ThemeToggle in the header, and warm stone/zinc CSS custom properties**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T17:07:10Z
- **Completed:** 2026-03-09T17:15:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added FOUC-prevention inline script to `index.html` — dark class applied synchronously before React hydrates, no flash of light mode
- Created `ThemeContext.tsx` with `ThemeProvider` and `useTheme` hook — localStorage-backed, defaults to dark
- Created `ThemeToggle.tsx` — moon icon in dark mode, sun icon in light mode, renders in AppShell header
- Added CSS custom properties in `index.css` for `--bg-base`, `--text-primary`, etc. with stone/zinc light/dark values
- Updated `AppShell.tsx` root div and header to use `bg-stone-50 dark:bg-zinc-900` (warm cream light, zinc dark)
- Added `ACCENT_PALETTE_LIGHT` to `theme.ts` with deeper/more-muted hues for use on light backgrounds

## Task Commits

Each task was committed atomically:

1. **Task 1: FOUC script, ThemeContext, ThemeToggle, and theme CSS** - `80bef0e3` (feat)
2. **Task 2: Wire ThemeProvider in main.tsx, ThemeToggle in AppShell, dual accent palette** - `37bac708` (feat)

## Files Created/Modified

- `frontend/index.html` - Added inline FOUC-prevention script in `<head>`, updated title to DeepDive
- `frontend/src/contexts/ThemeContext.tsx` - ThemeProvider + useTheme hook (created)
- `frontend/src/components/ui/ThemeToggle.tsx` - Moon/sun icon toggle button (created)
- `frontend/src/index.css` - CSS custom properties for light/dark base colors appended
- `frontend/src/main.tsx` - ThemeProvider wrapping ClerkProvider + App
- `frontend/src/components/layout/AppShell.tsx` - ThemeToggle in header, stone/zinc bg classes
- `frontend/src/constants/theme.ts` - ACCENT_PALETTE_DARK, ACCENT_PALETTE_LIGHT, updated getNextAccentColor

## Decisions Made

- ThemeProvider placed outside ClerkProvider in main.tsx so theme is available to all components including auth UI
- Dark is the default: inline script adds `.dark` class unless localStorage contains the explicit string `'light'`
- ACCENT_PALETTE exported as alias for ACCENT_PALETTE_DARK for backward compatibility — all existing code using ACCENT_PALETTE continues to work unchanged
- Light palette accent colors are not auto-wired to `useTheme()` — this is a known deferred item; the `isDark` param exists for future wiring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing: Playwright e2e spec files (e2e/*.spec.ts) are picked up by Vitest because `vitest.config.ts` lacks an `exclude` pattern. This causes 6 file-level failures (all Playwright `test.describe` API). The 152 unit tests all pass. This is a pre-existing issue not caused by this plan — logged in deferred-items.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Theme system fully operational — dark default, toggle, persistence, no FOUC
- Light mode CSS classes (`bg-stone-50`, `text-stone-900`) in place on root layout
- Playwright E2E tests in plan 06-05 can assert `.dark` on `<html>` on first load and toggle behavior
- Light palette accent colors (`ACCENT_PALETTE_LIGHT`) available but not yet wired — can be done in 06-05 or as quick task

---
*Phase: 06-polish-and-deployment*
*Completed: 2026-03-09*
