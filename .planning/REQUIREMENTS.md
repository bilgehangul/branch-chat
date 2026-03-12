# Requirements: ContextDive Chat — v2.0 BranchChat Redesign

**Defined:** 2026-03-11
**Core Value:** A user must be able to branch off any paragraph into a focused child conversation and return to the exact spot in the parent — with a visible lead marker showing where they went and what they found.

## v2.0 Requirements

Requirements for the BranchChat Redesign milestone. Derived from branch-chat-redesign-plan.md.

### Sidebar

- [ ] **SIDE-01**: Sidebar has distinct visual zone with gradient background (zinc-950→zinc-900/80 dark, stone-50→white light)
- [ ] **SIDE-02**: "Chats" header is a prominent section header with app name and bottom border
- [ ] **SIDE-03**: "+ New Chat" button is a styled button with icon, rounded corners, and hover elevation
- [ ] **SIDE-04**: Session list entries have vertical padding (py-3), hover states with left-colored bar
- [ ] **SIDE-05**: Active session has 2px accent-colored left border + tinted background using root thread's accentColor
- [ ] **SIDE-06**: Session dates show relative time ("2h ago", "Yesterday", "Mar 5") instead of raw locale strings
- [ ] **SIDE-07**: Thread tree uses chevron icons with CSS rotation transition instead of plain ▶/▼
- [ ] **SIDE-08**: Each thread node shows its accent-color pip inline
- [ ] **SIDE-09**: Active thread row highlighted with left-border accent color + background tint
- [ ] **SIDE-10**: Thread tree has thin vertical connecting lines showing hierarchy (like VS Code file tree)
- [ ] **SIDE-11**: 3-dot menu trigger appears on hover only (opacity-0 group-hover:opacity-100)
- [ ] **SIDE-12**: Delete confirmation uses modal-style dialog rather than inline Yes/No buttons

### Ancestor Panels

- [ ] **ANCS-01**: Ancestor panels replaced with thin spine rail (24-32px wide) showing only accent-color stripe
- [ ] **ANCS-02**: Rail expands to ~220px on hover with smooth CSS transition (200ms ease-out)
- [ ] **ANCS-03**: Expanded panel looks like a card overlay (shadow-lg, rounded right edge) floating over main content
- [ ] **ANCS-04**: Bottom fade gradient matches panel background color
- [ ] **ANCS-05**: Highlighted anchor message has larger text, colored left-border stripe, and pill-shaped "↗ branch" badge
- [ ] **ANCS-06**: Minimum readable text size is text-xs (12px) — no text-[10px]

### Branch Pills

- [ ] **PILL-01**: Branch pills use layout-based positioning (CSS Grid: grid-template-columns 1fr auto) instead of JS absolute positioning
- [ ] **PILL-02**: Pills are rendered inline within message flow, eliminating JS measurement and ResizeObserver drift
- [ ] **PILL-03**: Padding pr-[80px]/pr-[140px] always applied regardless of hasChildThreads to prevent layout shift
- [ ] **PILL-04**: Thread transition uses gentle crossfade (opacity fade over 150ms) instead of jarring -100% slide
- [ ] **PILL-05**: Transition is interruptible — navigating mid-transition cancels current animation
- [ ] **PILL-06**: Hover preview card uses auto-positioning (Popover/Tooltip) to prevent off-screen overflow
- [ ] **PILL-07**: Preview card has small pointer/arrow indicating which pill it belongs to
- [ ] **PILL-08**: Descendant pills collapsed by default, shown on expand/hover

### Text Selection

- [ ] **TSEL-01**: Text selection only triggers ActionBubble on assistant message content (not user messages, context cards, annotations, or UI elements)
- [ ] **TSEL-02**: MessageBlock wrapper has data-message-role="assistant" attribute for selection filtering
- [ ] **TSEL-03**: Annotation blocks, context cards, and UI buttons have data-no-selection attribute
- [ ] **TSEL-04**: ActionBubble uses position:absolute inside scroll container (not position:fixed) so it scrolls with text
- [ ] **TSEL-05**: ActionBubble dismisses if user scrolls more than ~100px from selection
- [ ] **TSEL-06**: Bubble position computed relative to content wrapper (rect.top - wrapperRect.top + scrollTop)

### Annotations

- [ ] **ANNO-01**: Selected target text highlighted inline with subtle background color (bg-amber-100/30 dark:bg-amber-500/10)
- [ ] **ANNO-02**: Annotation card has small upward-pointing caret and quoted targetText at top in italics
- [ ] **ANNO-03**: SimplificationBlock has light-mode variant (bg-indigo-50 border-indigo-200)
- [ ] **ANNO-04**: CitationBlock has light-mode variant (bg-stone-50 border-stone-200)
- [ ] **ANNO-05**: Annotation cards respect message bubble width — no independent max-w-[720px]
- [ ] **ANNO-06**: Annotation cards have enter animation (slide up 8px + fade in over 200ms)
- [ ] **ANNO-07**: Simplification mode shown as small colored badge/tag
- [ ] **ANNO-08**: Simplified text rendered with MarkdownRenderer (with flag to skip annotation injection)
- [ ] **ANNO-09**: "Try another mode" shows row of pill buttons always visible (not behind toggle)
- [ ] **ANNO-10**: CitationBlock defaults to expanded (not collapsed)
- [ ] **ANNO-11**: Each citation source shows favicon, title as link, snippet preview, and domain badge
- [ ] **ANNO-12**: Citation note styled as soft callout at bottom

