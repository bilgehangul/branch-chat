# Roadmap: ContextDive Chat

## Overview

ContextDive Chat is built incrementally from foundation through full feature set. v1.0 shipped core branching chat in 7 phases. v2.0 (BranchChat Redesign) delivers comprehensive UI/UX polish and multi-provider BYOK settings across 4 phases, starting with interaction fixes, then layout restructuring, visual polish, and finally the new provider settings feature.

## Milestones

- v1.0 MVP - Phases 1-7 (shipped 2026-03-10)
- v2.0 BranchChat Redesign - Phases 8-11 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-7) - SHIPPED 2026-03-10</summary>

- [x] **Phase 1: Backend Proxy Shell** - Authenticated Express proxy with Gemini streaming, Tavily, and provider abstraction (completed 2026-03-09)
- [x] **Phase 2: Frontend Foundation** - React scaffold, Google OAuth auth gate, flat Zustand store, SSE client (completed 2026-03-09)
- [x] **Phase 3: Core Thread UI** - Working single-thread chat with streaming, navigation chrome, and Markdown rendering (completed 2026-03-09)
- [x] **Phase 4: Branching** - Text selection, Go Deeper, gutter lead pills, animated navigation, depth limit (completed 2026-03-09)
- [x] **Phase 5: Inline Annotations** - Find Sources (Tavily), Simplify (4 modes), toggle to original, re-selectable annotated text (completed 2026-03-09)
- [x] **Phase 6: Polish and Deployment** - Dark/light theme, error states, breadcrumb overflow, rate limiting, E2E tests, AWS EC2 (Ubuntu, nginx + PM2) (completed 2026-03-10)
- [x] **Phase 7: Auth Migration + Persistent Storage** - Replace Clerk with Google OAuth, MongoDB Atlas for sessions/threads/messages, chat history view (completed 2026-03-10)

</details>

### v2.0 BranchChat Redesign

- [x] **Phase 8: Foundation Fixes** - Text selection filtering, annotation light-mode support, model label fix, accessibility and test updates (completed 2026-03-12)
- [x] **Phase 9: Layout & Positioning** - Branch pill CSS Grid migration, transition smoothing, ancestor panel rail redesign (completed 2026-03-12)
- [x] **Phase 10: Visual Polish** - Sidebar redesign, message rendering enhancements, annotation card improvements (completed 2026-03-12)
- [ ] **Phase 11: Multi-Provider Settings** - Settings UI with two-tier model, backend provider factory refactor, Anthropic provider, BYOK security

## Phase Details

### Phase 8: Foundation Fixes
**Goal**: Text selection works correctly on assistant messages only, annotations render properly in light mode, model label is dynamic, and accessibility/test foundations are updated for the redesign
**Depends on**: Phase 7
**Requirements**: TSEL-01, TSEL-02, TSEL-03, TSEL-04, TSEL-05, TSEL-06, ANNO-01, ANNO-02, ANNO-03, ANNO-04, ANNO-05, MSGE-01, XCUT-01, XCUT-02, XCUT-03, XCUT-04, XCUT-05
**Success Criteria** (what must be TRUE):
  1. Selecting text in a user message, context card, or UI button does NOT trigger the ActionBubble; selecting text in an assistant message does trigger it
  2. ActionBubble stays anchored to the selected text as the user scrolls (moves with content, not fixed to viewport) and dismisses after ~100px of scrolling away
  3. Annotation cards (SimplificationBlock, CitationBlock) render with correct colors in both light and dark mode
  4. The model label next to AI responses reflects the currently active provider/model, not a hardcoded string
  5. All new interactive elements have aria-labels, keyboard navigation, and focus-visible outlines; existing tests pass with updated DOM structure
**Plans**: 4 plans

Plans:
- [ ] 08-01: Text selection filtering (TSEL-01 through TSEL-06)
- [ ] 08-02: Annotation display fixes and light-mode variants (ANNO-01 through ANNO-05)
- [ ] 08-03: Model label fix, accessibility, and test updates (MSGE-01, XCUT-01 through XCUT-05)
- [ ] 08-04: Gap closure — correct ANNO-02 and XCUT-02 in REQUIREMENTS.md

### Phase 9: Layout & Positioning
**Goal**: Branch pills use CSS Grid layout instead of JS measurement, thread transitions are smooth crossfades, and ancestor panels are redesigned as collapsible hover-expand rails
**Depends on**: Phase 8
**Requirements**: PILL-01, PILL-02, PILL-03, PILL-04, PILL-05, PILL-06, PILL-07, PILL-08, ANCS-01, ANCS-02, ANCS-03, ANCS-04, ANCS-05, ANCS-06
**Success Criteria** (what must be TRUE):
  1. Branch pills render at correct positions without JS measurement or ResizeObserver; resizing the browser window causes no pill drift or layout shift
  2. Navigating between threads uses a gentle crossfade (opacity fade over 150ms) that can be interrupted by navigating again mid-transition
  3. Ancestor panels appear as thin accent-colored spine rails (24-32px) that expand to ~220px on hover with card-like overlay appearance, shadow, and bottom fade gradient
  4. The anchor message in expanded ancestor panels is visually highlighted with larger text, colored border, and branch badge
**Plans**: 4 plans

