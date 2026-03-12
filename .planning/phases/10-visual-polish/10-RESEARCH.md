# Phase 10: Visual Polish - Research

**Researched:** 2026-03-12
**Domain:** CSS styling, Tailwind utility classes, React component visual upgrades, clipboard API, CSS animations
**Confidence:** HIGH

## Summary

Phase 10 is a pure frontend visual polish phase touching four component areas: sidebar redesign (SessionHistory + AppShell), message rendering enhancements (MarkdownRenderer + MessageBlock + StreamingCursor), and annotation card improvements (SimplificationBlock + CitationBlock). All changes are CSS/JSX-level modifications to existing components with no new dependencies required.

The existing codebase already has all the structural scaffolding. SessionHistory.tsx has ThreadNode with expand/collapse and 3-dot menus. MarkdownRenderer.tsx has custom component overrides for every markdown element. SimplificationBlock and CitationBlock both exist with working functionality. The work is upgrading visual presentation, adding a clipboard copy button, switching to a modal delete confirmation, adding CSS animations, and wiring in favicons/domain badges.

**Primary recommendation:** Treat this as four independent CSS/JSX upgrade tasks (sidebar visuals, thread tree interactions, markdown rendering, annotation enhancements) with zero new npm dependencies. Use navigator.clipboard.writeText for copy, CSS @keyframes for animations, and Google S2 Favicons API for favicons.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Sidebar gradient: zinc-950 to zinc-900/80 dark, stone-50 to white light
- "Chats" as text-lg font-semibold section header with border-b
- "+ New Chat" as full-width rounded-lg button with icon, bg-zinc-800 dark / stone-100 light
- Session entries: py-3 vertical padding
- Hover: 2px accent-colored left border + subtle bg tint
- Active session: persistent 2px left bar using root thread's accentColor + stronger bg tint
- Smart relative date format: <1h="Xm ago", <24h="Xh ago", <48h="Yesterday", <7d=day name, <1yr="Mar 5", older="Dec 15, 2025"
- No external library for relative dates
- Thin solid connecting lines: 1px solid zinc-700 dark / stone-300 light
- VS Code file tree style: vertical line from parent, horizontal stub to child
- 16px indent per depth level (already in ThreadNode)
- Small chevron (6-8px) with CSS rotation transition (90deg expanded, duration-150)
- Accent-color circle pip (6px) inline after chevron, before thread title
- 3-dot menu: opacity-0 group-hover:opacity-100 fade-in
- Delete confirmation: centered modal dialog with backdrop overlay
- Code block header bar: language label left, copy icon right, always visible
- Click replaces icon with "Copied!" checkmark for 2 seconds
- navigator.clipboard.writeText API
- Heading typography: h1=text-xl font-bold mt-6 mb-2, h2=text-lg font-semibold mt-6 mb-2 with border-b, h3=text-base font-semibold mt-4 mb-1
- Table striping: even:bg-stone-50 dark:even:bg-zinc-800/50
- List items: space-y-1.5
- Blockquote: 3px left border using thread accentColor (dynamic), italic, pl-4, text-zinc-400/text-stone-500
- User message: whitespace-pre-wrap break-words
- Hover timestamp: text-xs text-zinc-500 relative time below bubble
- Streaming cursor: blinking vertical bar (|), animation: blink 1s step-end infinite
- Annotation enter animation: slide up 8px + fade in 200ms ease-out, CSS @keyframes slideUpFade
- SimplificationBlock: always-visible mode pills, active=filled bg (indigo tint), others=outlined
- SimplificationBlock: rendered with MarkdownRenderer + skipAnnotations=true flag
- SimplificationBlock: small colored badge in header for active mode
- CitationBlock: defaults expanded (useState(true))
- CitationBlock: 16px favicon via Google S2 Favicons API, title as blue link, snippet preview, domain badge (rounded-full, stone bg)
- CitationBlock: citation note as soft callout box with speech bubble icon

