# Phase 9: Layout & Positioning - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate branch pills from JS-measured absolute positioning to CSS Grid layout, replace the current 200ms horizontal slide thread transition with a gentle crossfade, and redesign ancestor panels as collapsible hover-expand rails. No new features — this is a layout and interaction quality pass on existing branching infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Branch pill grid layout
- Two-column CSS Grid always present: `grid-template-columns: 1fr auto`
- Pill column collapses to 0px when no pills exist — no layout shift when branches are created
- No extra right padding (pr-[80px]/pr-[140px]) needed — grid cells don't overlap, so the 1fr/auto split handles separation naturally
- Each MessageBlock becomes a grid row; pills sit in the right cell of the same row as the message they branch from
- Multiple pills anchored to the same message stack vertically in that cell
- No JS measurement or ResizeObserver needed — CSS Grid handles alignment

### Branch pill appearance
- Compact: accent pip + truncated title (max ~20 chars) + message count badge
- Width ~140-180px (auto column), matching current desktop pill size
- Descendant pills collapsed by default — expand on parent pill hover (slide down below parent)
- Only direct branch pills visible until explored

### Thread transition
- Simple opacity fade: old thread fades out (opacity 1→0), new thread fades in (opacity 0→1), ~150ms total
- Replaces current 200ms horizontal slide entirely
- Interruptibility: snap to new target — cancel current fade immediately, snap old to invisible, start fading in new target
- Scroll position restored when returning to a previously visited thread (sessionStore.setScrollPosition already exists)
- New threads start at top
- Crossfade applies to main ThreadView content only — ancestor panels update instantly

### Ancestor rail design
- Collapsed: thin accent stripe only (2-3px) on right edge of a 24-32px rail
- Background subtle (zinc-900/slate-50), no text, no icons in collapsed state
- Hover expands to ~220px with 200ms ease-out CSS transition (per ANCS-02)
- Expanded panel floats over main content as overlay (position:absolute), shadow-lg, rounded right edge (per ANCS-03)
- Main content stays in place — panel is a layer on top, not pushing content sideways
- Bottom fade gradient matches panel background color (per ANCS-04)
- Hover expands panel (read-only peek), click navigates to that ancestor thread
- Minimum text size is text-xs (12px) — no text-[10px] (per ANCS-06)

### Anchor message highlight (expanded panel)
- Larger text: text-sm vs text-xs for other messages
- Thick left border in accent color
- Pill-shaped "↗ branch" badge below the anchor message text
- Makes the branch point unmistakable in the expanded panel

### Hover preview cards
- Auto-flip positioning: default below pill, flip above when near viewport bottom
- Simple getBoundingClientRect vs window.innerHeight check — no library needed
- CSS border-triangle pointer (6px) pointing up toward pill (or down when flipped)
- Content: anchor text (italic, truncated) + first user message + first AI response line (current content preserved)

### Claude's Discretion
- Exact CSS Grid gap/spacing values
- Rail hover detection area (whether the full 24-32px width is the hover target or just the stripe)
- Descendant pill slide-down animation timing
- Preview card max-width and text truncation lengths
- Whether to dim main content behind expanded ancestor panel overlay

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GutterColumn.tsx`: Current pill implementation with LeadPill, DescendantPill, measurePillTop, ResizeObserver — will be rewritten to use CSS Grid instead of absolute positioning
- `AncestorPeekPanel.tsx`: Current ancestor panel with highlight message, bottom fade, context menu — will be refactored into rail + overlay pattern
- `ThreadView.tsx`: Current slide transition (`transition-transform duration-200 ease-out`) — will be replaced with opacity crossfade
- `sessionStore.ts`: `setScrollPosition` and per-thread `scrollPosition` already implemented for scroll restoration

### Established Patterns
- Tailwind CSS for all styling (dark: prefix for theme variants)
- Zustand flat store for state (threads, messages, activeThreadId)
- position:absolute inside position:relative wrapper for scroll-synced elements (HighlightOverlay, ActionBubble)
- CSS transitions via Tailwind utility classes (transition-*, duration-*, ease-*)

### Integration Points
- `ThreadView.tsx` renders GutterColumn inside contentWrapperRef — grid migration affects this wrapper structure
- `ThreadView.tsx` slide transition state (lines 72+, 313+, 392+) — replaced with opacity fade state
- `AncestorPeekPanel` is rendered by parent layout component alongside ThreadView — rail redesign changes this relationship
- `MessageBlock.tsx` already has data-message-id and data-paragraph-id attributes used by pill positioning

</code_context>

<specifics>
## Specific Ideas

- The grid approach eliminates the entire JS measurement pipeline (measurePillTop, ResizeObserver, pillPositions ref, posVersion state) — a significant simplification
- Ancestor rails should feel like IDE sidebar indicators (VS Code's minimap rail) — present but not demanding attention until hovered
- Crossfade should feel instant and light — not a "page transition" but a "content swap"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-layout-positioning*
*Context gathered: 2026-03-12*
