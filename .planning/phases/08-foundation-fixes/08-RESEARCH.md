# Phase 8: Foundation Fixes - Research

**Researched:** 2026-03-11
**Domain:** React component fixes (text selection filtering, CSS theming, accessibility, test updates)
**Confidence:** HIGH

## Summary

Phase 8 is corrective work on existing implementations from Phases 4-6. No new features are introduced. The work spans four distinct technical areas: (1) filtering text selection so ActionBubble only triggers on assistant messages, (2) fixing annotation component colors for light mode, (3) making the model label dynamic instead of hardcoded "Gemini", and (4) adding accessibility foundations and updating tests.

All target files already exist and are well-understood. The changes are surgical -- data attributes for selection filtering, Tailwind dark: prefixes for light-mode colors, a small refactor to surface the active model name, and aria-label additions. The risk is low because no architectural changes are needed; this is CSS and DOM attribute work with one small state plumbing task (model label).

**Primary recommendation:** Implement in three plans as specified -- text selection filtering first (most complex), annotation display fixes second (isolated CSS), model label + accessibility + tests last (cleanup pass).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Each annotation type gets a distinct inline highlight color: Sources=amber/gold, Simplify=indigo/violet, Go Deeper=teal/cyan
- Colors must be readable in both dark and light themes (dual-theme variants)
- Multi-annotation highlights use CSS gradient blend of the two annotation colors
- Annotation cards show quoted targetText at top in italics, truncated to ~50 chars with ellipsis
- No upward-pointing caret on annotation cards (contradicts ANNO-02 requirement -- CONTEXT.md wins)
- Annotation cards match assistant message bubble width (max-w-[85%]), no independent max-w-[720px]
- Cards render inside the message bubble after the paragraph they annotate
- SimplificationBlock light-mode: bg-indigo-50, border-indigo-200
- CitationBlock light-mode: bg-stone-50, border-stone-200
- Dark-mode colors remain as-is
- ActionBubble: switch from position:fixed to position:absolute inside scroll container
- Position computed relative to content wrapper: rect.top - wrapperRect.top + scrollTop
- Instant dismiss (no fade) after 100px scroll from original scrollTop
- HighlightOverlay persists independently after bubble dismisses -- clears only on click elsewhere
- Bubble flips below selection when not enough space above
- Add data-message-role="assistant" attribute to assistant message wrappers
- Add data-no-selection attribute to annotation blocks, context cards, UI buttons
- useTextSelection checks selection originates within data-message-role="assistant" element
- Replace hardcoded "Gemini" with dynamic value from current provider/model setting
- Minimal accessibility: aria-labels + focus-visible outlines, no arrow-key nav or focus trapping
- WCAG AA contrast audit across ALL existing components
- Focus-visible outlines use ring-2 ring-offset-2 pattern
- Dedicated test-update pass at end of phase (not inline with each change)

