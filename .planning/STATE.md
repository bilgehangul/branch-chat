---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: BranchChat Redesign
status: executing
stopped_at: Completed 11-04-PLAN.md (Phase 11 complete)
last_updated: "2026-03-12T17:39:24.405Z"
last_activity: "2026-03-12 - Completed quick task 25: Text selection portal rewrite, sidebar collapse fix"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 16
  completed_plans: 16
  percent: 96
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** A user must be able to branch off any paragraph into a focused child conversation and return to the exact spot in the parent — with a visible lead marker showing where they went and what they found.
**Current focus:** Phase 10 - Visual Polish (v2.0 BranchChat Redesign)

## Current Position

Phase: 10 of 11 (Visual Polish) -- IN PROGRESS
Plan: 10-01, 10-02 complete (sidebar visual foundation + thread tree redesign)
Status: Phase 10 in progress
Last activity: 2026-03-14 - Completed quick task 26: Fix model selection not applying when choosing OpenAI model after adding API key

Progress: [██████████] 96% (v2.0 scope)

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
- ActionBubble uses position:fixed via createPortal to document.body — escapes CSS Grid entirely (quick-25)
- HighlightOverlay converts scroll-container-relative rects to viewport coords via scrollRef (quick-25)
- Sidebar ThreadNode collapsed by default — useState(false) in ThreadNode (quick-25)
- [Phase 08]: ANNO-02 description corrected to remove caret reference per user locked decision
- [Phase 09]: Ancestor rail width 28px, overlay 220px — no dynamic sizing
- [Phase 09]: Branch badge is decorative span (not button) — entire expanded panel clickable to navigate
- [Phase 09]: CSS Grid (1fr auto) replaces JS measurement for pill alignment — measurePillTop/ResizeObserver removed
- [Phase 09]: BranchPillCell exported from GutterColumn.tsx — file preserved for import compatibility
- [Phase 09]: fadeState state machine (idle/fading-out/fading-in) with 75ms per phase for crossfade
- [Phase 09]: Scroll restored during opacity-0 (fade-out) to prevent visible jump
- [Phase 09]: Preview card flip threshold: pill bottom > innerHeight - 220px
- [Phase 09]: Descendant pills collapsed by default (max-h-0), expand on parent hover
- [Phase 10-visual-polish]: DeleteModal uses position:fixed to escape sidebar overflow context
- [Phase 10-01]: Sidebar gradient via CSS custom property (--sidebar-gradient) to avoid Tailwind v4 gradient syntax issues
- [Phase 10-01]: formatRelativeDate accepts Date | string | number for maximum compatibility
- [Phase 10-01]: Session entry hover border uses inline event handlers for dynamic accent color
- [Phase 11-multi-provider-settings]: config.ts factory functions replace singleton exports; no more AI_PROVIDER env var switching
- [Phase 11-multi-provider-settings]: BYOK apiKey extracted from body and deleted immediately before any downstream processing (BKND-07/08)
- [Phase 11-multi-provider-settings]: Search provider always defaults in find-sources.ts; BYOK search deferred to plan 11-04
- [Phase 11-03]: SettingsProvider placed in App.tsx (not main.tsx) to access user.sub from AuthContext for AES-GCM crypto keying
- [Phase 11-03]: SettingsModal self-renders via portal (isModalOpen gate) so no prop drilling needed across app tree
- [Phase 11-multi-provider-settings]: Anthropic systemPrompt passed as top-level 'system' param — Anthropic API does not accept system role in messages array
- [Phase 11-multi-provider-settings]: byokRateLimiter uses ipKeyGenerator for IPv6-safe IP fallback (prevents ERR_ERL_KEY_GEN_IPV6)
- [Phase 11-04]: ByokSection calls useAuth() directly for getToken/user — AuthProvider added to test harness
- [Phase 11-04]: Key masked to ****...last4 after save; clears on focus for re-entry
- [Phase 11-04]: ByokCredentials injected via spread in streamChat body — zero-cost when tier=free
- [Phase 11-04]: AuthContext signOut removes byok_key and byok_settings localStorage entries on sign-out
- [Phase 11-multi-provider-settings]: setByokProvider clears byokApiKey in context so old provider key never bleeds into new provider input
- [Phase 11-multi-provider-settings]: Manage Keys text button replaces gear icon in AppShell header for clearer affordance

### Pending Todos

None yet.

### Blockers/Concerns

- Branch pill JS measurement drift resolved in 09-01 (CSS Grid migration)
- Annotation light-mode colors fixed in 08-02 (indigo-50/stone-50 backgrounds)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 24 | Fix 5 UI bugs: text selection, action bubble, branch pill alignment, subbranch hover collapse, sidebar parent branch layout | 2026-03-12 | 8d809975 | [24-fix-5-ui-bugs-text-selection-action-bubb](./quick/24-fix-5-ui-bugs-text-selection-action-bubb/) |
| 25 | Rewrite text selection system with position:fixed portal; fix sidebar ThreadNode collapsed by default | 2026-03-12 | 5a581ff4 | [25-rewrite-text-selection-actionbubble-from](./quick/25-rewrite-text-selection-actionbubble-from/) |
| 26 | Fix model selection not applying when choosing OpenAI model after adding API key | 2026-03-14 | d0eb00d1 | [26-fix-model-selection-not-applying-when-ch](./quick/26-fix-model-selection-not-applying-when-ch/) |
| Phase 11-multi-provider-settings P03 | 6 | 3 tasks | 11 files |
| Phase 11-multi-provider-settings P02 | 8 | 3 tasks | 11 files |
| Phase 11-multi-provider-settings P04 | 6 | 2 tasks | 7 files |

## Session Continuity

Last session: 2026-03-12T17:32:03.190Z
Stopped at: Completed 11-04-PLAN.md (Phase 11 complete)
Resume file: None