### Claude's Discretion
- Exact favicon API URL format and fallback for missing favicons
- Domain badge exact styling (padding, font size within rounded-full)
- Code block header bar exact colors and padding
- Modal dialog animation (slide-down? fade? instant?)
- Snippet preview truncation length in CitationBlock
- Whether chevron icon is an SVG or Unicode character

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIDE-01 | Sidebar gradient background | Apply gradient via Tailwind bg-gradient-to-b on aside element in AppShell |
| SIDE-02 | "Chats" prominent section header | Upgrade existing header div in AppShell to text-lg font-semibold |
| SIDE-03 | "+ New Chat" styled button | Upgrade existing button in AppShell with rounded-lg, bg colors, hover elevation |
| SIDE-04 | Session entries py-3, hover left-colored bar | Modify SessionHistory session button styling |
| SIDE-05 | Active session 2px accent left border + tint | Use root thread accentColor from theme.ts palette |
| SIDE-06 | Relative date display | New formatRelativeDate utility function, no library needed |
| SIDE-07 | Chevron icons with rotation transition | Replace Unicode triangles with SVG chevron + CSS transform rotate |
| SIDE-08 | Accent-color pip inline | Add 6px circle span with thread.accentColor as backgroundColor |
| SIDE-09 | Active thread row left-border + bg tint | Same pattern as SIDE-05 but per-thread accentColor |
| SIDE-10 | Thin connecting lines | CSS pseudo-elements or absolute-positioned divs for tree lines |
| SIDE-11 | 3-dot menu hover-only appearance | Add opacity-0 group-hover:opacity-100 to ThreeDotButton |
| SIDE-12 | Modal delete confirmation | Replace inline Yes/No with centered modal overlay with backdrop |
| MSGE-02 | Heading visual weight | Custom h1/h2/h3 components in MarkdownRenderer with specified typography |
| MSGE-03 | Code block copy button | Wrap code in container with header bar, navigator.clipboard.writeText |
| MSGE-04 | List spacing and indentation | Add space-y-1.5 to ul/ol components, nested list indentation classes |
| MSGE-05 | Table row striping | Add even:bg-stone-50 dark:even:bg-zinc-800/50 to tr elements |
| MSGE-06 | Blockquote accent border | Dynamic border-left using thread accentColor via style prop |
| MSGE-07 | User message whitespace-pre-wrap | Already partially done (line 65), add break-words |
| MSGE-08 | User message hover timestamp | Add group class + hidden group-hover:block timestamp element |
| MSGE-09 | Streaming cursor blink animation | Change underscore to pipe character in StreamingCursor |
| ANNO-06 | Annotation enter animation | CSS @keyframes slideUpFade applied via className on mount |
| ANNO-07 | Simplification mode badge in header | Small colored badge/tag next to "Simplified" label |
| ANNO-08 | Simplified text rendered with MarkdownRenderer | Import MarkdownRenderer, pass skipAnnotations flag |
| ANNO-09 | Mode pills always visible | Remove toggle, always show pill row below content |
| ANNO-10 | CitationBlock defaults expanded | Change useState(false) to useState(true) |
| ANNO-11 | Favicon, title link, snippet, domain badge | Google S2 Favicons + styling per source row |
| ANNO-12 | Citation note soft callout | Styled div with speech bubble icon, muted bg |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in use |
| Tailwind CSS | 4.2.1 | Utility-first CSS | Already in use, all styling is Tailwind |
| react-markdown | 10.1.0 | Markdown rendering | Already in use in MarkdownRenderer |
| react-syntax-highlighter | 16.1.1 | Code block highlighting | Already in use with Prism |
| zustand | 5.0.11 | State management | Already in use |

### No New Dependencies
This phase requires zero new npm packages. All functionality is achievable with:
- Tailwind CSS utility classes (gradients, animations, transitions)
- CSS @keyframes (slideUpFade animation, blink cursor)
- navigator.clipboard.writeText (browser API)
- Google S2 Favicons API (external URL, no package needed)
- Date arithmetic (native JS Date)

## Architecture Patterns

### Recommended File Changes
```
frontend/src/
  components/
    layout/AppShell.tsx          # Sidebar gradient, header, New Chat button styling
    history/SessionHistory.tsx   # Session entries, ThreadNode tree, modal delete
    thread/MarkdownRenderer.tsx  # Heading typography, code copy, table/list/blockquote
    thread/MessageBlock.tsx      # User message whitespace, hover timestamp
    thread/StreamingCursor.tsx   # Pipe cursor instead of underscore
    annotations/SimplificationBlock.tsx  # Mode pills, markdown rendering, badge
    annotations/CitationBlock.tsx        # Default expanded, favicons, domain badges
  utils/
    formatRelativeDate.ts        # NEW: shared date formatting utility
  index.css                      # NEW: @keyframes slideUpFade animation
```