### Claude's Discretion
- Exact hex values for annotation highlight colors (within amber/gold, indigo/violet, teal/cyan direction)
- CSS gradient blend implementation for multi-annotation highlights
- Bubble flip threshold (how much space above is "not enough")
- Focus-visible ring color and offset values
- Which specific elements need aria-labels (Claude audits all interactive elements)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TSEL-01 | Text selection only triggers ActionBubble on assistant message content | data-message-role check in useTextSelection + data-no-selection exclusion |
| TSEL-02 | MessageBlock wrapper has data-message-role="assistant" attribute | Add attribute to MessageBlock div, conditional on role |
| TSEL-03 | Annotation blocks, context cards, UI buttons have data-no-selection attribute | Add attribute to SimplificationBlock, CitationBlock, ContextCard wrappers |
| TSEL-04 | ActionBubble uses position:absolute inside scroll container | Refactor from fixed to absolute, move into contentWrapperRef |
| TSEL-05 | ActionBubble dismisses if user scrolls >100px from selection | Add scroll listener tracking delta from initial scrollTop |
| TSEL-06 | Bubble position computed relative to content wrapper | rect.top - wrapperRect.top + scrollTop formula |
| ANNO-01 | Selected target text highlighted inline with subtle background color | HighlightOverlay per-type coloring, annotation type prop |
| ANNO-02 | Annotation card has quoted targetText at top in italics | CONTEXT.md overrides: no caret, but DO add targetText quote |
| ANNO-03 | SimplificationBlock light-mode variant (bg-indigo-50 border-indigo-200) | Add dark: prefix to existing colors, add light-mode defaults |
| ANNO-04 | CitationBlock light-mode variant (bg-stone-50 border-stone-200) | Add dark: prefix to existing colors, add light-mode defaults |
| ANNO-05 | Annotation cards respect message bubble width (no max-w-[720px]) | Remove max-w-[720px] mx-auto from both annotation blocks |
| MSGE-01 | Model label is dynamic from current provider/model setting | Add backend /api/config endpoint or VITE_ env var, plumb to MessageBlock |
| XCUT-01 | All new interactive elements have aria-label, keyboard navigation, focus-visible outlines | Audit all buttons/links, add aria-labels and focus-visible ring classes |
| XCUT-02 | Settings modal traps focus | Not applicable yet (Phase 11) -- scope to existing modals if any |
| XCUT-03 | Color choices meet WCAG AA contrast ratios | Audit all text/bg combinations across both themes |
| XCUT-04 | Existing tests updated to match new DOM structure | Update selectors in messageBlock.test.tsx, citationBlock.test.tsx, etc. |
| XCUT-05 | New tests for text selection filtering, light-mode annotations | New vitest tests for useTextSelection role filtering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in use |
| Tailwind CSS | 4.2.1 | Utility-first styling | Already in use, dark: prefix for theming |
| Zustand | 5.0.11 | State management | Already in use for session store |
| Vitest | 4.0.18 | Unit test runner | Already configured with jsdom |
| Playwright | 1.58.2 | E2E test runner | Already configured for chromium |
| @testing-library/react | 16.3.2 | Component testing utilities | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/jest-dom | 6.9.1 | DOM matchers (toBeInTheDocument) | All component tests |
| jsdom | 28.1.0 | Browser environment for vitest | Configured in vitest.config.ts |

### Alternatives Considered
None -- this phase uses only existing stack. No new dependencies needed.

## Architecture Patterns

### Current Scroll Container Structure
```
ThreadView (flex flex-col h-full)
  scrollRef div (flex-1 overflow-y-auto)          <-- scroll container
    contentWrapperRef div (relative px-4)          <-- position:relative wrapper
      transition div (messages content)
        MessageList
          MessageBlock (data-message-id)           <-- needs data-message-role
            ContextCard                            <-- needs data-no-selection
            AI bubble div (max-w-[85%])
              MarkdownRenderer
              SimplificationBlock                  <-- needs data-no-selection
              CitationBlock                        <-- needs data-no-selection
      HighlightOverlay (absolute, inside wrapper)  <-- already correct
      GutterColumn (absolute, inside wrapper)
    ActionBubble (CURRENTLY: fixed, OUTSIDE scroll) <-- must move INSIDE wrapper
  ChatInput
```

### Pattern 1: Text Selection Filtering via Data Attributes
**What:** Use data-message-role and data-no-selection attributes to filter which selections trigger ActionBubble.
**When to use:** In useTextSelection hook, after validating selection range.
**Example:**
```typescript
// In useTextSelection handleMouseUp, after validating anchorBlock/focusBlock:
const messageEl = anchorBlock.closest('[data-message-id]');
// Check role attribute -- only assistant messages trigger bubble
const role = messageEl?.getAttribute('data-message-role');
if (role !== 'assistant') {
  setBubble(null);
  return;
}
// Check if selection is inside a no-selection zone
const noSelZone = (anchorEl as HTMLElement)?.closest?.('[data-no-selection]');
if (noSelZone) {
  setBubble(null);
  return;
}
```

### Pattern 2: ActionBubble Absolute Positioning
**What:** Convert ActionBubble from position:fixed to position:absolute within the scroll container's content wrapper.
**When to use:** ActionBubble must scroll with content.
**Example:**
```typescript
// Compute position relative to contentWrapper
const wrapperRect = contentWrapperRef.current.getBoundingClientRect();
const scrollTop = scrollRef.current.scrollTop;
const absoluteTop = rect.top - wrapperRect.top + scrollTop;
const absoluteLeft = rect.left - wrapperRect.left;

// Render ActionBubble INSIDE contentWrapperRef with position:absolute
// The existing contentWrapperRef has position:relative, so absolute children work
```

### Pattern 3: Scroll-Dismiss with Threshold
**What:** Track scrollTop at bubble creation time, dismiss when delta exceeds 100px.
**When to use:** Inside ThreadView or ActionBubble, listening to scroll events on scrollRef.
**Example:**
```typescript
// In ThreadView, when bubble is set:
const initialScrollTop = useRef<number>(0);
useEffect(() => {
  if (!bubble || !scrollRef.current) return;
  initialScrollTop.current = scrollRef.current.scrollTop;
  const handler = () => {
    const delta = Math.abs(scrollRef.current!.scrollTop - initialScrollTop.current);
    if (delta > 100) clearBubble();
  };
  scrollRef.current.addEventListener('scroll', handler, { passive: true });
  return () => scrollRef.current?.removeEventListener('scroll', handler);
}, [bubble]);
```

