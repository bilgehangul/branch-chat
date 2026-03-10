---
phase: quick-11
plan: 01
subsystem: frontend-components, auth, types
tags: [dark-mode, cleanup, dead-code, auth]
key-files:
  modified:
    - backend/.env.example
    - frontend/.env.example
    - backend/src/middleware/auth.ts
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/types/index.ts
    - frontend/src/components/thread/ContextCard.tsx
    - frontend/src/components/branching/ActionBubble.tsx
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/layout/AncestorPeekPanel.tsx
    - frontend/src/components/layout/BreadcrumbBar.tsx
    - frontend/src/components/ui/ConfirmDialog.tsx
    - frontend/src/tests/sessionStore.annotations.test.ts
decisions:
  - "Annotation.type union narrowed to 'source' | 'simplification'; 'rewrite' was never implemented"
  - "Dark palette: dark:bg-zinc-800 for cards, dark:bg-zinc-900 for panels, dark:border-zinc-700 for borders"
metrics:
  duration: 8
  completed: "2026-03-10"
  tasks: 3
  files: 12
---

# Phase quick-11 Plan 01: Codebase Audit — Env, Dark Mode, Dead Code Summary

**One-liner:** Removed stale Clerk refs from .env.example and auth comments, added dark: Tailwind variants to 6 components, and removed dead 'rewrite' annotation type.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix .env.example files and remove stale Clerk references | 16233508 | backend/.env.example, frontend/.env.example, auth.ts, AuthContext.tsx |
| 2 | Add dark mode variants to all 6 components | 60dac5ca | ContextCard, ActionBubble, GutterColumn, AncestorPeekPanel, BreadcrumbBar, ConfirmDialog |
| 3 | Remove dead 'rewrite' annotation type | f09cbf5c | frontend/src/types/index.ts, sessionStore.annotations.test.ts |

## Changes Made

### Task 1: Stale Clerk references removed

- **backend/.env.example**: Replaced `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` block with `GOOGLE_CLIENT_ID=your_google_client_id_here` under a `# Google OAuth (audience for ID token verification)` comment.
- **frontend/.env.example**: Replaced `VITE_CLERK_PUBLISHABLE_KEY` with `VITE_GOOGLE_CLIENT_ID`; updated comment from `# Clerk authentication (required)` to `# Google OAuth (required)`.
- **backend/src/middleware/auth.ts**: Removed "Replaces Clerk getAuth() pattern." from file header comment.
- **frontend/src/contexts/AuthContext.tsx**: Removed 3 Clerk references from file header and inline comments.

### Task 2: Dark mode across 6 components

All components now use the project's established dark palette:
- `dark:bg-zinc-800` — card/panel backgrounds (ContextCard quote area, ActionBubble, context menus, preview cards, AncestorPeekPanel header, BreadcrumbBar dropdown, ConfirmDialog)
- `dark:bg-zinc-900` / `dark:bg-zinc-900/80` — AncestorPeekPanel outer panel
- `dark:border-zinc-700` — all border-slate-200 replaced
- `dark:text-zinc-100/200/300/400/500/600` — full text hierarchy
- `dark:hover:bg-zinc-700` / `dark:hover:bg-zinc-800` — hover states
- `dark:hover:bg-red-900/30` / `dark:text-red-400` — destructive actions
- `dark:from-zinc-900` — AncestorPeekPanel bottom fade gradient

### Task 3: Dead 'rewrite' type removed

- `frontend/src/types/index.ts`: `Annotation.type` narrowed from `'source' | 'rewrite' | 'simplification'` to `'source' | 'simplification'`.
- `frontend/src/tests/sessionStore.annotations.test.ts`: Two occurrences of `type: 'rewrite'` / `.toBe('rewrite')` updated to `'simplification'` to maintain test validity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test file used removed 'rewrite' type**
- **Found during:** Task 3 verification grep
- **Issue:** `sessionStore.annotations.test.ts` lines 60 and 69 referenced `type: 'rewrite'` which would become a TypeScript error after the union narrowing
- **Fix:** Changed both occurrences to `'simplification'` — preserves test intent (checking that one annotation is not affected by updating another)
- **Files modified:** frontend/src/tests/sessionStore.annotations.test.ts
- **Commit:** f09cbf5c (included in same commit)

## Verification

- `grep -rn "clerk\|Clerk\|CLERK" backend/.env.example frontend/.env.example backend/src/middleware/auth.ts frontend/src/contexts/AuthContext.tsx` — 0 matches
- `grep -rn "GOOGLE_CLIENT_ID" backend/.env.example frontend/.env.example` — 2 matches (one per file)
- `grep -rn "'rewrite'" frontend/src/` — 0 matches
- `npx tsc --noEmit -p frontend/tsconfig.app.json` — clean (0 errors)
- `npx tsc --noEmit` in backend — clean (0 errors)

## Self-Check: PASSED

All 3 task commits exist:
- 16233508 — chore(quick-11): remove stale Clerk refs
- 60dac5ca — feat(quick-11): add dark mode variants to 6 components
- f09cbf5c — chore(quick-11): remove dead 'rewrite' annotation type

All modified files exist and contain the expected changes.