### Pattern 1: Shared Relative Date Formatter
**What:** Extract formatRelativeDate into a utility so both sidebar dates and hover timestamps use the same logic
**When to use:** Any time a relative date is shown (session entries, user message hover)
**Example:**
```typescript
// frontend/src/utils/formatRelativeDate.ts
export function formatRelativeDate(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 2) return 'Yesterday';
  if (diffDay < 7) {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  }
  const d = new Date(date);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  if (sameYear) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
```

### Pattern 2: Code Block Copy with Feedback
**What:** Wrap code blocks in a container with header bar and copy button
**When to use:** MarkdownRenderer code component for block-level code
**Example:**
```typescript
// Inside MarkdownRenderer components.code
function CodeBlockWithCopy({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-700 text-xs text-zinc-400">
        <span>{language}</span>
        <button onClick={handleCopy} className="hover:text-zinc-200 transition-colors">
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language} PreTag="div">
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
```

### Pattern 3: CSS Animation for Annotation Cards
**What:** Define slideUpFade keyframes in index.css, apply via className
**When to use:** SimplificationBlock and CitationBlock wrapper divs
**Example:**
```css
/* index.css */
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up-fade {
  animation: slideUpFade 200ms ease-out both;
}
```

### Pattern 4: Tree Connecting Lines via CSS
**What:** Vertical and horizontal connecting lines using absolute-positioned pseudo-elements or wrapper divs
**When to use:** ThreadNode in SessionHistory for VS Code-style tree hierarchy
**Example:**
```typescript
// ThreadNode connecting lines approach: wrapper divs with absolute positioning
// Vertical line: spans from parent to last child
// Horizontal stub: from vertical line to node content
<div className="relative" style={{ paddingLeft: thread.depth * 16 }}>
  {thread.depth > 0 && (
    <>
      {/* Vertical line from parent */}
      <div
        className="absolute border-l border-zinc-700 dark:border-zinc-600"
        style={{ left: (thread.depth - 1) * 16 + 7, top: 0, bottom: '50%' }}
      />
      {/* Horizontal stub to this node */}
      <div
        className="absolute border-t border-zinc-700 dark:border-zinc-600"
        style={{ left: (thread.depth - 1) * 16 + 7, top: '50%', width: 9 }}
      />
    </>
  )}
  {/* node content */}
</div>
```

### Pattern 5: Modal Delete Confirmation
**What:** Centered modal overlay replacing inline Yes/No buttons for SIDE-12
**When to use:** Delete confirmation in both session and thread context menus
**Example:**
```typescript
function DeleteModal({ open, onConfirm, onCancel, message }: DeleteModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <h3 className="text-sm font-semibold mb-2">Delete this thread?</h3>
        <p className="text-xs text-zinc-500 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded ...">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm rounded bg-red-500 text-white ...">Delete</button>
        </div>
      </div>
    </div>
  );
}
```

### Pattern 6: Google S2 Favicons API
**What:** Fetch 16px favicons for citation sources via external Google API
**URL format:** `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
**Fallback:** Use a generic globe icon SVG when the image fails to load (onError handler)
**Example:**
```typescript
<img
  src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=16`}
  alt=""
  width={16}
  height={16}
  className="flex-shrink-0"
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
/>
```

### Pattern 7: Dynamic Accent Color for Blockquotes
**What:** Pass thread accentColor through to MarkdownRenderer for blockquote left-border
**When to use:** MarkdownRenderer blockquote component needs runtime accentColor
**Example:**
```typescript
// MarkdownRenderer receives accentColor prop
// blockquote component uses inline style for dynamic border color
blockquote({ children, ...props }) {
  const n = getPId(props);
  return (
    <>
      <blockquote
        {...props}
        className="pl-4 italic text-zinc-400 dark:text-stone-500"
        style={{ borderLeft: `3px solid ${accentColor || '#6B609A'}` }}
      >
        {children}
      </blockquote>
      {annotationsAfter(n)}
    </>
  );
},
```