### Message Rendering

- [ ] **MSGE-01**: Model label is dynamic from current provider/model setting (not hardcoded "Gemini")
- [ ] **MSGE-02**: Headings within AI messages have proper visual weight — larger font, thin bottom border, top margin
- [ ] **MSGE-03**: Code blocks have copy-to-clipboard button (hover-visible, "Copied!" toast on click)
- [ ] **MSGE-04**: List items have more spacing (space-y-1.5), nested lists have clear indentation
- [ ] **MSGE-05**: Tables have min-w-full and subtle row striping (even:bg-stone-50 dark:even:bg-zinc-800/50)
- [ ] **MSGE-06**: Blockquotes styled with colored left border (thread accent color) and italic text
- [ ] **MSGE-07**: User message uses whitespace-pre-wrap break-words for long strings
- [ ] **MSGE-08**: User message shows timestamp on hover
- [ ] **MSGE-09**: Streaming cursor has proper blinking animation

### Provider Settings

- [ ] **PROV-01**: Gear icon button in header opens Settings panel (slide-over or modal)
- [ ] **PROV-02**: Settings Section A — "Default Model" toggle between Gemini Flash 2.0 and Gemini Flash 2.0 Lite (labeled "Free")
- [ ] **PROV-03**: Settings Section B — "Use Your Own API Key" collapsible section (default collapsed)
- [ ] **PROV-04**: BYOK provider selector: Gemini | OpenAI | Anthropic
- [ ] **PROV-05**: API key input with show/hide toggle, provider-specific placeholder
- [ ] **PROV-06**: "Verify Key" button makes lightweight backend call, shows green check or red error
- [ ] **PROV-07**: Model selector populates only after key verification with provider-specific model list
- [ ] **PROV-08**: Search provider selector: Tavily (default) or OpenAI web search (if OpenAI key provided)
- [ ] **PROV-09**: "Clear Key & Reset to Free" button removes stored key and reverts to Tier 1
- [ ] **PROV-10**: Active model shown as small badge in ChatInput area, clickable to open Settings
- [ ] **PROV-11**: BYOK mode shows key icon next to model name
- [ ] **PROV-12**: SettingsContext manages tier, freeModel, byokProvider, byokModel, byokApiKey, byokKeyVerified, searchProvider
- [ ] **PROV-13**: API key encrypted in localStorage using Web Crypto AES-GCM (keyed to userId + app salt)
- [ ] **PROV-14**: Key cleared from localStorage on sign-out
- [ ] **PROV-15**: Full key never displayed after entry — show only last 4 characters

### Backend Provider

- [ ] **BKND-01**: config.ts refactored from singleton to factory: getDefaultProvider(model?) + createByokProvider(provider, model, apiKey)
- [ ] **BKND-02**: All API routes accept optional byok field in request body with provider, model, apiKey
- [ ] **BKND-03**: Free-tier fallback chain narrowed to gemini-2.0-flash → gemini-2.0-flash-lite only
- [ ] **BKND-04**: GeminiProvider constructor accepts apiKey + model parameters (not process.env at module level)
- [ ] **BKND-05**: OpenAIProvider constructor accepts dynamic apiKey + model
- [ ] **BKND-06**: Anthropic Claude provider implementing AIProvider interface (streamChat, simplify, generateCitationNote)
- [ ] **BKND-07**: API keys never logged — sanitization middleware redacts byok.apiKey in all logging
- [ ] **BKND-08**: API keys never persisted — exists only in request handler scope
- [ ] **BKND-09**: Error responses redact any API key substrings
- [ ] **BKND-10**: Key format validation rejects malformed keys before hitting third-party APIs
- [ ] **BKND-11**: Per-user rate limiting for BYOK requests (30 req/min)
- [ ] **BKND-12**: CORS restricted to app domain only

### Cross-Cutting

- [ ] **XCUT-01**: All new interactive elements have aria-label, keyboard navigation, focus-visible outlines
- [ ] **XCUT-02**: Settings modal traps focus
- [ ] **XCUT-03**: Color choices meet WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text)
- [ ] **XCUT-04**: Existing tests updated to match new DOM structure and class names
- [ ] **XCUT-05**: New tests for text selection filtering, settings context, and light-mode annotations

## Future Requirements

Deferred beyond v2.0.