### Pattern 4: Tailwind Dark-Mode Color Variants
**What:** Use light-mode colors as default, dark: prefix for dark-mode colors.
**When to use:** Annotation blocks that currently only have dark-mode colors.
**Example:**
```tsx
// SimplificationBlock: BEFORE
<div className="bg-indigo-950 border-indigo-800 border-l-indigo-500">

// SimplificationBlock: AFTER
<div className="bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 border-l-indigo-500">
```

### Pattern 5: Dynamic Model Label
**What:** Surface the current AI provider/model name to the frontend.
**When to use:** MessageBlock label for assistant messages.
**Approach options:**
1. **VITE_ env var** (simplest): `VITE_AI_MODEL_LABEL` set at build time. Quick but static per deployment.
2. **Backend /api/config endpoint**: Returns `{ modelLabel: "Gemini Flash 2.0" }`. More flexible, prepares for Phase 11 BYOK.
3. **Hardcoded map from env var**: `VITE_AI_PROVIDER=gemini` -> label lookup table in frontend.

**Recommendation:** Use approach 2 (backend endpoint) -- it's minimal code and aligns with Phase 11 which will need dynamic provider switching. The endpoint returns the current default model display name. For now it reads from the existing config.ts singleton. Store the label in a lightweight React context or Zustand slice.

### Anti-Patterns to Avoid
- **Don't compute bubble position at render time only:** Capture scrollTop at creation, not on every render. Position should be stable until dismissed.
- **Don't use CSS `position:sticky` for bubble:** Sticky positioning is relative to the scroll container, not the content. Use absolute within the relative wrapper.
- **Don't add dark: prefixes to user message styles:** User messages use bg-blue-600 which works in both themes. Only annotation blocks need dual-theme treatment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG AA contrast checking | Manual color comparison | Browser DevTools contrast ratio inspector + online WCAG checker | Too many combinations to verify manually |
| Focus management for modals | Custom focus trap | (Phase 11) headless UI library | Focus trapping has many edge cases |
| Text selection range measurement | Custom range detection | window.getSelection() + Range API | Already established in useTextSelection |

**Key insight:** This phase is about fixing existing code, not building new systems. The hooks and components already exist -- the changes are attribute additions, CSS class changes, and one small state plumbing task.

## Common Pitfalls

### Pitfall 1: ActionBubble Position Jumps on Re-render
**What goes wrong:** If bubble position is computed from getBoundingClientRect on every render, it shifts when other content changes height (e.g., annotation loading shimmer).
**Why it happens:** getBoundingClientRect returns viewport-relative coordinates which change with scroll and layout shifts.
**How to avoid:** Compute absolute position ONCE at creation time (mouseup), store as top/left in state. Position is relative to contentWrapperRef which is stable.
**Warning signs:** Bubble visually jumps when annotations appear or streaming content arrives.

### Pitfall 2: Selection Rects Stale After Scroll
**What goes wrong:** HighlightOverlay rects were computed relative to scroll container at mouseup time. If the scroll container resizes or content reflows, rects are wrong.
**Why it happens:** Selection rects are snapshots, not live measurements.
**How to avoid:** Current approach (storing rects relative to scroll container content) is already correct. The rects move with content because they're positioned absolutely inside the relative wrapper.
**Warning signs:** Highlight rectangles misaligned with text after window resize.

### Pitfall 3: Tailwind 4 Dark Mode Class Syntax
**What goes wrong:** Tailwind 4 uses `dark:` variant selector which requires the `.dark` class on a parent element (or media query). The project already has this set up (FOUC script adds .dark).
**Why it happens:** Forgetting to add both light and dark variants when refactoring.
**How to avoid:** Always pair: `bg-indigo-50 dark:bg-indigo-950`. The light-mode color is the DEFAULT, dark: is the override.
**Warning signs:** Colors look wrong in one theme after refactoring.

