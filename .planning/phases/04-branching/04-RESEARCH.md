# Phase 4: Branching - Research

**Researched:** 2026-03-09
**Domain:** Text selection UI, floating action bubble, gutter lead pills, child thread creation, React Selection API integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Action bubble:**
- Icon + text label for each button — clearest UX, no ambiguity
- Go Deeper is primary: accent color treatment (blue highlight), visually dominant
- Find Sources and Simplify are secondary: muted/ghost style — present but clearly subordinate
- Positioned 8px above the top-right corner of the selection (per BRANCH-02)
- Dismisses immediately on any click outside; selection is cleared on dismiss
- Bubble appears within 100ms of releasing the mouse after a valid selection

**Gutter column:**
- The 200px right gutter is NOT always present — it appears only when the first child branch is created
- Before any branches exist: content column fills the full available width (no reserved gutter space)
- After first branch: gutter column appears alongside the content column with the lead pill
- Layout reflow is acceptable on first branch creation

**Accent color palette:**
- Muted/pastel tones — 8 colors that don't compete with text content
- Suggested palette (Claude's discretion on exact hex): dusty rose, sage green, soft lavender, warm amber, slate blue, muted teal, peach, dusty mauve
- Colors cycle in creation order (first child = color 1, second = color 2, etc.)
- Colors are used for: left spine strip border, breadcrumb active crumb, anchor paragraph underline, lead pill pip, child thread accent throughout

**Selection scope:**
- Any rendered text is selectable — prose paragraphs AND code blocks AND list items AND table cells
- Selection is still capped to one paragraph/block (the block where the drag began)
- Code block selections result in the code snippet as anchor text — this is valid and expected

**Child thread context propagation:**
- System prompt injection: when the backend receives a chat request for a child thread (depth >= 1), the system prompt is prefixed with:
  `"You are in a focused sub-conversation about: [anchor text]. Context from parent message: [first ~200 chars of parent message]. Stay focused on this specific topic unless the user redirects."`
- The anchor text and parent message excerpt are sent from the frontend as part of the chat request payload
- The backend's existing `systemInstruction` config field is used for this injection — no new API surface needed

**Depth limit:**
- Thread depth max is 4 (0–4), locked in store as `MAX_THREAD_DEPTH = 4`
- "Go Deeper" button in the bubble is disabled at depth 4 with a tooltip: "Maximum depth reached"
- Find Sources and Simplify remain enabled at any depth (Phase 5 will wire them)

### Claude's Discretion
- Exact hex values for the 8-color muted palette
- Lead pill hover preview card layout (anchor text + first exchange preview)
- Exact paragraph/block boundary detection implementation (data-paragraph-id strategy)
- Colored underline implementation (CSS text-decoration vs border-bottom vs pseudo-element)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRANCH-01 | User can click and drag to select up to one paragraph of text in any AI response; selection capped to paragraph where drag began | Selection API `mouseup` + `anchorNode` containment check; `data-paragraph-id` on blocks enables boundary detection |
| BRANCH-02 | Floating action bubble appears within 100ms of releasing mouse after valid selection, positioned 8px above top-right corner of selection | `Range.getBoundingClientRect()` gives selection rect; position bubble using `fixed` CSS relative to viewport; 100ms is achievable synchronously in `mouseup` handler |
| BRANCH-03 | Action bubble contains three actions: Go Deeper, Find Sources, Simplify | New `ActionBubble` component; Go Deeper wired, others rendered but disabled (Phase 5) |
| BRANCH-04 | User can click "Go Deeper" to create a child thread anchored to selected paragraph; new thread opens with slide-right transition | `createThread()` in store is ready; `setActiveThread()` triggers existing slide transition |
| BRANCH-05 | Each new child thread is auto-assigned an accent color from the 8-color palette (cycling in creation order) | Count existing `childThreadIds` on parent thread to determine palette index; color assigned at `createThread` call |
| BRANCH-06 | Each new child thread is auto-titled using client-side heuristic (first 6 words of anchor text) | Pure JS: `anchorText.split(' ').slice(0, 6).join(' ')` — matches existing title heuristic in useStreamingChat |
| BRANCH-07 | Anchor paragraph receives persistent colored underline in thread's accent color | `textDecoration: 'underline'` + `textDecorationColor` inline style on paragraph element via `data-paragraph-id` lookup; stored in `ChildLead.paragraphIndex` on parent message |
| BRANCH-08 | Child lead pill tag appears in right gutter at vertical position of anchor paragraph | New `GutterColumn` component; DOM position measured via `getBoundingClientRect` + scroll offset; `position: absolute` pill; `ResizeObserver` on anchor paragraph ref for repositioning |
| BRANCH-09 | Child lead shows: directional arrow, thread title (max 32 chars), live message count, accent color pip | Derived from thread in Zustand store; `thread.title.slice(0, 32)`, `thread.messageIds.length` |
| BRANCH-10 | Child lead hover shows preview card (anchor text + first user message + first line of AI response) | Hover state on pill; preview data read from Zustand messages store |
| BRANCH-11 | Clicking a child lead navigates into that child thread (slide-right transition) | `setActiveThread(lead.threadId)` — existing transition handles direction |
| BRANCH-12 | Thread depth limited to 5 levels (depth 0–4); "Go Deeper" disabled and shows tooltip at depth 4 | `isAtMaxDepth` selector already implemented; disable button + HTML `title` attribute for tooltip |
</phase_requirements>

---

## Summary

Phase 4 adds the core product differentiator: text selection, floating action bubble, child thread creation, and gutter lead pills. The Zustand store (`createThread`, `addChildLead`, `setActiveThread`) is fully implemented and ready. The primary new work is:

1. **Selection plumbing** — `mouseup` event listener on the message container, `window.getSelection()` API, paragraph boundary detection via `data-paragraph-id` attributes injected through a custom rehype plugin (since `includeElementIndex` was removed in react-markdown v10).

2. **ActionBubble component** — positioned using `Range.getBoundingClientRect()` relative to the viewport with `position: fixed` CSS. The bubble must survive the browser's focus-on-button behavior that can collapse the native selection highlight; this is a known pitfall.

3. **GutterColumn + lead pills** — the 200px right gutter appears only when `thread.childThreadIds.length > 0`. Pill vertical positions are measured from DOM via `getBoundingClientRect` + scroll offset. A `ResizeObserver` on anchor paragraph elements repositions pills when content reflows.

4. **System prompt injection** — `useStreamingChat` must forward `systemInstruction` for child threads (depth >= 1). The backend already accepts `systemPrompt` in the request body; the frontend currently does not send it.

**Primary recommendation:** Implement paragraph indexing via a lightweight inline rehype plugin (no new npm dependency needed — `unist-util-visit` is a transitive dependency of remark-gfm and already present). Use `position: fixed` for the action bubble to avoid scroll-container offset arithmetic. Use `ResizeObserver` for gutter pill positioning guarded with the existing `typeof ResizeObserver !== 'undefined'` pattern already established in the codebase.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | Component framework | Established in project |
| Zustand | ^5.0.11 | State management | Established flat store |
| react-markdown | ^10.1.0 | Markdown rendering | Established in project |
| remark-gfm | ^4.0.1 | GFM support | Established in project |
| Tailwind CSS | ^4.2.1 | Styling | Established in project |
| Vitest | ^4.0.18 | Testing | Established in project |

### New Dependencies Required
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| unist-util-visit | ^5.x (transitive, already in node_modules) | Rehype plugin to add `data-paragraph-id` | `includeElementIndex` removed in react-markdown v10; must use a rehype plugin |

**Verify transitive availability:**
```bash
ls frontend/node_modules/unist-util-visit 2>/dev/null && echo "available" || echo "need to install"
```

If not available as a direct dependency, add explicitly:
```bash
cd frontend && npm install unist-util-visit
```

### No New Dependencies Needed For
- Selection API (`window.getSelection()`) — native browser API
- `getBoundingClientRect()` — native browser API
- `ResizeObserver` — native browser API (already guarded in codebase)
- Gutter layout — Tailwind CSS flex/grid classes
- Tooltip on disabled button — HTML `title` attribute or Tailwind group-hover

---

## Architecture Patterns

### Recommended Project Structure (new files for Phase 4)

```
frontend/src/
├── components/
│   ├── branching/
│   │   ├── ActionBubble.tsx         # Floating selection bubble
│   │   └── GutterColumn.tsx         # Right gutter + lead pills
│   └── thread/
│       ├── MessageBlock.tsx         # MODIFIED: pass data-paragraph-id, anchor underline
│       └── MarkdownRenderer.tsx     # MODIFIED: add rehype plugin for paragraph indexing
├── hooks/
│   └── useTextSelection.ts          # NEW: mouseup listener → selection state
├── store/
│   └── sessionStore.ts              # NO CHANGE: createThread/addChildLead ready
├── types/
│   └── index.ts                     # NO CHANGE: ChildLead, Thread types ready
└── api/
    └── chat.ts                      # MODIFIED: add systemInstruction to request body
```

### Pattern 1: Paragraph Indexing via Rehype Plugin

`includeElementIndex` was removed in react-markdown v10. To assign `data-paragraph-id` to each top-level block, use an inline rehype plugin in `MarkdownRenderer`.

**What:** Visit each element node in the hast tree and inject a `data-paragraph-id` property based on the node's index among its parent's children.
**When to use:** Any time paragraph-level identity is needed for selection anchoring.

```typescript
// Source: react-markdown changelog + unist-util-visit docs
import { visit } from 'unist-util-visit';

function rehypeAddParagraphIds() {
  return (tree: unknown) => {
    visit(tree as import('hast').Root, 'element', (node: import('hast').Element, index) => {
      // Only tag top-level block elements (p, pre, ul, ol, table, blockquote)
      const blockTypes = ['p', 'pre', 'ul', 'ol', 'table', 'blockquote'];
      if (blockTypes.includes(node.tagName) && typeof index === 'number') {
        node.properties = node.properties ?? {};
        node.properties['data-paragraph-id'] = String(index);
      }
    });
  };
}

// In MarkdownRenderer:
<ReactMarkdown rehypePlugins={[rehypeAddParagraphIds]} ...>
```

**Confidence:** MEDIUM-HIGH — confirmed via react-markdown changelog that `includeElementIndex` was removed in v10, and the rehype plugin approach is the documented alternative. The `visit` function from unist-util-visit is the standard tool.

### Pattern 2: Action Bubble Positioning with `position: fixed`

**What:** On `mouseup`, check selection validity, then read `range.getBoundingClientRect()` (viewport-relative) to position bubble.
**When to use:** Always for the ActionBubble — `position: fixed` avoids scroll-offset arithmetic that plagues `position: absolute` inside a scrollable container.

```typescript
// Source: MDN Selection API + Range.getBoundingClientRect() docs
function useTextSelection(containerRef: React.RefObject<HTMLElement>) {
  const [bubble, setBubble] = useState<{
    top: number; left: number; anchorText: string; paragraphId: string;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleMouseUp(e: MouseEvent) {
      // Small delay to let selection finalize
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setBubble(null);
          return;
        }

        const range = sel.getRangeAt(0);

        // Boundary check: ensure selection stays within one block
        const anchorBlock = (e.target as HTMLElement).closest('[data-paragraph-id]');
        if (!anchorBlock) { setBubble(null); return; }

        const selRect = range.getBoundingClientRect();
        // Position: 8px above top-right of selection (fixed, viewport-relative)
        setBubble({
          top: selRect.top - 8,   // adjusted in render: `top - bubbleHeight`
          left: selRect.right,
          anchorText: sel.toString(),
          paragraphId: anchorBlock.getAttribute('data-paragraph-id') ?? '0',
        });
      }, 0); // 0ms still satisfies <100ms requirement
    }

    el.addEventListener('mouseup', handleMouseUp);
    return () => el.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef]);

  return { bubble, clearBubble: () => setBubble(null) };
}
```

**Known pitfall:** When user clicks a button inside the bubble, the browser may blur the text and collapse the selection BEFORE the click handler fires. Mitigation: call `event.preventDefault()` on `mousedown` of bubble buttons to prevent focus steal, while still handling `onClick`.

### Pattern 3: Gutter Pill Vertical Positioning

**What:** Measure anchor paragraph's DOM position relative to the message container scroll area, store as a ref (not in Zustand — see established decision), recompute on scroll and resize.
**When to use:** For each `ChildLead` pill rendered in `GutterColumn`.

```typescript
// Source: Established project decision: "DOM pixel positions must never enter Zustand"
// Use component-local refs via ResizeObserver

function GutterColumn({ thread, messages }: { thread: Thread; messages: Record<string, Message> }) {
  const pillPositions = useRef<Record<string, number>>({});

  // For each childLead: find anchor paragraph DOM element by data-paragraph-id
  // Measure offsetTop relative to scroll container
  // Recompute on ResizeObserver callback (guarded: typeof ResizeObserver !== 'undefined')

  // Render: position: absolute, top: pillPositions.current[threadId]
}
```

### Pattern 4: System Prompt Injection for Child Threads

**What:** When `activeThread.depth >= 1`, derive the system prompt from `anchorText` and parent message content, and pass it to the API.
**When to use:** In `useStreamingChat`, before calling `streamChat`.

```typescript
// Source: Established decisions in CONTEXT.md
// backend/src/routes/chat.ts already reads req.body.systemPrompt and passes to aiProvider.streamChat()

// In useStreamingChat.ts sendMessage():
const systemInstruction = activeThread.depth >= 1
  ? buildChildSystemPrompt(
      activeThread.anchorText ?? '',
      parentMessageContent.slice(0, 200)
    )
  : '';

// In api/chat.ts:
body: JSON.stringify({ messages: history, systemInstruction }),
```

The backend route at `chat.ts` line 11 already reads `systemPrompt` from request body and passes it to `aiProvider.streamChat()`. The frontend currently sends only `{ messages }` — this needs to add `systemInstruction`.

### Pattern 5: Accent Color Cycling

**What:** Determine the accent color for a new child thread based on how many children the parent already has.
**When to use:** When "Go Deeper" is clicked, before calling `createThread`.

```typescript
const ACCENT_PALETTE = [
  '#C9A0A0', // dusty rose
  '#8FAF8F', // sage green
  '#A89EC9', // soft lavender
  '#C9A87A', // warm amber
  '#7A9EC9', // slate blue
  '#7AB5B5', // muted teal
  '#C9A88F', // peach
  '#B09898', // dusty mauve
] as const;

function getNextAccentColor(parentThread: Thread): string {
  return ACCENT_PALETTE[parentThread.childThreadIds.length % ACCENT_PALETTE.length]!;
}
```

**Confidence:** HIGH — pure client-side logic, no library dependency.

### Anti-Patterns to Avoid

- **Storing DOM pixel positions in Zustand**: established project decision; use refs + ResizeObserver only.
- **Using `position: absolute` on ActionBubble inside a scrolled container**: causes offset arithmetic bugs when container is scrolled; use `position: fixed` with viewport rect from `getBoundingClientRect`.
- **Relying on `includeElementIndex` prop of ReactMarkdown**: removed in v10; use rehype plugin instead.
- **Calling `window.getSelection()` synchronously on mousedown**: selection isn't finalized yet at mousedown; always use `mouseup`.
- **Modifying Zustand store shape**: `createThread`, `addChildLead`, types are already locked. Do not add new store fields — thread `accentColor`, `anchorText`, `childThreadIds`, and `ChildLead` are all in place.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Paragraph index injection | Custom AST traversal | `unist-util-visit` rehype plugin | Already part of remark/rehype ecosystem; handles all edge cases in hast tree |
| Selection boundary containment | String comparison heuristics | `element.closest('[data-paragraph-id]')` | Native DOM traversal; handles nested inline elements correctly |
| Accent color assignment | Complex color algorithm | Fixed 8-color array + modulo | Cycling palette is a locked product decision, not a generative problem |
| Thread title generation | NLP summarization | `text.split(' ').slice(0, 6).join(' ')` | Established pattern already in `useStreamingChat` |

**Key insight:** Most of the complex logic (store mutations, navigation transitions, breadcrumbs, spine strip) is already built. Phase 4 is primarily new UI surface components wired to existing infrastructure.

---

## Common Pitfalls

### Pitfall 1: Selection Collapse When Clicking Bubble Button

**What goes wrong:** User selects text, bubble appears, user clicks "Go Deeper" — but the browser fires `blur` on the text area first, collapsing the selection BEFORE the click handler can read `anchorText`. The bubble's data (anchorText, paragraphId) is lost.

**Why it happens:** Browser focus management — clicking any button element focuses it, which blurs the previous focus and collapses the text selection.

**How to avoid:** Capture `anchorText` and `paragraphId` into the bubble state when the bubble appears (in the `mouseup` handler), not when the button is clicked. The bubble component reads from its own state, not from `window.getSelection()` at click time. Additionally, calling `event.preventDefault()` in `onMouseDown` of bubble buttons prevents the focus steal.

**Warning signs:** `anchorText` is empty string when "Go Deeper" fires; selection is null at click time.

### Pitfall 2: `getBoundingClientRect()` Returns All-Zero Rect for Collapsed Selection

**What goes wrong:** `range.getBoundingClientRect()` returns `{top:0, left:0, width:0, height:0}` for a selection where the user clicked (no drag), or when called before the browser has finalized the selection.

**Why it happens:** `isCollapsed` is true; the rect is valid but degenerate. Also occurs if called synchronously before the `mouseup` event finishes propagating.

**How to avoid:** Always check `!sel.isCollapsed` AND `sel.toString().trim().length > 0` before positioning the bubble. The `setTimeout(() => {...}, 0)` in the `mouseup` handler ensures the browser has finalized selection.

**Warning signs:** Bubble appears at top-left of page (position 0,0).

### Pitfall 3: Gutter Pill Position Stale After Content Reflow

**What goes wrong:** A gutter pill's `top` position is measured once on mount, but the anchor paragraph moves when the user resizes the window, more messages are added, or streaming content expands the message above it.

**Why it happens:** DOM measurements are point-in-time. Without continuous observation, pill positions become stale.

**How to avoid:** Use `ResizeObserver` on the scroll container (not each individual paragraph) to trigger pill position recomputation. Guard with `typeof ResizeObserver !== 'undefined'` (established project pattern). Batch updates with `requestAnimationFrame` to avoid layout thrashing.

**Warning signs:** Lead pills visually misalign with underlined paragraphs after window resize or new message arrival.

### Pitfall 4: Anchor Underline Lost When MarkdownRenderer Re-Renders

**What goes wrong:** The colored underline on the anchor paragraph disappears when the parent message re-renders (e.g., a sibling message streams in).

**Why it happens:** The custom paragraph component in `MarkdownRenderer` re-creates DOM elements on every render. Underline state stored only in DOM (via class or style) is wiped. If underline state is only in local component state, React re-render may reset it.

**How to avoid:** Derive the anchor underline directly from `message.childLeads` in Zustand (immutable store data). `MessageBlock` passes `message.childLeads` down to `MarkdownRenderer` (or to the custom `p` component). The custom paragraph component checks if its `data-paragraph-id` matches any `childLead.paragraphIndex` and applies the accent color. Since the source of truth is in Zustand, underlines survive re-renders.

**Warning signs:** Underline disappears after any new streaming token updates an adjacent message.

### Pitfall 5: Selection Spans Multiple Blocks

**What goes wrong:** User drags from one paragraph into a second paragraph. `window.getSelection().toString()` returns multi-paragraph text. The `anchorNode` and `focusNode` are in different `[data-paragraph-id]` blocks.

**Why it happens:** The browser allows multi-element selections by default; there is no built-in single-paragraph constraint.

**How to avoid:** In the `mouseup` handler, compare `closest('[data-paragraph-id]')` of `anchorNode` vs `focusNode`. If they differ, call `window.getSelection().removeAllRanges()` (clears selection) and do NOT show the bubble. This enforces the single-block constraint from BRANCH-01.

**Warning signs:** `anchorText` contains newlines or spans multiple semantic topics.

### Pitfall 6: ResizeObserver Loop Warning in Console

**What goes wrong:** `ResizeObserver loop completed with undelivered notifications` appears in the console because a ResizeObserver callback triggers a React state update which causes a re-render which causes more resize notifications.

**Why it happens:** Circular: observe → callback → setState → re-render → layout change → observe fires again.

**How to avoid:** Wrap ResizeObserver callback measurements in `requestAnimationFrame`. Only call setState if the measured position has actually changed (compare with previous value). Use `useRef` for the position storage and only trigger a re-render when the delta exceeds a threshold (e.g., 1px).

---

## Code Examples

### Custom Rehype Plugin for Paragraph Indexing

```typescript
// Source: unist-util-visit docs, react-markdown v10 migration guide
// File: frontend/src/components/thread/MarkdownRenderer.tsx (addition)
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

const BLOCK_TAGS = new Set(['p', 'pre', 'ul', 'ol', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function rehypeAddParagraphIds() {
  return (tree: Root) => {
    let blockIndex = 0;
    visit(tree, 'element', (node: Element) => {
      if (BLOCK_TAGS.has(node.tagName)) {
        node.properties = node.properties ?? {};
        node.properties['dataParagraphId'] = String(blockIndex++);
      }
    });
  };
}
```

Note: hast uses `dataParagraphId` (camelCase) in `node.properties` which maps to `data-paragraph-id` in HTML output. React then receives it as `data-paragraph-id` attribute.

### ActionBubble Positioning Logic

```typescript
// Source: MDN Range.getBoundingClientRect() + Selection API
// Key: position: fixed uses viewport coords directly — no scroll offset needed

function positionBubble(range: Range): { top: number; left: number } {
  const rect = range.getBoundingClientRect();
  // 8px above the top-right corner of selection
  // Bubble is rendered at (left, top) but visually offset by its height
  return {
    top: rect.top,       // component CSS: transform: translateY(calc(-100% - 8px))
    left: rect.right,
  };
}

// ActionBubble CSS (Tailwind):
// position: fixed, z-50, transform: -translate-y-full and -8px offset
// style={{ top: bubble.top, left: bubble.left, transform: 'translateY(calc(-100% - 8px))' }}
```

### Selection Boundary Enforcement

```typescript
// Source: MDN Selection API
function getValidSelection(): { text: string; paragraphId: string; range: Range } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return null;

  const range = sel.getRangeAt(0);
  const anchorBlock = (sel.anchorNode as HTMLElement)?.closest?.('[data-paragraph-id]');
  const focusBlock = (sel.focusNode as HTMLElement)?.closest?.('[data-paragraph-id]');

  // Cross-block selection: clear and reject
  if (!anchorBlock || !focusBlock || anchorBlock !== focusBlock) {
    sel.removeAllRanges();
    return null;
  }

  return {
    text: sel.toString().trim(),
    paragraphId: anchorBlock.getAttribute('data-paragraph-id') ?? '0',
    range,
  };
}
```

### System Prompt Builder

```typescript
// Source: CONTEXT.md locked decisions
function buildChildSystemPrompt(anchorText: string, parentContext: string): string {
  const truncatedContext = parentContext.slice(0, 200);
  return `You are in a focused sub-conversation about: ${anchorText}. Context from parent message: ${truncatedContext}. Stay focused on this specific topic unless the user redirects.`;
}
```

### Gutter Pill Position Measurement

```typescript
// Source: Established project pattern (ResizeObserver guard from Phase 03-05)
function measurePillTop(
  messageId: string,
  paragraphId: string,
  scrollContainer: HTMLElement
): number | null {
  const anchor = scrollContainer.querySelector(
    `[data-message-id="${messageId}"] [data-paragraph-id="${paragraphId}"]`
  );
  if (!anchor) return null;
  const anchorRect = anchor.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  // Position relative to scroll container top + current scroll
  return anchorRect.top - containerRect.top + scrollContainer.scrollTop;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `includeElementIndex` prop on ReactMarkdown | Custom rehype plugin with `unist-util-visit` | react-markdown v9 → v10 | Must use plugin; `includeElementIndex` silently does nothing in v10 |
| `EventSource` for SSE | `fetch` + `ReadableStream` | Established in Phase 2 | Cannot change — auth headers require fetch |
| Nested Zustand state | Flat normalized store | Established in Phase 2 | Must stay flat; cannot nest threads or messages |

**Deprecated/outdated:**
- `includeElementIndex` on `<ReactMarkdown>`: does nothing in v10; remove if present.
- `@google/generative-ai`: EOL'd Nov 2025; project already uses `@google/genai` v1.x.

---

## Open Questions

1. **`unist-util-visit` as direct dependency**
   - What we know: It is a transitive dependency of remark-gfm which is installed; likely in `node_modules` already.
   - What's unclear: Whether it can be imported directly without being listed in `package.json` (technically works but not best practice).
   - Recommendation: Add it as an explicit direct dependency (`npm install unist-util-visit`) in Wave 0 to avoid transitive dependency brittleness.

2. **`hast` types for TypeScript in the rehype plugin**
   - What we know: `@types/hast` provides `Root`, `Element` types needed for the plugin.
   - What's unclear: Whether it is already installed.
   - Recommendation: Check `frontend/node_modules/@types/hast`; install if missing (`npm install -D @types/hast`).

3. **Selection inside SyntaxHighlighter (code blocks)**
   - What we know: The user decision allows code block selections. SyntaxHighlighter renders inside a `<div>` (PreTag="div").
   - What's unclear: Whether `closest('[data-paragraph-id]')` propagates correctly through SyntaxHighlighter's internal DOM structure.
   - Recommendation: Verify in browser during Wave 0 spike. The `<pre>` element wrapping the code block should receive `data-paragraph-id` from the rehype plugin, and `closest()` will traverse up to find it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + jsdom |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRANCH-01 | Selection capped to one block; cross-block clears | unit | `npx vitest run tests/unit/useTextSelection.test.ts` | No — Wave 0 |
| BRANCH-02 | Bubble appears within 100ms, positioned correctly | unit (mock getBoundingClientRect) | `npx vitest run tests/unit/ActionBubble.test.tsx` | No — Wave 0 |
| BRANCH-03 | Bubble renders 3 buttons; Go Deeper primary style | unit | `npx vitest run tests/unit/ActionBubble.test.tsx` | No — Wave 0 |
| BRANCH-04 | Go Deeper creates child thread, navigates to it | unit | `npx vitest run tests/unit/useTextSelection.test.ts` | No — Wave 0 |
| BRANCH-05 | Accent color cycles from palette per childThreadIds.length | unit | `npx vitest run tests/unit/sessionStore.test.ts` | Exists (extend) |
| BRANCH-06 | Thread title = first 6 words of anchorText | unit | `npx vitest run tests/unit/sessionStore.test.ts` | Exists (extend) |
| BRANCH-07 | Anchor paragraph renders colored underline from childLeads | unit | `npx vitest run tests/unit/MessageBlock.test.tsx` | Exists (extend) |
| BRANCH-08 | GutterColumn renders only when childThreadIds.length > 0 | unit | `npx vitest run tests/unit/GutterColumn.test.tsx` | No — Wave 0 |
| BRANCH-09 | Lead pill shows arrow, title truncated at 32 chars, message count, pip | unit | `npx vitest run tests/unit/GutterColumn.test.tsx` | No — Wave 0 |
| BRANCH-10 | Lead pill hover shows preview card with anchor + first exchange | unit | `npx vitest run tests/unit/GutterColumn.test.tsx` | No — Wave 0 |
| BRANCH-11 | Clicking lead pill calls setActiveThread with correct id | unit | `npx vitest run tests/unit/GutterColumn.test.tsx` | No — Wave 0 |
| BRANCH-12 | Go Deeper button disabled at depth 4, tooltip present | unit | `npx vitest run tests/unit/ActionBubble.test.tsx` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/tests/unit/useTextSelection.test.ts` — covers BRANCH-01, BRANCH-04
- [ ] `frontend/tests/unit/ActionBubble.test.tsx` — covers BRANCH-02, BRANCH-03, BRANCH-12
- [ ] `frontend/tests/unit/GutterColumn.test.tsx` — covers BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11
- [ ] `npm install unist-util-visit` (direct dep) — if not available as transitive
- [ ] `npm install -D @types/hast` — if not already installed

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection (sessionStore.ts, types/index.ts, selectors.ts, ThreadView.tsx, MessageBlock.tsx, MarkdownRenderer.tsx, chat.ts backend) — confirmed store API, existing patterns, integration points
- [MDN Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection) — `isCollapsed`, `getRangeAt`, `removeAllRanges`
- [MDN Range.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Range/getBoundingClientRect) — viewport-relative rect
- [MDN text-decoration-color](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-decoration-color) — colored underline approach

### Secondary (MEDIUM confidence)
- [react-markdown changelog on GitHub](https://github.com/remarkjs/react-markdown/blob/main/changelog.md) — confirmed `includeElementIndex` removal in v10
- [unist-util-visit docs](https://github.com/syntax-tree/unist-util-visit) — rehype plugin pattern for index injection
- [Floating UI Virtual Elements](https://floating-ui.com/docs/virtual-elements) — `getBoundingClientRect` virtual reference pattern
- [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — loop warning, requestAnimationFrame mitigation
- [GitHub: rangefix for browser getBoundingClientRect bugs](https://github.com/edg2s/rangefix) — cross-browser pitfall documentation

### Tertiary (LOW confidence — verify in browser)
- Selection inside SyntaxHighlighter DOM propagates to `closest('[data-paragraph-id]')` correctly — unverified, needs browser spike in Wave 0

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified in package.json
- Architecture: HIGH — store API confirmed by reading source; patterns confirmed by official docs
- Pitfalls: HIGH — selection collapse, stale positioning, multi-block selection are well-documented browser API behaviors
- `includeElementIndex` removal: HIGH — confirmed via react-markdown changelog and multiple sources
- Gutter pill positioning: MEDIUM — approach is standard but `ResizeObserver` + React timing is flagged in STATE.md as highest-risk interaction

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable libraries; browser APIs don't change)