### Anti-Patterns to Avoid
- **Importing a date library for simple relative dates:** The format spec is well-defined with 6 tiers. A 20-line utility handles it. No dayjs/date-fns needed.
- **Using position:fixed for the delete modal on a scrollable sidebar:** Use position:fixed on a portal or ensure the modal is outside the overflow:auto container.
- **Creating separate components for every visual tweak:** Most changes are CSS class modifications on existing elements. Only create new components when logic is involved (CodeBlockWithCopy, DeleteModal, formatRelativeDate).
- **Hardcoding accent colors in blockquotes:** Must be dynamic from the current thread's accentColor to maintain visual cohesion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer | react-syntax-highlighter (already installed) | Prism handles 200+ languages |
| Markdown parsing | Custom parser | react-markdown (already installed) | GFM tables, headings, lists all handled |
| CSS animations | JS-based animation lib | CSS @keyframes + Tailwind classes | 200ms fade/slide is trivial in CSS |
| Clipboard | Custom selection/copy | navigator.clipboard.writeText | Browser standard, works in all modern browsers |
| Favicons | Favicon scraping | Google S2 Favicons API | Reliable, cached, no CORS issues |

## Common Pitfalls

### Pitfall 1: MarkdownRenderer Re-render Explosion
**What goes wrong:** Adding state (useState for copy button) inside MarkdownRenderer's component overrides causes the entire markdown tree to re-render on every state change.
**Why it happens:** react-markdown creates fresh component instances from the components prop on each render.
**How to avoid:** Extract CodeBlockWithCopy as a separate named component defined OUTSIDE MarkdownRenderer, not inline. The existing MarkdownRenderer is wrapped in React.memo, which helps, but inline state in component overrides can still trigger re-renders.
**Warning signs:** Visible flicker in markdown content when clicking copy.

### Pitfall 2: Clipboard API Requires Secure Context
**What goes wrong:** navigator.clipboard.writeText fails silently or throws in non-HTTPS environments.
**Why it happens:** Clipboard API requires secure context (HTTPS or localhost).
**How to avoid:** This app runs on localhost (dev) and HTTPS (production on AWS), so this is fine. But add a try/catch for safety and fall back gracefully.
**Warning signs:** Copy button does nothing in some environments.

### Pitfall 3: Tree Connecting Lines Misalignment
**What goes wrong:** Vertical connecting lines don't align with child nodes, or extend too far past the last child.
**Why it happens:** Mixing CSS absolute positioning with dynamic padding-left indentation is fragile.
**How to avoid:** Use consistent depth * 16px math for line positions. The vertical line should start at the parent row center and end at the last child row center. Consider using a simpler approach: a continuous vertical border-left on the children container, with individual horizontal stubs.
**Warning signs:** Lines overshooting, gaps between line segments.

### Pitfall 4: Accent Color Not Available in MarkdownRenderer
**What goes wrong:** Blockquote border needs the current thread's accentColor, but MarkdownRenderer doesn't receive it.
**Why it happens:** MarkdownRenderer currently receives content, annotations, underlineMap, etc. but no accentColor.
**How to avoid:** Add an optional `accentColor` prop to MarkdownRenderer. MessageBlock already has access to threads via useSessionStore and can look up the active thread's color.
**Warning signs:** All blockquotes showing the same hardcoded color.

### Pitfall 5: skipAnnotations Flag in SimplificationBlock Markdown
**What goes wrong:** Rendering MarkdownRenderer inside SimplificationBlock triggers annotation injection, causing infinite nesting.
**Why it happens:** MarkdownRenderer injects annotations after paragraphs. If SimplificationBlock renders replacement text through MarkdownRenderer without a skip flag, it would try to inject annotations again.
**How to avoid:** Add a `skipAnnotations` prop to MarkdownRenderer. When true, skip the annotationsAfter() calls entirely and just render plain markdown. Pass empty annotations array or check the flag.
**Warning signs:** Infinite render loop or duplicate annotation blocks.

