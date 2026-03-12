# Phase 9: Layout & Positioning - Research

**Researched:** 2026-03-12
**Domain:** CSS Grid layout, CSS transitions, React component architecture
**Confidence:** HIGH

## Summary

Phase 9 replaces three JS-heavy patterns with CSS-native solutions: (1) branch pill absolute positioning via JS measurement/ResizeObserver becomes CSS Grid inline layout, (2) thread transition horizontal slide becomes opacity crossfade, and (3) ancestor peek panels become collapsible hover-expand rails with overlay behavior. All changes are pure frontend CSS/component restructuring with no backend or store schema changes.

The existing codebase uses Tailwind CSS v4, React 19, Zustand 5, and Vitest 4 with jsdom. The project's established patterns (Tailwind utility classes, position:absolute overlays, CSS transitions) map directly to this phase's needs. No new libraries are required -- everything is achievable with CSS Grid, CSS transitions, and existing Tailwind utilities.

**Primary recommendation:** Restructure ThreadView's content wrapper from a single `position:relative` div to a CSS Grid with `grid-template-columns: 1fr auto`, where each MessageBlock occupies a grid row and pills render in the `auto` column of their anchor message's row. Replace the slide transition with a simple opacity fade managed by React state. Refactor AncestorPeekPanel into a collapsed rail + hover-triggered overlay.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-column CSS Grid always present: `grid-template-columns: 1fr auto`
- Pill column collapses to 0px when no pills exist -- no layout shift when branches are created
- No extra right padding (pr-[80px]/pr-[140px]) needed -- grid cells handle separation
- Each MessageBlock becomes a grid row; pills sit in the right cell of the same row
- Multiple pills anchored to the same message stack vertically in that cell
- No JS measurement or ResizeObserver needed
- Compact pill: accent pip + truncated title (max ~20 chars) + message count badge
- Width ~140-180px (auto column)
- Descendant pills collapsed by default -- expand on parent pill hover (slide down below parent)
- Only direct branch pills visible until explored
- Simple opacity fade: old thread fades out (1->0), new thread fades in (0->1), ~150ms total
- Replaces current 200ms horizontal slide entirely
- Interruptibility: snap to new target -- cancel current fade, snap old invisible, start fading new
- Scroll position restored when returning (sessionStore.setScrollPosition already exists)
- New threads start at top
- Crossfade applies to main ThreadView content only -- ancestor panels update instantly
- Collapsed rail: thin accent stripe only (2-3px) on right edge of 24-32px rail
- Background subtle (zinc-900/slate-50), no text, no icons in collapsed state
- Hover expands to ~220px with 200ms ease-out CSS transition
- Expanded panel floats over main content as overlay (position:absolute), shadow-lg, rounded right edge
- Main content stays in place -- panel is a layer on top, not pushing content sideways
- Bottom fade gradient matches panel background color
- Hover expands panel (read-only peek), click navigates to that ancestor thread
- Minimum text size is text-xs (12px) -- no text-[10px]
- Anchor message highlight: text-sm, thick left border in accent color, pill-shaped branch badge
- Hover preview auto-flip: getBoundingClientRect vs window.innerHeight, no library
- CSS border-triangle pointer (6px) pointing toward pill

