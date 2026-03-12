# Phase 10: Visual Polish - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the sidebar with IDE-grade session tree (gradient bg, styled header, prominent New Chat, relative dates, hover states, thread tree with connecting lines and chevrons), polish message rendering (heading typography, code block copy, table striping, blockquote accent borders, user message timestamps, streaming cursor), and enhance annotation cards (enter animations, SimplificationBlock mode pills and markdown rendering, CitationBlock default-expanded with favicons and domain badges).

</domain>

<decisions>
## Implementation Decisions

### Sidebar gradient and structure
- Subtle gradient: zinc-950 to zinc-900/80 dark, stone-50 to white light (barely perceptible depth, VS Code sidebar feel)
- "Chats" as text-lg font-semibold section header with border-b separator
- "+ New Chat" as full-width rounded-lg button below header with icon, bg-zinc-800 dark / stone-100 light, hover elevation
- Session entries with py-3 vertical padding for comfortable density

### Session entry hover and active states
- Hover: 2px accent-colored left border appears + subtle bg tint
- Active session: persistent 2px left bar using root thread's accentColor + stronger bg tint
- Active thread in tree: same pattern using thread's own accentColor (consistent visual language)

### Relative date display
- Smart relative format: <1h = "Xm ago", <24h = "Xh ago", <48h = "Yesterday", <7d = day name ("Tue"), <1yr = "Mar 5", older = "Dec 15, 2025"
- No external library needed — simple formatRelativeDate utility function

### Thread tree visual language
- Thin solid connecting lines: 1px solid zinc-700 dark / stone-300 light
- Vertical line from parent, horizontal stub to child (VS Code file tree style)
- 16px indent per depth level
- Small chevron icon (6-8px) with CSS rotation transition (90deg when expanded, duration-150)
- Accent-color circle pip (6px) inline after chevron, before thread title

### Thread tree interactions
- 3-dot menu: opacity-0 group-hover:opacity-100 fade-in on row hover
- Delete confirmation: centered modal dialog with backdrop overlay ("Delete this thread?" + Cancel/Delete buttons)
- Modal mentions cascading effect: "This will delete the thread and all child branches"

### Code block copy-to-clipboard
- Header bar above code: language label on left, copy icon on right
- Header always visible (not hover-only)
- Click replaces icon with "Copied!" checkmark inline for 2 seconds
- Uses navigator.clipboard.writeText API

### Heading typography in AI messages
- h1: text-xl font-bold, mt-6 mb-2
- h2: text-lg font-semibold, mt-6 mb-2, thin border-b (border-zinc-700 dark / border-stone-300 light)
- h3: text-base font-semibold, mt-4 mb-1
- Clear visual hierarchy within message content

### Table and list styling
- Tables: min-w-full, subtle row striping (even:bg-stone-50 dark:even:bg-zinc-800/50)
- List items: space-y-1.5 for breathing room, clear nested indentation

### Blockquote styling
- 3px left border using current thread's accentColor (dynamic, not fixed)
- Italic text, pl-4 padding, text-zinc-400 dark / text-stone-500 light
- Visual cohesion with pills and ancestor rails through accent color usage

### User message enhancements
- whitespace-pre-wrap break-words for long strings (MSGE-07)
- Hover timestamp: small relative time appears below bubble on hover (text-xs, text-zinc-500)
- Uses same smart relative date format as sidebar

### Streaming cursor
- Blinking vertical bar (|) instead of underscore, animation: blink 1s step-end infinite
- Keep existing bounce dots for empty state (no content yet)

### Annotation card enter animation
- Slide up 8px + fade in over 200ms ease-out on mount
- CSS @keyframes slideUpFade: from(opacity:0, translateY(8px)) to(opacity:1, translateY(0))
- Applies to both SimplificationBlock and CitationBlock

### SimplificationBlock mode pills
- Always-visible horizontal row of 4 mode pills below simplified text
- Active mode: filled bg (indigo tint), others: outlined
- No "Try another mode" toggle button needed — pills always visible
- Current active mode shown as small colored badge in header (ANNO-07)

### SimplificationBlock markdown rendering
- Simplified text rendered with MarkdownRenderer (ANNO-08)
- Pass skipAnnotations=true flag to prevent infinite annotation nesting
- Allows code, lists, bold/italic in simplified explanations

### CitationBlock default expanded
- Defaults to expanded, not collapsed (ANNO-10)
- Still collapsible via header toggle (chevron flips)
- Each source: 16px favicon via Google S2 Favicons API, title as blue link, snippet preview, domain badge (rounded-full, stone bg)
- Citation note: soft callout box at bottom with speech bubble icon

### Claude's Discretion
- Exact favicon API URL format and fallback for missing favicons
- Domain badge exact styling (padding, font size within rounded-full)
- Code block header bar exact colors and padding
- Modal dialog animation (slide-down? fade? instant?)
- Snippet preview truncation length in CitationBlock
- Whether chevron icon is an SVG or Unicode character

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SessionHistory.tsx`: Has ThreeDotButton, DropdownMenu, InlineEdit, ThreadNode components — all need visual upgrade, structure is solid
- `MarkdownRenderer.tsx`: react-markdown + remarkGfm + react-syntax-highlighter with Prism. Paragraph ID tracking via rehypeAddParagraphIds. Copy button hooks into code block rendering
- `StreamingCursor.tsx`: Existing bounce dots + underscore blink — cursor style changes, dots stay
- `SimplificationBlock.tsx`: Has mode picker (4 modes), target text quote — needs pill layout and markdown rendering
- `CitationBlock.tsx`: Has expand/collapse, source links, citation note — needs default-expanded, favicon, domain badges
- `theme.ts`: 8-color accent palette with getNextAccentColor() — used for blockquote borders, session active bars, thread pips

### Established Patterns
- Dark theme: zinc-900/800/700, light: stone-50/100/200 (Phase 6/8)
- Annotation colors: amber=sources, indigo=simplify, teal=go-deeper (Phase 8)
- data-no-selection on annotation blocks (Phase 8)
- data-paragraph-id on all block elements (Phase 4/5)
- CSS transitions via Tailwind utility classes
- group/group-hover pattern for hover-reveal elements

### Integration Points
- `SessionHistory.tsx` — gradient bg, header, button, date format, hover states, tree lines
- `MarkdownRenderer.tsx` — heading components, code block wrapper with header, table striping, blockquote accent, list spacing
- `SimplificationBlock.tsx` — mode pill row, markdown rendering with skipAnnotations
- `CitationBlock.tsx` — default expanded, favicon/badge per source, callout note
- `MessageBlock.tsx` — user message whitespace-pre-wrap, hover timestamp, accent color prop for blockquotes
- `StreamingCursor.tsx` — bar cursor style change
- `AppShell.tsx` — may need minor sidebar container updates for gradient

</code_context>

<specifics>
## Specific Ideas

- Sidebar should feel like VS Code's sidebar — subtle gradient, prominent active indicators, IDE-grade file tree
- Code blocks should feel like GitHub's — header bar with language and copy, clean separation from content
- Thread tree connecting lines should match VS Code's indentation guides — thin, solid, unobtrusive
- Annotation slide-up animation should be subtle, not flashy — "appears naturally" not "announces itself"
- Blockquote accent colors matching the thread creates visual cohesion throughout the conversation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-visual-polish*
*Context gathered: 2026-03-12*