### Pitfall 6: Modal Portal vs Sidebar Overflow
**What goes wrong:** Delete modal renders inside the sidebar's overflow-y-auto container and gets clipped.
**Why it happens:** The modal is rendered as a child of a scrollable, overflow-hidden container.
**How to avoid:** Use `position: fixed` on the modal + backdrop. This escapes the sidebar's overflow context. Alternatively use React portals (createPortal to document.body), but fixed positioning is simpler and sufficient.
**Warning signs:** Modal appearing cut off or behind sidebar scroll.

### Pitfall 7: Tailwind v4 Gradient Syntax
**What goes wrong:** bg-gradient-to-b from-zinc-950 to-zinc-900/80 may need Tailwind v4 syntax verification.
**Why it happens:** Tailwind v4 changed some gradient utilities.
**How to avoid:** In Tailwind v4, gradients use `bg-linear-to-b` instead of `bg-gradient-to-b`. Verify the exact syntax. Alternatively use a CSS custom property or inline style: `background: linear-gradient(to bottom, ...)`.
**Warning signs:** Gradient not applying, classes being purged.

## Code Examples

### Existing Code Touchpoints (verified from source)

**SessionHistory.tsx ThreadNode (line 204-302):** Already has expand/collapse with Unicode triangles, depth-based paddingLeft (16px per level), isActive styling, ThreeDotButton. Needs: chevron SVG with rotation, accent pip, connecting lines, modal delete.

**MarkdownRenderer.tsx (line 188-264):** Already has custom components for p, h1-h6, ul, ol, blockquote, table, pre, code. All include annotationsAfter() calls. Needs: heading typography classes, code block wrapper with copy, table striping on tr, blockquote accent border, list spacing.

**MessageBlock.tsx (line 64-65):** User message already has `whitespace-pre-wrap` on content paragraph. Needs: `break-words` added, hover timestamp element, group class for hover trigger.

**StreamingCursor.tsx (line 29-36):** Already has blink keyframe animation defined. Just change `_` to `|` character.

**SimplificationBlock.tsx (line 31-83):** Has mode picker behind "Try another mode" toggle. Needs: remove toggle, always show pills, add MarkdownRenderer for replacementText, add mode badge in header.

**CitationBlock.tsx (line 27):** `useState(false)` controls expanded state. Change to `useState(true)` for ANNO-10. Needs: favicon img, snippet preview, domain badge styling, callout note styling.

**AppShell.tsx (line 68-97):** Sidebar aside element with bg-white/bg-zinc-950. Has "Chats" header and "+ New Chat" button. Needs: gradient bg, styled header, styled button.

### Chevron SVG for Thread Tree
```typescript
// Small inline SVG chevron (6-8px visual size)
<svg
  className={`w-3 h-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
  viewBox="0 0 16 16"
  fill="currentColor"
>
  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" />
