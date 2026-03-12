---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: BranchChat Redesign
status: completed
stopped_at: Completed 09-04-PLAN.md
last_updated: "2026-03-12T05:01:46.967Z"
last_activity: 2026-03-12 — Completed 09-04 ANCS-06 text size fix in DescendantPill
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** A user must be able to branch off any paragraph into a focused child conversation and return to the exact spot in the parent — with a visible lead marker showing where they went and what they found.
**Current focus:** Phase 9 - Layout & Positioning (v2.0 BranchChat Redesign)

## Current Position

Phase: 9 of 11 (Layout & Positioning) -- COMPLETE
Plan: 4 of 4 complete in current phase (09-01, 09-02, 09-03, 09-04 all done)
Status: Phase 9 complete — all 4 plans executed (including gap closure)
Last activity: 2026-03-12 — Completed 09-04 ANCS-06 text size fix in DescendantPill

Progress: [██████████] 100% (v2.0 scope: 8/14 plans)

## v1.0 Summary

v1.0 completed 2026-03-11: 7 phases, 39 plans, 23 quick tasks.
Shipped: Auth, streaming chat, branching, annotations, dark/light theme, E2E tests, AWS EC2 deployment, MongoDB persistence.

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 39
- Phases: 7

**v2.0:**
- Plans: 8/14 completed
- Phases: 1/4 completed (Phase 9 complete including gap closure)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions carried forward:

- Flat normalized Zustand store (`Record<id, Thread>`, `Record<id, Message>`) — locked in Phase 02
- SSE streaming via `fetch` + `ReadableStream` only — `EventSource` cannot send auth headers
- DOM pill positions stored in useRef (never Zustand)
- Dark is default: inline FOUC script adds .dark unless localStorage explicitly holds 'light'
- config.ts is the ONLY file reading AI_PROVIDER — will change in v2.0 Phase 11 with factory pattern
- Config endpoint (/api/config) mounted before auth middleware -- public non-sensitive config
- Focus-visible ring pattern: ring-2 ring-blue-500 ring-offset-2 ring-offset-white/zinc-900 on all interactive elements
- XCUT-02 (focus trapping) deferred to Phase 11 -- no modals in current UI
- Light-mode annotation colors: indigo-50 for simplification, stone-50 for citation
- Highlight overlay per-type colors: amber 25%, indigo 20%, teal 20% (highlighter pen feel)
- Inline annotation highlighting wraps first occurrence of targetText per paragraph with per-type tint
- data-message-role attribute on MessageBlock for DOM-based role filtering of text selection
- ActionBubble uses position:absolute inside contentWrapperRef (scrolls with text, not fixed)
- [Phase 08]: ANNO-02 description corrected to remove caret reference per user locked decision
- [Phase 09]: Ancestor rail width 28px, overlay 220px — no dynamic sizing
- [Phase 09]: Branch badge is decorative span (not button) — entire expanded panel clickable to navigate
- [Phase 09]: CSS Grid (1fr auto) replaces JS measurement for pill alignment — measurePillTop/ResizeObserver removed
- [Phase 09]: BranchPillCell exported from GutterColumn.tsx — file preserved for import compatibility
- [Phase 09]: fadeState state machine (idle/fading-out/fading-in) with 75ms per phase for crossfade
- [Phase 09]: Scroll restored during opacity-0 (fade-out) to prevent visible jump
- [Phase 09]: Preview card flip threshold: pill bottom > innerHeight - 220px
- [Phase 09]: Descendant pills collapsed by default (max-h-0), expand on parent hover

### Pending Todos

None yet.

### Blockers/Concerns

- Branch pill JS measurement drift resolved in 09-01 (CSS Grid migration)
- Annotation light-mode colors fixed in 08-02 (indigo-50/stone-50 backgrounds)

## Session Continuity

Last session: 2026-03-12T04:58:40.747Z
Stopped at: Completed 09-04-PLAN.md
Resume file: None