### Claude's Discretion
- Exact CSS Grid gap/spacing values
- Rail hover detection area (full 24-32px width vs just the stripe)
- Descendant pill slide-down animation timing
- Preview card max-width and text truncation lengths
- Whether to dim main content behind expanded ancestor panel overlay

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PILL-01 | Branch pills use CSS Grid (1fr auto) instead of JS absolute positioning | Grid layout pattern documented; MessageBlock-per-row structure identified |
| PILL-02 | Pills rendered inline within message flow, eliminating JS measurement and ResizeObserver | Removal of measurePillTop, pillPositions ref, posVersion state, ResizeObserver from GutterColumn |
| PILL-03 | Padding pr-[80px]/pr-[140px] always applied regardless of hasChildThreads | Grid auto column handles this; padding classes removed from ThreadView line 396 |
| PILL-04 | Thread transition uses gentle crossfade (opacity fade over 150ms) | Replace translate-x transition with opacity transition; state machine documented |
| PILL-05 | Transition is interruptible -- navigating mid-transition cancels current animation | useRef-based target tracking pattern documented |
| PILL-06 | Hover preview card uses auto-positioning to prevent off-screen overflow | getBoundingClientRect flip logic documented |
| PILL-07 | Preview card has small pointer/arrow indicating which pill it belongs to | CSS border-triangle technique documented |
| PILL-08 | Descendant pills collapsed by default, shown on expand/hover | Already partially implemented; needs collapse-by-default toggle |
| ANCS-01 | Ancestor panels replaced with thin spine rail (24-32px) showing accent-color stripe | Rail component pattern documented; replaces current variable-width panels |
| ANCS-02 | Rail expands to ~220px on hover with smooth CSS transition (200ms ease-out) | CSS width transition on hover; overlay positioning documented |
| ANCS-03 | Expanded panel looks like card overlay (shadow-lg, rounded right edge) floating over content | position:absolute overlay pattern documented |
| ANCS-04 | Bottom fade gradient matches panel background color | Existing gradient pattern in AncestorPeekPanel preserved with correct colors |
| ANCS-05 | Highlighted anchor message has larger text, colored left-border stripe, branch badge | Styling upgrade from text-[10px] to text-sm for anchor; badge markup documented |
| ANCS-06 | Minimum readable text size is text-xs (12px) -- no text-[10px] | Current code uses text-[10px] in 6 places; all must be upgraded to text-xs |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in use |
| Tailwind CSS | 4.2.1 | Utility-first styling | Already in use; all styling via Tailwind classes |
| Zustand | 5.0.11 | State management | Already in use; no store schema changes needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.18 | Unit/component testing | All test files |
| @testing-library/react | 16.3.2 | Component test rendering | DOM assertion tests |
| Playwright | 1.58.2 | E2E testing | Integration smoke tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Grid for pill layout | Flexbox | Grid gives explicit 2D row alignment; flexbox would require more wrapper nesting |
| Raw CSS transitions | Framer Motion / react-spring | Overkill for simple opacity/width transitions; adds bundle weight |
| getBoundingClientRect for flip | Floating UI / Popper.js | Decision locked: no library, simple rect check sufficient |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Current Structure (being changed)
```
AppShell.tsx
  +-- SessionHistory sidebar
  +-- AncestorPeekPanel[] (variable width: 180/110/68px, flexbox items)
  +-- Main content area
        +-- ThreadView.tsx
              +-- scrollRef div (overflow-y-auto)
                    +-- contentWrapperRef div (position:relative)
                          +-- slide transition div (translate-x, pr-[80px]/pr-[140px])
                                +-- MessageList -> MessageBlock[]
                          +-- GutterColumn (position:absolute pills, JS-measured tops)
                          +-- HighlightOverlay
                          +-- ActionBubble
```

### Target Structure (Plan 09-01: Grid Migration)
```
ThreadView.tsx
  +-- scrollRef div (overflow-y-auto)
        +-- contentWrapperRef div (CSS Grid: grid-template-columns 1fr auto)
              +-- For each message:
                    +-- MessageBlock (grid column 1)
                    +-- PillCell (grid column 2, contains pills for this message)
              +-- HighlightOverlay (position:absolute, grid-column: 1 / -1)
              +-- ActionBubble (position:absolute, grid-column: 1 / -1)
```

### Target Structure (Plan 09-02: Crossfade)
```
ThreadView.tsx
  +-- scrollRef div
        +-- outgoing content div (opacity transition, position:absolute when fading)
        +-- incoming content div (opacity transition)
```

### Target Structure (Plan 09-03: Ancestor Rails)
```
AppShell.tsx
  +-- SessionHistory sidebar
  +-- AncestorRail[] (24-32px collapsed, position:relative)
        +-- collapsed: accent stripe div (2-3px right border)
        +-- expanded: overlay div (position:absolute, ~220px, shadow-lg)
  +-- Main content area (unchanged width)
```