</svg>
```

### Accent-Color Pip
```typescript
<span
  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
  style={{ backgroundColor: thread.accentColor }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 bg-gradient-to-b | Tailwind v4 bg-linear-to-b | Tailwind v4 (2024) | Gradient class name changed |
| document.execCommand('copy') | navigator.clipboard.writeText | All modern browsers | Async API, requires secure context |

**Tailwind v4 note:** This project uses Tailwind v4.2.1. The gradient utility syntax changed. Use `bg-linear-to-b` or inline `style={{ background: 'linear-gradient(...)' }}`. Verify which syntax the project's Tailwind config supports by checking if `@import "tailwindcss"` is used (it is, in index.css line 1), confirming v4 usage.

## Open Questions

1. **Tailwind v4 gradient utility exact syntax**
   - What we know: Tailwind v4 uses `bg-linear-to-b` instead of `bg-gradient-to-b`
   - What's unclear: Whether the project's Tailwind v4 setup supports the old syntax as a compat alias
   - Recommendation: Use inline `style={{ background: 'linear-gradient(to bottom, ...)' }}` as a safe fallback, or test `bg-linear-to-b` first

2. **Google S2 Favicons API reliability**
   - What we know: `https://www.google.com/s2/favicons?domain=DOMAIN&sz=16` is widely used
   - What's unclear: Whether it has rate limits or availability guarantees
   - Recommendation: Always provide onError fallback (hide img, show generic icon)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | frontend/vitest.config.ts |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIDE-01 | Sidebar gradient background | manual-only | Visual CSS check | N/A |
| SIDE-02 | Chats header styling | manual-only | Visual CSS check | N/A |
| SIDE-03 | New Chat button styling | manual-only | Visual CSS check | N/A |
| SIDE-04 | Session entry hover states | manual-only | Visual CSS check | N/A |
| SIDE-05 | Active session accent bar | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | No - Wave 0 |
| SIDE-06 | Relative date display | unit | `cd frontend && npx vitest run tests/unit/formatRelativeDate.test.ts -x` | No - Wave 0 |
| SIDE-07 | Chevron rotation | manual-only | Visual CSS check | N/A |
| SIDE-08 | Accent pip display | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | No - Wave 0 |
| SIDE-09 | Active thread highlight | unit | Same as SIDE-05 | No - Wave 0 |
| SIDE-10 | Connecting lines | manual-only | Visual CSS check | N/A |
| SIDE-11 | 3-dot hover opacity | manual-only | Visual CSS check | N/A |
| SIDE-12 | Modal delete confirmation | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | No - Wave 0 |
| MSGE-02 | Heading typography | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | Exists |
| MSGE-03 | Code copy button | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | Exists |
| MSGE-04 | List spacing | manual-only | Visual CSS check | N/A |
| MSGE-05 | Table striping | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | Exists |
| MSGE-06 | Blockquote accent border | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | Exists |
| MSGE-07 | User whitespace-pre-wrap | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | Exists |
| MSGE-08 | User hover timestamp | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | Exists |
| MSGE-09 | Streaming cursor blink | manual-only | Visual animation check | N/A |
| ANNO-06 | Annotation enter animation | manual-only | Visual animation check | N/A |
| ANNO-07 | Mode badge in header | unit | `cd frontend && npx vitest run tests/unit/SimplificationBlock.test.tsx -x` | No - Wave 0 |
| ANNO-08 | Markdown in SimplificationBlock | unit | Same as ANNO-07 | No - Wave 0 |
| ANNO-09 | Always-visible mode pills | unit | Same as ANNO-07 | No - Wave 0 |
| ANNO-10 | CitationBlock default expanded | unit | `cd frontend && npx vitest run tests/unit/CitationBlock.test.tsx -x` | No - Wave 0 |
| ANNO-11 | Favicon + domain badge | unit | Same as ANNO-10 | No - Wave 0 |
| ANNO-12 | Citation note callout | unit | Same as ANNO-10 | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `frontend/tests/unit/formatRelativeDate.test.ts` -- covers SIDE-06
- [ ] `frontend/tests/unit/SessionHistory.test.tsx` -- covers SIDE-05, SIDE-08, SIDE-09, SIDE-12
- [ ] `frontend/tests/unit/SimplificationBlock.test.tsx` -- covers ANNO-07, ANNO-08, ANNO-09
- [ ] `frontend/tests/unit/CitationBlock.test.tsx` -- covers ANNO-10, ANNO-11, ANNO-12

*(Existing test files for MarkdownRenderer.test.tsx and MessageBlock.test.tsx will need test additions for new behaviors)*

## Sources

### Primary (HIGH confidence)
- Project source code: SessionHistory.tsx, MarkdownRenderer.tsx, MessageBlock.tsx, StreamingCursor.tsx, SimplificationBlock.tsx, CitationBlock.tsx, AppShell.tsx, theme.ts, index.css
- Project package.json: confirmed all dependencies and versions
- Project vitest.config.ts: confirmed test framework setup

### Secondary (MEDIUM confidence)
- Tailwind CSS v4: gradient syntax changed to bg-linear-to-b (based on Tailwind v4 migration knowledge)
- Google S2 Favicons API: `https://www.google.com/s2/favicons?domain=DOMAIN&sz=16` (widely documented, stable external API)
- navigator.clipboard.writeText: Web standard API, secure context required

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use, no new dependencies
- Architecture: HIGH - all target files exist and have been read, modifications are well-scoped CSS/JSX changes
- Pitfalls: HIGH - pitfalls identified from direct code reading (overflow contexts, re-render patterns, prop threading)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable - no moving targets, all CSS/JSX work)
