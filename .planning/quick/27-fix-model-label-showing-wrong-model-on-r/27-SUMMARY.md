---
phase: quick-27
plan: "01"
subsystem: frontend/thread-display
tags: [bug-fix, byok, model-label, branch-pills, grid-layout]
dependency_graph:
  requires: [SettingsContext, MODEL_LISTS, GutterColumn]
  provides: [BYOK-aware model label, per-paragraph pill alignment]
  affects: [MessageBlock.tsx, MessageList.tsx]
tech_stack:
  added: []
  patterns: [useSettings hook in MessageBlock, CSS Grid span for pill sub-rows]
key_files:
  created: []
  modified:
    - frontend/src/components/thread/MessageBlock.tsx
    - frontend/src/components/thread/MessageList.tsx
decisions:
  - "Keep getModelLabel() for free tier only; derive label synchronously from MODEL_LISTS for BYOK tier"
  - "Use gridRow: span N on column-1 div to span all paragraph sub-rows without duplicate MessageBlock renders"
  - "Only split into sub-rows for assistant messages that have at least one childLead"
metrics:
  duration: "~8 minutes"
  completed: "2026-03-14T16:05:13Z"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 27: Fix model label and branch pill alignment

**One-liner:** BYOK model name shown via MODEL_LISTS lookup in MessageBlock; branch pills aligned to anchor paragraphs via CSS Grid per-paragraph sub-rows in MessageList.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix model label to show BYOK model when active | f49f43ee | frontend/src/components/thread/MessageBlock.tsx |
| 2 | Align branch pills to their anchor paragraph | e29f0100 | frontend/src/components/thread/MessageList.tsx |

## What Was Done

### Task 1 — BYOK-aware model label (MessageBlock.tsx)

The model label above AI responses previously always called `getModelLabel()` which fetches from `/api/config` and returns the server-configured free-tier model name ("Gemini Flash 2.0"), even when a BYOK model was active.

Fix: imported `useSettings` and `MODEL_LISTS` into `MessageBlock`. Derived `modelLabel` as:
- When `tier === 'byok'` and `byokProvider`/`byokModel` are set: look up the human-readable label in `MODEL_LISTS[byokProvider]`, falling back to the raw model ID if not found.
- When `tier === 'free'`: continue fetching from `/api/config` via `getModelLabel()` (called only when tier is not byok, avoiding unnecessary network requests for BYOK users).

### Task 2 — Per-paragraph branch pill alignment (MessageList.tsx)

Branch pills were vertically centered on the entire message block (`self-center` on the whole column-2 cell). This caused pills to float in the middle of long multi-paragraph responses instead of appearing next to the paragraph they were branched from.

Fix: for assistant messages with at least one `childLead`, split column-2 into N cells (one per paragraph, where N = `msg.content.split(/\n\n+/).length`). Column-1 uses `gridRow: span N` to span all sub-rows without re-rendering MessageBlock. Each column-2 cell renders only the pills whose `paragraphIndex` matches that row index. User messages and assistant messages without pills use the unchanged single-row layout.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `cd frontend && npx tsc --noEmit` — zero errors (confirmed)
- Visual: BYOK users now see actual model name (e.g. "GPT-5.4") in response label
- Visual: Branch pills appear at the correct paragraph row, not centered on the whole message

## Self-Check

### Files exist:
- frontend/src/components/thread/MessageBlock.tsx — modified (not created)
- frontend/src/components/thread/MessageList.tsx — modified (not created)

### Commits exist:
- f49f43ee — fix(quick-27-01): show BYOK model name in AI response label
- e29f0100 — fix(quick-27-02): align branch pills to their anchor paragraph via grid sub-rows

## Self-Check: PASSED