### Pattern 1: CSS Grid Message-Pill Alignment
**What:** Each message occupies a grid row; pills for that message sit in the auto-sized right column of the same row.
**When to use:** Replacing JS-measured absolute pill positioning.
**Example:**
```tsx
// ThreadView content wrapper becomes a grid
<div
  ref={contentWrapperRef}
  className="grid px-4"
  style={{ gridTemplateColumns: '1fr auto' }}
>
  {orderedMessages.map(msg => {
    const pillsForMessage = childLeads.filter(
      lead => lead is anchored to msg
    );
    return (
      <React.Fragment key={msg.id}>
        {/* Column 1: message */}
        <div className="min-w-0">
          <MessageBlock message={msg} ... />
        </div>
        {/* Column 2: pills (auto-collapses when empty) */}
        <div className="flex flex-col gap-1 items-end pt-2">
          {pillsForMessage.map(lead => (
            <BranchPill key={lead.threadId} lead={lead} ... />
          ))}
        </div>
      </React.Fragment>
    );
  })}
</div>
```

### Pattern 2: Interruptible Crossfade
**What:** Opacity-based thread transition with ref-based target tracking for interruption.
**When to use:** Replacing the translate-x slide transition.
**Example:**
```tsx
const [fadeState, setFadeState] = useState<'idle' | 'fading-out' | 'fading-in'>('idle');
const targetThreadIdRef = useRef(activeThreadId);
const fadeTimerRef = useRef<number>();

useEffect(() => {
  if (activeThreadId === prevActiveThreadIdRef.current) return;

  // Cancel any in-progress fade
  if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

  targetThreadIdRef.current = activeThreadId;
  setFadeState('fading-out');

  fadeTimerRef.current = window.setTimeout(() => {
    // Only proceed if target hasn't changed (interruption check)
    if (targetThreadIdRef.current === activeThreadId) {
      prevActiveThreadIdRef.current = activeThreadId;
      setFadeState('fading-in');
      fadeTimerRef.current = window.setTimeout(() => {
        setFadeState('idle');
      }, 150);
    }
  }, 75); // half of 150ms for fade-out
}, [activeThreadId]);

// CSS classes:
// fading-out: opacity-0 transition-opacity duration-[75ms]
// fading-in:  opacity-100 transition-opacity duration-[75ms]
// idle:       opacity-100
```

