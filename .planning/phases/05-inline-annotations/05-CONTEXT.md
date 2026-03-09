# Phase 5: Inline Annotations - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the existing ActionBubble stub buttons (Find Sources, Simplify) to real API calls. Inject citation blocks and simplification blocks below annotated paragraphs. Both block types persist in the message, remain re-selectable for further actions, and do not break `data-paragraph-id` stability or gutter pill positioning. Error and loading states are inline, not toasts.

</domain>

<decisions>
## Implementation Decisions

### Simplify mode selection flow
- Clicking "Simplify" in the ActionBubble expands the bubble **in-place**: the 3-button row morphs to show 4 mode buttons (Simpler, Example, Analogy, Technical) plus a ← back arrow
- ← back arrow returns the bubble to the original 3-button view (user can change their mind)
- Clicking outside the bubble dismisses it entirely (same as current dismiss behavior)
- Mode buttons show **label only**; hovering reveals a 1-line tooltip explaining the mode (e.g. "Uses shorter sentences and simpler words")

### Simplification output location
- Simplified text does **NOT** replace the original paragraph inline
- A distinct simplification block appears **below the paragraph** — both original and simplified are visible simultaneously, no toggle needed

### Simplification block visual
- Tinted background + left border accent bar (blockquote-inspired, styled distinctly from AI prose)
- Header line: `✎ Simplified • [Mode name]  [Try another mode]`
- Clicking "Try another mode" re-opens the mode selection (bubble-style expansion or inline mode picker — Claude's discretion)
- If multiple simplifications are requested (user tries another mode), the block updates to the latest result

### Citation block layout
- Collapsible; **default state: collapsed** → single-line pill: `🔎 3 sources found ▼`
- Expanded layout:
  - 3 source rows: clickable title (↗ opens URL in new tab) + domain badge (`nature.com`)
  - Horizontal divider
  - Gemini-generated note below the sources, prefixed with 💬 icon
- Toggle (▲/▼) is at the block header

### Multiple annotation blocks per paragraph
- A paragraph can have **both** a citation block and a simplification block simultaneously
- Stacking order below the paragraph: citation block first, simplification block below (creation order)
- Each block is independent — removing one does not affect the other

### Loading states
- While Tavily or Simplify API responds, a **skeleton/shimmer placeholder block** appears in the block's position below the paragraph
- Same border/shape as the final block, with animated shimmer lines

### Error states
- On API failure: inline error block in the same position as the placeholder
- Content: `⚠ Couldn't load sources — [Retry]` (or equivalent for Simplify)
- Muted red/orange border treatment
- Clicking Retry re-triggers the same API call

### Re-selectability
- Both citation blocks and simplification blocks must not interfere with `data-paragraph-id` on the original paragraph element
- The original paragraph remains selectable for Go Deeper / Find Sources / Simplify after annotation

### Claude's Discretion
- Exact tint color for simplification block (suggested: amber or indigo tint, muted — must not clash with accent palette)
- "Try another mode" interaction detail (inline re-expand vs mini popover)
- Tooltip copy for each mode
- Exact dismiss/remove behavior for annotation blocks (whether user can close/dismiss a block)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api/search.ts` — `searchSources({ query }, getToken)` → `ApiResponse<SearchResult[]>` — fully implemented, hits `/api/find-sources`
- `frontend/src/api/simplify.ts` — `simplifyText({ text, mode }, getToken)` → `ApiResponse<{ text }>` — supports all 4 modes
- `frontend/src/types/index.ts` — `Annotation` type fully defined: `type`, `targetText`, `paragraphIndex`, `originalText`, `replacementText`, `citationNote`, `sources: SourceResult[]`, `isShowingOriginal`
- `frontend/src/types/index.ts` — `SourceResult`: `title`, `url`, `domain`, `snippet` — maps directly to Tavily response shape
- `frontend/src/components/branching/ActionBubble.tsx` — stub buttons for Find Sources and Simplify already present; needs real onClick handlers + expanded-mode state
- `frontend/src/components/ui/ConfirmDialog.tsx` — portal-based modal pattern (reference for any overlay UI needed in this phase)

### Established Patterns
- `Message.annotations: Annotation[]` already in the store shape — needs store actions to add/update annotations
- `getToken` passed as function parameter into all API modules (not called inside hooks directly)
- `data-paragraph-id` on every block-level element via `rehypeAddParagraphIds` in `MarkdownRenderer.tsx` — **do not mutate this mechanism**
- Flat Zustand store: add `addAnnotation(messageId, annotation)` and `updateAnnotation(messageId, annotationId, patch)` actions
- Dark theme: zinc-900/800/700 backgrounds — annotation blocks must match dark theme
- `useAuth().getToken` pattern from Phase 2 for passing auth token into API layer

### Integration Points
- `ActionBubble.tsx` → wire Find Sources and Simplify onClick to real API calls; add expanded-mode state for 4-button simplify picker
- `MessageBlock.tsx` → render annotation blocks below the AI bubble based on `message.annotations`
- New `AnnotationBlock.tsx` (or two components: `CitationBlock.tsx`, `SimplificationBlock.tsx`) → render below paragraph content
- `sessionStore.ts` → add `addAnnotation` / `updateAnnotation` actions; `summarizeThread` / `compactThread` stubs already exist (added in quick task 2)
- Backend `/api/find-sources` and `/api/simplify` — already implemented in Phase 1; frontend just needs to call them

</code_context>

<specifics>
## Specific Ideas

- The simplification block should feel like a "code block for ideas" — same level of visual distinctness as a fenced code block in Markdown, but for rewritten prose
- Bubble expand-in-place for mode selection: the bubble changes its content but stays anchored to the same screen position near the selection
- "Both visible at once" for simplification is intentional — users are researchers who want to compare, not replace
- Citation block collapsed by default keeps message view from getting noisy when many paragraphs are sourced

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-inline-annotations*
*Context gathered: 2026-03-09*