- **RESP-01**: Sidebar collapses to hamburger menu below sm breakpoint (640px)
- **RESP-02**: Branch pills on mobile collapse to icon-only state
- **RESP-03**: Settings panel is full-screen slide-over on mobile
- **PERF-01**: "Thinking..." skeleton above message while streaming content is empty

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile support | Text selection and gutter layout require desktop viewport (>=1024px) |
| Fine-grained inline annotation insertion | Moving annotations mid-paragraph is complex and fragile with markdown rendering -- keep after block element |
| OAuth providers beyond Google | Google OAuth sufficient for v2.0, additional OAuth deferred |
| Real-time collaborative editing | Single-user sessions only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TSEL-01 | Phase 8 | Pending |
| TSEL-02 | Phase 8 | Pending |
| TSEL-03 | Phase 8 | Pending |
| TSEL-04 | Phase 8 | Pending |
| TSEL-05 | Phase 8 | Pending |
| TSEL-06 | Phase 8 | Pending |
| ANNO-01 | Phase 8 | Pending |
| ANNO-02 | Phase 8 | Pending |
| ANNO-03 | Phase 8 | Pending |
| ANNO-04 | Phase 8 | Pending |
| ANNO-05 | Phase 8 | Pending |
| MSGE-01 | Phase 8 | Pending |
| XCUT-01 | Phase 8 | Pending |
| XCUT-02 | Phase 8 | Pending |
| XCUT-03 | Phase 8 | Pending |
| XCUT-04 | Phase 8 | Pending |
| XCUT-05 | Phase 8 | Pending |
| PILL-01 | Phase 9 | Pending |
| PILL-02 | Phase 9 | Pending |
| PILL-03 | Phase 9 | Pending |
| PILL-04 | Phase 9 | Pending |
| PILL-05 | Phase 9 | Pending |
| PILL-06 | Phase 9 | Pending |
| PILL-07 | Phase 9 | Pending |
| PILL-08 | Phase 9 | Pending |
| ANCS-01 | Phase 9 | Pending |
| ANCS-02 | Phase 9 | Pending |
| ANCS-03 | Phase 9 | Pending |
| ANCS-04 | Phase 9 | Pending |
| ANCS-05 | Phase 9 | Pending |
| ANCS-06 | Phase 9 | Pending |
| SIDE-01 | Phase 10 | Pending |
| SIDE-02 | Phase 10 | Pending |
| SIDE-03 | Phase 10 | Pending |
| SIDE-04 | Phase 10 | Pending |
| SIDE-05 | Phase 10 | Pending |
| SIDE-06 | Phase 10 | Pending |
| SIDE-07 | Phase 10 | Pending |
| SIDE-08 | Phase 10 | Pending |
| SIDE-09 | Phase 10 | Pending |
| SIDE-10 | Phase 10 | Pending |
| SIDE-11 | Phase 10 | Pending |
| SIDE-12 | Phase 10 | Pending |
| MSGE-02 | Phase 10 | Pending |
| MSGE-03 | Phase 10 | Pending |
| MSGE-04 | Phase 10 | Pending |
| MSGE-05 | Phase 10 | Pending |
| MSGE-06 | Phase 10 | Pending |
| MSGE-07 | Phase 10 | Pending |
| MSGE-08 | Phase 10 | Pending |
| MSGE-09 | Phase 10 | Pending |
| ANNO-06 | Phase 10 | Pending |
| ANNO-07 | Phase 10 | Pending |
| ANNO-08 | Phase 10 | Pending |
| ANNO-09 | Phase 10 | Pending |
| ANNO-10 | Phase 10 | Pending |
| ANNO-11 | Phase 10 | Pending |
| ANNO-12 | Phase 10 | Pending |
| PROV-01 | Phase 11 | Pending |
| PROV-02 | Phase 11 | Pending |
| PROV-03 | Phase 11 | Pending |
| PROV-04 | Phase 11 | Pending |
| PROV-05 | Phase 11 | Pending |
| PROV-06 | Phase 11 | Pending |
| PROV-07 | Phase 11 | Pending |
| PROV-08 | Phase 11 | Pending |
| PROV-09 | Phase 11 | Pending |
| PROV-10 | Phase 11 | Pending |
| PROV-11 | Phase 11 | Pending |
| PROV-12 | Phase 11 | Pending |
| PROV-13 | Phase 11 | Pending |
| PROV-14 | Phase 11 | Pending |
| PROV-15 | Phase 11 | Pending |
| BKND-01 | Phase 11 | Pending |
| BKND-02 | Phase 11 | Pending |
| BKND-03 | Phase 11 | Pending |
| BKND-04 | Phase 11 | Pending |
| BKND-05 | Phase 11 | Pending |
| BKND-06 | Phase 11 | Pending |
| BKND-07 | Phase 11 | Pending |
| BKND-08 | Phase 11 | Pending |
| BKND-09 | Phase 11 | Pending |
| BKND-10 | Phase 11 | Pending |
| BKND-11 | Phase 11 | Pending |
| BKND-12 | Phase 11 | Pending |

**Coverage:**
- v2.0 requirements: 85 total
- Mapped to phases: 85
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation (all 85 requirements mapped to Phases 8-11)*
