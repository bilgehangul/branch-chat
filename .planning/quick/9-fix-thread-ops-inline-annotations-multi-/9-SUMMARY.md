---
phase: quick-9
plan: 1
subsystem: frontend
tags: [thread-ops, inline-annotations, text-selection, markdown, dark-mode, ux]
dependency_graph:
  requires: [quick-7, quick-8]
  provides: [working-thread-ops, working-inline-annotations, multi-para-selection, dark-mode-markdown]
  affects: [GutterColumn, sessionStore, ThreadView, useTextSelection, MarkdownRenderer, MessageBlock, api/client]
tech_stack:
  patterns: [zustand-state, react-hooks, tailwind-dark-mode, prose-invert]
key_files:
  modified:
    - frontend/src/store/sessionStore.ts
    - frontend/src/components/branching/GutterColumn.tsx
    - frontend/src/components/thread/ThreadView.tsx
    - frontend/src/hooks/useTextSelection.ts
    - frontend/src/api/client.ts
    - frontend/src/components/thread/MarkdownRenderer.tsx
    - frontend/src/components/thread/MessageBlock.tsx
decisions:
  - "summarizeThread creates a NEW child thread (not replacing original messages) — additive operation"
  - "compactThread gathers all descendant messages, replaces thread with single summary, removes all child threads from state"
  - "pendingDeleteRef pattern: sync ref with state in useEffect so global mousedown handler reads current value without stale closure"
  - "Cross-paragraph selection: use lower paragraph index as annotation anchor; both paragraphs must share the same data-message-id container"
  - "apiRequest wraps res.json() in try-catch returning PARSE_ERROR to prevent uncaught exceptions on HTML error pages"
  - "prose-invert Tailwind class used for dark mode Markdown instead of hardcoded text-slate-900"
metrics:
  duration: 18 min
  completed: "2026-03-10"
  tasks_completed: 3
  files_modified: 7
---

# Quick Task 9: Fix Thread Ops, Inline Annotations, Multi-Paragraph Selection, Output Formatting

**One-liner:** Fixed delete confirmation dialog persistence (stale closure via ref), rewrote summarize/compact store operations, enabled cross-paragraph text selection, hardened API error handling, and added dark-mode-aware prose + bubble styling.

## What Was Done

### Task 1: Thread Operations

**Delete thread — dialog persistence fix:**
`ThreadContextMenu` added a `pendingDeleteRef` (synced from state via `useEffect`) so that the global `document.addEventListener('mousedown', handler)` returns early when the confirm dialog is open. Previously the handler captured a stale `pendingDelete = false` closure, causing the dialog to be dismissed immediately on the first mousedown inside it.

**Summarize thread — now creates child thread:**
`summarizeThread` in `sessionStore.ts` was rewritten to:
1. Recursively gather messages from the target thread AND all its descendants
2. Build a structured text including thread titles and hierarchy
3. Call `summarizeMessages` API
4. Create a **new child thread** titled "Summary" under the target thread
5. Add a single assistant message with the summary into that new child thread
The original thread's messages are completely preserved.

`ThreadView.tsx` updated to persist the new summary child thread to MongoDB after the operation.

**Compact thread — full replacement:**
`compactThread` was rewritten to:
1. Collect all descendant thread IDs recursively
2. Build combined text from the full thread tree
3. Replace the target thread's messages with a single summary message
4. Remove all descendant threads from state (`threads` and `messages`)
5. Clear `childThreadIds` on the target thread
6. Clean up `childLeads` in surviving messages that referenced deleted threads

`ThreadView.tsx` fires backend deletes for each top-level child thread after compacting.

### Task 2: Inline Annotations + Multi-Paragraph Selection

**API error handling:**
`api/client.ts` wraps `res.json()` in a try-catch returning `{ data: null, error: { code: 'PARSE_ERROR', message: 'Invalid response from server' } }` to gracefully handle non-JSON responses (e.g., HTML error pages from nginx/load balancer).

**Error logging:**
Added `console.error` in `handleFindSources` and `handleSimplify` in `ThreadView.tsx` so API failures are visible in the browser console with the full error object.

**Multi-paragraph selection:**
`useTextSelection.ts` removed the `anchorBlock !== focusBlock` rejection. Now:
- Both anchor and focus must have a `[data-paragraph-id]` block (required)
- Both blocks must be inside the same `[data-message-id]` container
- The lower-indexed paragraph ID is used as the annotation anchor (where the result block appears)
- Full `sel.toString().trim()` is passed as `anchorText` regardless of paragraph count

### Task 3: Output Formatting (Dark Mode)

**MarkdownRenderer prose:**
- `prose prose-slate max-w-none text-slate-900` → `prose prose-slate dark:prose-invert max-w-none break-words`
- `prose-invert` automatically flips all prose text/heading/link colors for dark mode
- `break-words` prevents long URLs and strings from overflowing the bubble

**Table and pre overrides:**
Added `table` component override wrapping tables in `<div className="overflow-x-auto">` so wide tables scroll horizontally. Added `pre` component override with `overflow-x-auto` class.

**Inline code:**
`bg-slate-100 text-slate-800` → `bg-slate-100 dark:bg-zinc-700 text-slate-800 dark:text-slate-200`

**Shimmer (pending) block:**
`border-slate-200 bg-slate-50` → added `dark:border-zinc-700 dark:bg-zinc-800`; shimmer bars `bg-slate-300` → added `dark:bg-zinc-600`

**Error block:**
`border-red-200 bg-red-50` → added `dark:border-red-800 dark:bg-red-950`; text `text-red-600` → added `dark:text-red-400`

**MessageBlock AI bubble:**
`bg-white text-slate-900 border-slate-200` → added `dark:bg-zinc-800 dark:text-slate-100 dark:border-zinc-700 overflow-hidden` (overflow-hidden prevents code block horizontal scroll from blowing out the bubble width)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] createThreadOnBackend anchorText nullability**
- **Found during:** Task 1 — TypeScript caught `anchorText: string | null` not assignable to `anchorText: string` in `createThreadOnBackend` payload
- **Fix:** Used `ct.anchorText ?? ''` to coerce null to empty string for summary threads (which have no text anchor)
- **Files modified:** `frontend/src/components/thread/ThreadView.tsx`
- **Commit:** bae9908e

**2. [Rule 1 - Bug] React import cleanup in useTextSelection**
- **Found during:** Task 2 — `React` was imported but only used as a namespace in the type annotation
- **Fix:** Changed to `import { type RefObject, useState, useEffect } from 'react'` and replaced `React.RefObject` with `RefObject`
- **Files modified:** `frontend/src/hooks/useTextSelection.ts`
- **Commit:** 4721e577

## Self-Check: PASSED

All 7 modified files confirmed present on disk. All 3 task commits verified in git log:
- bae9908e — thread operations fix
- 4721e577 — inline annotations + multi-paragraph selection
- 845182bb — dark mode output formatting

TypeScript check (`tsc --noEmit`) passes with zero errors in `src/` (excluding pre-existing test file issues). Vite production build succeeds in 3.82s.