### Pattern 3: Hover-Expand Rail Overlay
**What:** Thin rail that expands to overlay card on hover.
**When to use:** Ancestor panel redesign.
**Example:**
```tsx
function AncestorRail({ thread, ... }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: '28px' }}  // collapsed width
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapsed: accent stripe */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[2px]"
        style={{ backgroundColor: thread.accentColor }}
      />

      {/* Expanded overlay */}
      <div
        className={`absolute top-0 left-0 bottom-0 bg-slate-50 dark:bg-zinc-900
          shadow-lg rounded-r-lg overflow-hidden transition-[width] duration-200 ease-out
          ${isHovered ? 'w-[220px]' : 'w-0'}`}
        style={{ zIndex: 10 }}
      >
        {/* Panel content only renders when hovered for perf */}
        {isHovered && <RailPanelContent thread={thread} ... />}
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **JS measurement for layout alignment:** The entire point of this phase is eliminating measurePillTop/ResizeObserver. Do not introduce new getBoundingClientRect calls for pill positioning.
- **Pushing content on ancestor expand:** The expanded panel MUST be position:absolute overlay. Never use width transitions that affect flex layout of siblings.
- **Inline styles for transition states:** Use Tailwind transition utility classes. The only inline styles should be for dynamic values like accentColor.
- **Storing transition state in Zustand:** Fade state and hover state are ephemeral UI concerns -- keep in useState/useRef.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid alignment | Manual top calculation | CSS Grid `grid-template-columns: 1fr auto` | Browser handles alignment natively; zero drift |
| Transition timing | Manual requestAnimationFrame loops | CSS `transition-opacity duration-150` | Hardware-accelerated, interruptible via class swap |
| Overlay positioning | Manual z-index management | Tailwind `z-10` + `position:absolute` on rail overlay | Standard stacking context pattern |
| Preview flip | Complex viewport math | Simple `getBoundingClientRect().bottom > window.innerHeight - 200` | One comparison, user-locked decision |

**Key insight:** This phase is about REMOVING complexity (JS measurement, ResizeObserver, transform slides) and replacing with CSS-native patterns. Every solution should be simpler than what it replaces.

## Common Pitfalls

### Pitfall 1: Grid auto column not collapsing to 0
**What goes wrong:** The `auto` column retains minimum width even when empty, causing unwanted gap.
**Why it happens:** CSS Grid `auto` columns size to content but may have implicit minimum from gap or padding.
**How to avoid:** Ensure empty pill cells contain no whitespace/padding. Use `gap-0` on the grid and apply padding inside cells only. The auto column with no content collapses to 0.
**Warning signs:** Visible gap on right side of messages when no pills exist.

### Pitfall 2: ContextCard and non-message elements break grid row alignment
**What goes wrong:** ContextCard, empty state placeholders, and bottom anchor div don't follow the message-pill grid pattern.
**Why it happens:** These elements aren't messages but render inside the grid container.
**How to avoid:** Use `grid-column: 1 / -1` (span full width) for non-message elements like ContextCard, empty states, and the bottom anchor. Or restructure so only messages participate in the grid.
**Warning signs:** ContextCard appears in the wrong grid cell or gets a pill column.

### Pitfall 3: HighlightOverlay and ActionBubble z-index conflicts with grid
**What goes wrong:** Absolutely-positioned overlays (HighlightOverlay, ActionBubble) clip or stack incorrectly within grid cells.
**Why it happens:** Grid creates new stacking contexts. Overlays positioned relative to the grid container need explicit z-index.
**How to avoid:** Keep overlays as direct children of the grid container with `grid-column: 1 / -1` and `position: absolute`. Use `pointer-events-none` on overlay container, `pointer-events-auto` on interactive elements.
**Warning signs:** Overlays appear behind pills or get clipped by grid cell boundaries.

### Pitfall 4: Crossfade interruption causes stale content flash
**What goes wrong:** User navigates A->B->C quickly; content briefly shows thread B before jumping to C.
**Why it happens:** The fade-in for B starts before the navigation to C cancels it.
**How to avoid:** Use a ref for the "target" thread ID. On each navigation, immediately update the ref. In the fade timeout callback, check if the ref still matches before proceeding. If not, skip directly to the new target.
**Warning signs:** Brief content flash of intermediate thread during rapid navigation.

### Pitfall 5: Scroll position not restored after crossfade
**What goes wrong:** Thread content appears at wrong scroll position after fade completes.
**Why it happens:** Scroll restoration runs before the new content is rendered/visible (opacity is still 0).
**How to avoid:** Restore scroll position BEFORE starting the fade-in (while content is invisible). This way the user sees the content already at the right position when it fades in.
**Warning signs:** Content visibly scrolls to saved position after becoming visible.

### Pitfall 6: Ancestor rail hover flicker
**What goes wrong:** Panel rapidly opens/closes as mouse moves between rail and overlay.
**Why it happens:** The overlay extends beyond the rail's original 28px width via position:absolute. If onMouseLeave fires on the rail before onMouseEnter fires on the overlay, flicker occurs.
**How to avoid:** Put both the collapsed rail and the expanded overlay inside the same parent div, and attach onMouseEnter/onMouseLeave to that parent. The parent never changes size, so hover state is stable.
**Warning signs:** Ancestor panel flickers when moving mouse from rail stripe to expanded panel content.

### Pitfall 7: Existing tests break due to DOM structure changes
**What goes wrong:** Tests that query by CSS class or DOM hierarchy fail after grid migration.
**Why it happens:** Tests may rely on the old `position:relative` wrapper or slide transition classes.
**How to avoid:** Update test selectors. Use data-testid attributes (already present: `data-testid="accent-pip"`, `data-testid="preview-card"`, `data-message-id`). Add new data-testid attributes where needed.
**Warning signs:** Test failures mentioning missing elements or wrong class assertions.

## Code Examples

### Grid wrapper replacing current content wrapper
```tsx
// Source: ThreadView.tsx line 391 (current)
// BEFORE: <div ref={contentWrapperRef} className="relative px-4">
// AFTER:
<div
  ref={contentWrapperRef}
  className="grid px-4"
  style={{ gridTemplateColumns: '1fr auto' }}