Plans:
- [ ] 09-01: Branch pill CSS Grid migration and layout stabilization (PILL-01 through PILL-03)
- [ ] 09-02: Thread transition crossfade and hover preview improvements (PILL-04 through PILL-08)
- [ ] 09-03: Ancestor panel rail redesign (ANCS-01 through ANCS-06)
- [ ] 09-04: Gap closure — replace text-[10px] with text-xs in DescendantPill (ANCS-06)

### Phase 10: Visual Polish
**Goal**: Sidebar is redesigned with IDE-grade session tree, message rendering is polished with proper typography and code copy, and annotation cards have enter animations and improved content display
**Depends on**: Phase 9
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07, SIDE-08, SIDE-09, SIDE-10, SIDE-11, SIDE-12, MSGE-02, MSGE-03, MSGE-04, MSGE-05, MSGE-06, MSGE-07, MSGE-08, MSGE-09, ANNO-06, ANNO-07, ANNO-08, ANNO-09, ANNO-10, ANNO-11, ANNO-12
**Success Criteria** (what must be TRUE):
  1. Sidebar has gradient background, styled header, prominent New Chat button, and session entries with relative dates, hover states with accent-colored left bars, and active session highlighting
  2. Thread tree in sidebar shows chevron toggles with rotation animation, accent-color pips, connecting lines, and 3-dot hover menus with modal delete confirmation
  3. Code blocks in AI messages have a copy-to-clipboard button that shows "Copied!" feedback; headings have proper visual weight; tables have row striping; blockquotes use accent-colored left borders
  4. Annotation cards slide up and fade in on creation; SimplificationBlock shows mode badges and rendered markdown with always-visible mode pills; CitationBlock defaults expanded with favicons and domain badges
  5. User messages use whitespace-pre-wrap with hover timestamps; streaming cursor has blinking animation
**Plans**: 4 plans

Plans:
- [ ] 10-01: Sidebar visual redesign (SIDE-01 through SIDE-06)
- [ ] 10-02: Sidebar thread tree and interactions (SIDE-07 through SIDE-12)
- [ ] 10-03: Message rendering polish (MSGE-02 through MSGE-09)
- [ ] 10-04: Annotation card enhancements (ANNO-06 through ANNO-12)

### Phase 11: Multi-Provider Settings
**Goal**: Users can choose between free-tier models and bring their own API keys for Gemini, OpenAI, or Anthropic; backend supports per-request provider instantiation with full security
**Depends on**: Phase 10
**Requirements**: PROV-01, PROV-02, PROV-03, PROV-04, PROV-05, PROV-06, PROV-07, PROV-08, PROV-09, PROV-10, PROV-11, PROV-12, PROV-13, PROV-14, PROV-15, BKND-01, BKND-02, BKND-03, BKND-04, BKND-05, BKND-06, BKND-07, BKND-08, BKND-09, BKND-10, BKND-11, BKND-12
**Success Criteria** (what must be TRUE):
  1. User can open Settings from a gear icon, toggle between Gemini Flash 2.0 and Gemini Flash 2.0 Lite as the free-tier default model, and see the active model badge in the chat input area
  2. User can expand the BYOK section, select a provider (Gemini/OpenAI/Anthropic), enter an API key, verify it with a backend call, and select from provider-specific models after verification
  3. User can clear their stored key and revert to free tier; the key is encrypted in localStorage with AES-GCM, never displayed in full after entry, and cleared on sign-out
  4. Backend creates provider instances per-request from BYOK credentials; API keys are never logged, never persisted server-side, and error responses redact key substrings
  5. Anthropic Claude provider is fully implemented (streamChat, simplify, generateCitationNote); BYOK requests are rate-limited to 30/min per user; CORS is restricted to app domain
**Plans**: 4 plans

Plans:
- [ ] 11-01: Backend provider factory refactor and free-tier narrowing (BKND-01 through BKND-05)
- [ ] 11-02: Anthropic Claude provider and BYOK security middleware (BKND-06 through BKND-12)
- [ ] 11-03: SettingsContext, crypto storage, and Settings modal UI (PROV-01 through PROV-05, PROV-12, PROV-13, XCUT-02)
- [ ] 11-04: BYOK verify flow, model badge, API injection, sign-out cleanup (PROV-06 through PROV-11, PROV-14, PROV-15)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 through 11 (decimal phases inserted between integers as needed)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Proxy Shell | v1.0 | 3/3 | Complete | 2026-03-09 |
| 2. Frontend Foundation | v1.0 | 3/3 | Complete | 2026-03-09 |
| 3. Core Thread UI | v1.0 | 6/6 | Complete | 2026-03-09 |
| 4. Branching | v1.0 | 8/8 | Complete | 2026-03-09 |
| 5. Inline Annotations | v1.0 | 7/7 | Complete | 2026-03-09 |
| 6. Polish and Deployment | v1.0 | 6/6 | Complete | 2026-03-10 |
| 7. Auth Migration + Persistent Storage | v1.0 | 5/5 | Complete | 2026-03-10 |
| 8. Foundation Fixes | 4/4 | Complete   | 2026-03-12 | - |
| 9. Layout & Positioning | 4/4 | Complete   | 2026-03-12 | - |
| 10. Visual Polish | 4/4 | Complete    | 2026-03-12 | - |
| 11. Multi-Provider Settings | 1/4 | In Progress|  | - |