### Pitfall 4: Existing Tests Break on Class Name Changes
**What goes wrong:** Tests in messageBlock.test.tsx select elements by CSS class (`.bg-zinc-800`, `.bg-indigo-950`). After adding light-mode variants, these dark-only selectors may not match in jsdom (which defaults to no .dark class).
**Why it happens:** jsdom doesn't apply Tailwind CSS -- it sees all classes but doesn't resolve dark: conditions.
**How to avoid:** Tests select by CSS class string presence (querySelector still works on `.bg-zinc-800` even with additional classes). BUT if we change default colors (e.g., CitationBlock from `bg-zinc-800` to `bg-stone-50 dark:bg-zinc-800`), tests querying `.bg-zinc-800` will fail because the element will have `bg-stone-50` as a class. Update test selectors to match new class names.
**Warning signs:** messageBlock.test.tsx failures after annotation color changes.

### Pitfall 5: data-no-selection on Wrong Element
**What goes wrong:** Placing data-no-selection on the annotation content div but not the wrapper means the closest() check won't catch selections that start in header text.
**Why it happens:** Annotations have header rows and content rows in separate divs.
**How to avoid:** Put data-no-selection on the outermost wrapper div of each annotation block.
**Warning signs:** Selecting annotation header text still triggers ActionBubble.

### Pitfall 6: Model Label Endpoint Not Available at Build Time
**What goes wrong:** If using a VITE_ env var approach, the model label is baked into the build. Changing the backend provider requires a frontend rebuild.
**Why it happens:** Vite env vars are compile-time constants.
**How to avoid:** Use a runtime API endpoint (/api/config) that returns model info. Cache on frontend load.
**Warning signs:** Model label shows stale value after backend provider change.

## Code Examples

### Text Selection Role Filtering (useTextSelection.ts addition)
```typescript
// After finding anchorMessage (line ~79-84 in current code):
const messageRole = anchorMessage.getAttribute('data-message-role');
if (messageRole !== 'assistant') {
  return; // silently ignore -- don't setBubble(null) to avoid clearing valid bubbles
}

// Check data-no-selection zones
const anchorParent = anchorEl as HTMLElement;
if (anchorParent?.closest?.('[data-no-selection]')) {
  return;
}
```

### MessageBlock data-message-role Attribute
```tsx
// In MessageBlock.tsx, line 42:
<div className="mb-6 max-w-[720px] mx-auto"
  data-message-id={message.id}
  data-message-role={message.role}  // NEW: "user" | "assistant"
>
```

### SimplificationBlock Light-Mode Fix
```tsx
// Outer wrapper -- BEFORE:
<div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-indigo-800 bg-indigo-950 border-l-4 border-l-indigo-500 text-sm">

// AFTER (remove max-w-[720px] mx-auto, add light-mode colors):
<div className="mt-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-500 text-sm"
  data-no-selection>
```

### CitationBlock Light-Mode Fix
```tsx
// Outer wrapper -- BEFORE:
<div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-zinc-700 bg-zinc-800 text-sm">

// AFTER (remove max-w-[720px] mx-auto, add light-mode colors):
<div className="mt-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm"
  data-no-selection>
```

### ActionBubble Absolute Positioning
```tsx
// In ThreadView, move ActionBubble INSIDE contentWrapperRef:
<div ref={contentWrapperRef} className="relative px-4">
  {/* ... messages, highlight overlay, gutter ... */}
  {bubble && activeThread && (
    <ActionBubble
      bubble={{
        ...bubble,
        top: bubbleAbsoluteTop,  // computed relative to wrapper
        left: bubbleAbsoluteLeft,
      }}
      // ... other props
    />
  )}
</div>

// ActionBubble.tsx -- change from fixed to absolute:
<div className="absolute z-50 ..." style={{ top: bubble.top, left: bubble.left, transform: '...' }}>
```

### Focus-Visible Ring Pattern
```tsx
// Consistent pattern for all interactive elements:
className="... focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
```