>
```

### Message-pill row pair
```tsx
// Each message becomes two grid cells
<div className="min-w-0 col-start-1">
  <MessageBlock message={msg} ... />
</div>
<div className="col-start-2 flex flex-col gap-1 items-end self-start pt-2">
  {pillsForMsg.map(lead => (
    <BranchPill key={lead.threadId} lead={lead} ... />
  ))}
</div>
```

### Full-width spanning elements
```tsx
// ContextCard, empty states, bottom anchor span both columns
<div className="col-span-full">
  <ContextCard thread={activeThread} />
</div>
```

### CSS border-triangle for preview card pointer
```tsx
// Upward-pointing triangle (preview card below pill)
<div
  className="absolute -top-[6px] right-4 w-0 h-0
    border-l-[6px] border-l-transparent
    border-r-[6px] border-r-transparent
    border-b-[6px] border-b-white dark:border-b-zinc-800"
/>

// Downward-pointing triangle (preview card above pill, flipped)
<div
  className="absolute -bottom-[6px] right-4 w-0 h-0
    border-l-[6px] border-l-transparent
    border-r-[6px] border-r-transparent
    border-t-[6px] border-t-white dark:border-t-zinc-800"
/>
```

### Preview card auto-flip logic
```tsx
function usePreviewFlip(pillRef: React.RefObject<HTMLElement>) {
  const [flipAbove, setFlipAbove] = useState(false);

  useEffect(() => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    // Flip if pill is in bottom 220px of viewport (approximate card height)
    setFlipAbove(rect.bottom > window.innerHeight - 220);
  }, []);

  return flipAbove;
}
```

### Ancestor rail accent stripe
```tsx
// Collapsed state: thin accent stripe on right edge
<div className="relative flex-shrink-0 w-7 bg-zinc-900 dark:bg-zinc-900">
  <div
    className="absolute right-0 top-0 bottom-0 w-[2px]"
    style={{ backgroundColor: thread.accentColor }}
  />
</div>
```

### Anchor message highlight in expanded panel (ANCS-05)
```tsx
// Highlighted anchor: text-sm, thick left border, branch badge
<div
  className="mx-1 my-0.5 px-2 py-1.5 rounded text-sm leading-snug border-l-[3px]"
  style={{
    backgroundColor: `${thread.accentColor}20`,
    borderColor: thread.accentColor,
  }}
>
  <span className="font-semibold mr-1 text-slate-400 dark:text-zinc-500">
    {isUser ? 'You' : 'AI'}
  </span>
  {msg.content.slice(0, maxChars)}
  {msg.content.length > maxChars && '...'}

  {/* Branch badge */}
  <span
    className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
    style={{
      backgroundColor: `${thread.accentColor}30`,
      color: thread.accentColor,
    }}
  >
    branch
  </span>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS measurePillTop + ResizeObserver | CSS Grid row alignment | This phase | Eliminates ~60 lines of measurement code, zero layout drift |
| translate-x slide transition | Opacity crossfade | This phase | Smoother, interruptible, no layout recalc during transition |
| Variable-width flexbox ancestor panels | Fixed-width rail + absolute overlay | This phase | Main content never shifts; panels don't affect layout flow |
| text-[10px] in ancestor panels | text-xs (12px) minimum | This phase | ANCS-06 accessibility compliance |

**Deprecated/outdated after this phase:**
- `measurePillTop()` function: removed entirely
- `pillPositions` ref + `posVersion` state: removed
- ResizeObserver in GutterColumn: removed
- `pr-[80px] sm:pr-[140px]` padding hack: removed (grid handles separation)
- `transition-transform duration-200 translate-x-[-100%]`: removed (replaced with opacity)
- Variable ancestor panel widths (180/110/68): removed (fixed 28px rail)

## Open Questions

1. **Grid and MessageList component boundary**
   - What we know: Currently MessageList wraps MessageBlock components in a plain div. For grid, each MessageBlock needs a sibling pill cell.
   - What's unclear: Whether to keep MessageList as-is and restructure in ThreadView, or refactor MessageList to emit grid-compatible markup.
   - Recommendation: Inline the message iteration in ThreadView's grid container directly, or have MessageList accept a renderItem pattern. The planner should decide based on which minimizes change surface.

