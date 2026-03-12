# Phase 8: Foundation Fixes - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix text selection to only trigger ActionBubble on assistant messages, fix annotation rendering in light mode, make the model label dynamic, and add accessibility foundations. No new features — this is corrective work on existing Phase 4/5/6 implementations to prepare for the v2.0 redesign.

</domain>

<decisions>
## Implementation Decisions

### Target text highlighting (ANNO-01, ANNO-02)
- Each annotation type gets a distinct inline highlight color:
  - **Sources** (Find Sources): amber/gold tint
  - **Simplify**: indigo/violet tint
  - **Go Deeper**: teal/cyan tint
- Colors must be readable in both dark and light themes (dual-theme variants)
- When text has multiple annotations on the same paragraph, highlights combine as a subtle CSS gradient blend of the two annotation colors — visually signals "this text has multiple annotations"
- Annotation cards show quoted targetText at top in italics, truncated to ~50 characters with ellipsis
- No upward-pointing caret on annotation cards — proximity to the text makes the relationship clear

### Annotation card sizing (ANNO-05)
- Annotation cards (SimplificationBlock, CitationBlock) match the assistant message bubble's width constraint (max-w-[85%]) — no independent max-w-[720px]
- Cards render inside the message bubble (visually contained), after the paragraph they annotate — this is the current behavior, just needs width fix and light-mode colors

### Annotation light-mode colors (ANNO-03, ANNO-04)
- SimplificationBlock light-mode: bg-indigo-50, border-indigo-200 (per requirement)
- CitationBlock light-mode: bg-stone-50, border-stone-200 (per requirement)
- Dark-mode colors remain as-is (indigo-950/indigo-800 for simplification)

### ActionBubble scroll behavior (TSEL-04, TSEL-05, TSEL-06)
- Switch from position:fixed to position:absolute inside scroll container — bubble moves with text on scroll
- Position computed relative to content wrapper: rect.top - wrapperRect.top + scrollTop
- Instant dismiss (no fade) after user scrolls 100px from original scrollTop position
- Scroll threshold measured from scroll container scrollTop at bubble creation time — dismiss when delta exceeds ±100px
- HighlightOverlay persists independently after bubble dismisses — clears only when user clicks elsewhere (like native text selection behavior)
- Bubble flips below the selection when there's not enough space above (standard tooltip flip behavior)

### Text selection filtering (TSEL-01, TSEL-02, TSEL-03)
- Add data-message-role="assistant" attribute to assistant message wrappers
- Add data-no-selection attribute to annotation blocks, context cards, and UI buttons
- useTextSelection hook checks that selection originates within a data-message-role="assistant" element
- Selecting text in user messages, context cards, annotations, or UI elements does NOT trigger ActionBubble

### Model label (MSGE-01)
- Replace hardcoded "Gemini" in MessageBlock with dynamic value from current provider/model setting
- Label reflects whatever model is active (will be extended in Phase 11 with BYOK)

### Accessibility (XCUT-01, XCUT-02, XCUT-03)
- Minimal approach: aria-labels on all interactive elements + focus-visible outlines
- Mouse remains the primary interaction — no arrow-key navigation or focus trapping
- WCAG AA contrast audit across ALL existing components (full audit, not just new elements)
- Focus-visible outlines use a consistent style (ring-2 ring-offset-2 pattern)

### Test updates (XCUT-04, XCUT-05)
- Dedicated test-update pass at the end of the phase (not inline with each change)
- Update existing E2E tests to match new DOM structure (data-message-role, data-no-selection attributes)
- New tests for: text selection filtering, light-mode annotation rendering

### Claude's Discretion
- Exact hex values for annotation highlight colors (within the warm tones direction: amber/gold, indigo/violet, teal/cyan)
- CSS gradient blend implementation for multi-annotation highlights
- Bubble flip threshold (how much space above is "not enough")
- Focus-visible ring color and offset values
- Which specific elements need aria-labels (Claude audits all interactive elements)

</decisions>

<specifics>
## Specific Ideas

- Highlight colors should feel like highlighter pens — distinct per type but not aggressive. Think amber highlighter for sources, purple highlighter for simplify, teal for deep dive
- Multi-annotation gradient should be subtle enough that it doesn't look like a design error
- The scroll-dismiss at 100px should feel like "you've moved on" — not premature, not delayed
- HighlightOverlay persisting after bubble dismiss mimics native browser text selection behavior — familiar to users

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/branching/ActionBubble.tsx`: Currently position:fixed, needs position:absolute refactor
- `frontend/src/hooks/useTextSelection.ts`: mouseup handler on container, no role filtering — needs data-message-role check
- `frontend/src/components/branching/HighlightOverlay.tsx`: CSS overlay for selection highlight — needs per-type coloring
- `frontend/src/components/annotations/SimplificationBlock.tsx`: Dark-only colors (indigo-950/800) — needs light-mode variants
- `frontend/src/components/annotations/CitationBlock.tsx`: Needs light-mode color variants
- `frontend/src/components/thread/MessageBlock.tsx`: Hardcodes "Gemini" label on line 45 — needs dynamic provider

### Established Patterns
- Dark theme: zinc-900/800/700 backgrounds, light theme: stone-50/100/200 (Phase 6)
- CSS custom properties for theme-aware colors (Phase 6 decision)
- data-paragraph-id on all block elements via rehypeAddParagraphIds (Phase 4/5 — do not mutate)
- data-message-id on message wrappers (Phase 4)
- Annotations stored in Message.annotations array, rendered via MarkdownRenderer (Phase 5)

### Integration Points
- `MessageBlock.tsx` → add data-message-role attribute, change label from "Gemini" to dynamic
- `useTextSelection.ts` → add data-message-role="assistant" check before surfacing bubble
- `ActionBubble.tsx` → change positioning from fixed to absolute, add scroll listener for dismiss
- `HighlightOverlay.tsx` → accept annotation type prop for color selection
- `SimplificationBlock.tsx` / `CitationBlock.tsx` → add dark: prefix variants, remove max-w-[720px]
- All interactive elements → add aria-label attributes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-foundation-fixes*
*Context gathered: 2026-03-11*