### Backend Config Endpoint (for MSGE-01)
```typescript
// backend/src/routes/index.ts -- add simple config route
router.get('/api/config', (_req, res) => {
  const provider = process.env.AI_PROVIDER ?? 'gemini';
  const modelLabels: Record<string, string> = {
    gemini: 'Gemini Flash 2.0',
    openai: 'GPT-4o',
  };
  res.json({ modelLabel: modelLabels[provider] ?? provider });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind 3 darkMode: 'class' config | Tailwind 4 built-in dark: variant (no config needed) | Tailwind 4.0 (2024) | dark: prefix works out of box |
| position:fixed for floating UI | position:absolute inside scroll containers | Standard practice | Scrolls with content naturally |
| Hardcoded provider labels | Dynamic model label from backend config | Phase 8 (now) | Prepares for Phase 11 BYOK |

## Open Questions

1. **XCUT-02 scope in Phase 8**
   - What we know: XCUT-02 says "Settings modal traps focus" but Settings modal is Phase 11.
   - What's unclear: Is there any existing modal that needs focus trapping in Phase 8?
   - Recommendation: Skip XCUT-02 focus-trap implementation; there are no modals yet. Add aria-labels to existing interactive elements only. Document that XCUT-02 will be fully implemented in Phase 11.

2. **ANNO-02 conflict between REQUIREMENTS.md and CONTEXT.md**
   - What we know: REQUIREMENTS.md says "small upward-pointing caret and quoted targetText". CONTEXT.md says "No upward-pointing caret".
   - Resolution: CONTEXT.md wins (user decision). Add quoted targetText at top in italics, truncated to ~50 chars. No caret.

3. **Model label for streaming messages**
   - What we know: Label shows next to AI messages. During streaming, content arrives in chunks.
   - What's unclear: Should label show immediately when message starts streaming, or only after complete?
   - Recommendation: Label shows immediately (it's the avatar label, not dependent on content). Fetch model label once at app load, cache it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (unit) + Playwright 1.58.2 (E2E) |
| Config file | frontend/vitest.config.ts, frontend/playwright.config.ts |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TSEL-01 | Selection on non-assistant messages does NOT trigger bubble | unit | `cd frontend && npx vitest run src/tests/useTextSelection.test.ts -x` | No -- Wave 0 |
| TSEL-02 | MessageBlock has data-message-role attribute | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes (needs update) |
| TSEL-03 | Annotation blocks have data-no-selection attribute | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes (needs update) |
| TSEL-04 | ActionBubble uses absolute positioning | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes (needs update) |
| TSEL-05 | Bubble dismisses on 100px scroll | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes (needs new test) |
| TSEL-06 | Bubble position relative to wrapper | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes (needs update) |
| ANNO-01 | Target text highlighted with type-specific color | unit | `cd frontend && npx vitest run src/tests/highlightOverlay.test.tsx -x` | No -- Wave 0 |
| ANNO-02 | Annotation card shows targetText quote | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx -x` | Yes (needs update) |
| ANNO-03 | SimplificationBlock light-mode colors | unit | `cd frontend && npx vitest run src/tests/simplificationBlock.test.tsx -x` | Yes (needs update) |
| ANNO-04 | CitationBlock light-mode colors | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx -x` | Yes (needs update) |
| ANNO-05 | No max-w-[720px] on annotation cards | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes (needs update) |
| MSGE-01 | Dynamic model label | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes (needs update) |
| XCUT-01 | Interactive elements have aria-labels | unit | `cd frontend && npx vitest run src/tests/accessibility.test.tsx -x` | No -- Wave 0 |
| XCUT-02 | Focus trapping | manual-only | N/A -- no modals exist yet | N/A |
| XCUT-03 | WCAG AA contrast ratios | manual-only | Browser DevTools audit | N/A |
| XCUT-04 | Existing tests pass with new DOM | unit | `cd frontend && npx vitest run` | Yes (needs updates) |
| XCUT-05 | New tests for selection filtering, light-mode | unit | `cd frontend && npx vitest run src/tests/useTextSelection.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `frontend/src/tests/useTextSelection.test.ts` -- covers TSEL-01, XCUT-05 (selection filtering unit tests)
- [ ] `frontend/src/tests/highlightOverlay.test.tsx` -- covers ANNO-01 (per-type highlight colors)
- [ ] `frontend/src/tests/accessibility.test.tsx` -- covers XCUT-01 (aria-label presence checks)
- [ ] Update `frontend/src/tests/messageBlock.test.tsx` selectors for new class names and data attributes

## Sources

### Primary (HIGH confidence)
- Direct code inspection of all target files in the repository
- Existing test files (actionBubble.test.tsx, messageBlock.test.tsx, citationBlock.test.tsx, simplificationBlock.test.tsx)
- frontend/package.json for exact dependency versions
- vitest.config.ts and playwright.config.ts for test infrastructure

### Secondary (MEDIUM confidence)
- Tailwind CSS 4.x dark mode behavior (dark: variant prefix) -- consistent with project's existing usage pattern

### Tertiary (LOW confidence)
- None -- all findings verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, versions confirmed from package.json
- Architecture: HIGH - all target files read and understood, patterns derived from existing code
- Pitfalls: HIGH - identified from actual code analysis (test selectors, class names, positioning logic)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no external dependency changes expected)