2. **Multiple pills per message stacking**
   - What we know: Multiple childLeads can reference the same message (different paragraphs). They should stack vertically in the pill cell.
   - What's unclear: Whether pills should be grouped by message or by paragraph within the same grid cell.
   - Recommendation: Group all pills for a message in one cell, ordered by paragraphIndex. Individual paragraph alignment within the message is not needed since the pill column is per-message-row.

3. **SpineStrip.tsx coexistence with new AncestorRail**
   - What we know: SpineStrip.tsx exists as a simple back-navigation strip (visible on mobile). The new AncestorRail replaces AncestorPeekPanel on desktop.
   - What's unclear: Whether SpineStrip should remain for mobile or be superseded.
   - Recommendation: Keep SpineStrip for mobile (below sm breakpoint) since ancestor rails are `hidden sm:block`. SpineStrip already handles this case.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PILL-01 | Pills render in CSS Grid (1fr auto) without JS measurement | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | No - Wave 0 |
| PILL-02 | No ResizeObserver or measurePillTop in new code | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | No - Wave 0 |
| PILL-03 | No pr-[80px]/pr-[140px] conditional padding | unit | `cd frontend && npx vitest run src/tests/threadView.test.tsx -x` | No - Wave 0 |
| PILL-04 | Thread transition uses opacity fade (not translate-x) | unit | `cd frontend && npx vitest run src/tests/threadTransition.test.tsx -x` | No - Wave 0 |
| PILL-05 | Rapid navigation cancels in-progress fade | unit | `cd frontend && npx vitest run src/tests/threadTransition.test.tsx -x` | No - Wave 0 |
| PILL-06 | Preview card flips when near viewport bottom | unit | `cd frontend && npx vitest run src/tests/previewCard.test.tsx -x` | No - Wave 0 |
| PILL-07 | Preview card has CSS triangle pointer | unit | `cd frontend && npx vitest run src/tests/previewCard.test.tsx -x` | No - Wave 0 |
| PILL-08 | Descendant pills hidden by default, shown on hover | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | No - Wave 0 |
| ANCS-01 | Ancestor panel renders as thin rail (24-32px) | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |
| ANCS-02 | Rail expands to ~220px on hover | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |
| ANCS-03 | Expanded panel is overlay with shadow-lg | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |
| ANCS-04 | Bottom fade gradient present | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |
| ANCS-05 | Anchor message has larger text + colored border + badge | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |
| ANCS-06 | No text-[10px] in rendered output | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/tests/gutterColumn.test.tsx` -- covers PILL-01, PILL-02, PILL-08 (grid layout, no JS measurement, descendant collapse)
- [ ] `frontend/src/tests/threadTransition.test.tsx` -- covers PILL-04, PILL-05 (crossfade, interruptibility)
- [ ] `frontend/src/tests/previewCard.test.tsx` -- covers PILL-06, PILL-07 (auto-flip, triangle pointer)
- [ ] `frontend/src/tests/ancestorRail.test.tsx` -- covers ANCS-01 through ANCS-06 (rail, overlay, highlight, text size)
- [ ] `frontend/src/tests/threadView.test.tsx` -- covers PILL-03 (no conditional padding classes)

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of GutterColumn.tsx, ThreadView.tsx, AncestorPeekPanel.tsx, AppShell.tsx, MessageBlock.tsx, MessageList.tsx, sessionStore.ts, selectors.ts, types/index.ts
- CSS Grid specification behavior (well-established, no version concerns)
- Tailwind CSS utility class patterns (established project convention)

### Secondary (MEDIUM confidence)
- CSS Grid `auto` column collapse behavior -- verified by spec: auto columns with no content collapse to 0 when no gap/padding is applied

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing dependencies
- Architecture: HIGH - CSS Grid and transitions are well-understood; codebase is fully analyzed
- Pitfalls: HIGH - based on direct analysis of existing code structure and grid behavior

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable CSS/React patterns, no fast-moving dependencies)
