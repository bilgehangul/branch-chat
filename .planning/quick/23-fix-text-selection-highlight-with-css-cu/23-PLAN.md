---
phase: quick-23
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useTextSelection.ts
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/branching/HighlightOverlay.tsx
  - frontend/tests/unit/useTextSelection.test.ts
autonomous: true
requirements: [QUICK-23]
must_haves:
  truths:
    - "Selected text appears highlighted (blue overlay) even after ActionBubble popup renders"
    - "Highlight overlay disappears when bubble is dismissed"
    - "Highlight tracks the correct text position inside the scroll container"
  artifacts:
    - path: "frontend/src/components/branching/HighlightOverlay.tsx"
      provides: "Visual highlight overlay component"
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Selection state with bounding rects for overlay"
  key_links:
    - from: "useTextSelection"
      to: "HighlightOverlay"
      via: "selectionRects array in bubble state"
      pattern: "selectionRects"
---

<objective>
Replace the unreliable native Range save/restore approach (quick-22) with a CSS overlay highlight that persists independently of browser selection and React re-renders.

Purpose: The quick-22 fix using savedRangeRef + requestAnimationFrame is unreliable because React re-renders may recreate DOM nodes that the cloned Range references. Instead, capture DOMRect coordinates of the selected text at selection time and render absolutely-positioned highlight divs at those coordinates.

Output: A HighlightOverlay component renders semi-transparent blue rectangles over the selected text area. The overlay lives inside the scroll container so it scrolls with content. When clearBubble fires, the overlay disappears.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/hooks/useTextSelection.ts
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/thread/ThreadView.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Capture selection rects and build HighlightOverlay component</name>
  <files>frontend/src/hooks/useTextSelection.ts, frontend/src/components/branching/HighlightOverlay.tsx, frontend/tests/unit/useTextSelection.test.ts</files>
  <action>
**useTextSelection.ts changes:**

1. Add a `selectionRects` field to `SelectionState`: an array of `{ top: number; left: number; width: number; height: number }` objects representing the highlight rectangles relative to the scroll container.

2. In the mouseup handler, AFTER getting the range and BEFORE calling setBubble, use `range.getClientRects()` to get all DOMRectList entries. For each rect, convert from viewport coordinates to scroll-container-relative coordinates by:
   - Getting `containerRef.current.getBoundingClientRect()` for the container's viewport offset
   - Getting `containerRef.current.scrollTop` and `containerRef.current.scrollLeft` for scroll offset
   - Computing: `relativeTop = rect.top - containerRect.top + scrollTop`, `relativeLeft = rect.left - containerRect.left + scrollLeft`
   - Store `{ top: relativeTop, left: relativeLeft, width: rect.width, height: rect.height }`

3. REMOVE the `savedRangeRef` and the useEffect that restores the range via requestAnimationFrame. That entire mechanism is being replaced by the overlay approach.

4. REMOVE `savedRangeRef.current = range.cloneRange()` from the mouseup handler.

5. In `clearBubble`, just `setBubble(null)` (remove savedRangeRef clearing since the ref no longer exists).

**HighlightOverlay.tsx:**

Create a new component:
```tsx
interface HighlightOverlayProps {
  rects: { top: number; left: number; width: number; height: number }[];
}

export function HighlightOverlay({ rects }: HighlightOverlayProps) {
  if (rects.length === 0) return null;
  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-sm"
          style={{
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}
```

The component renders absolutely-positioned divs inside the scroll container's content wrapper (which has `position: relative`). The divs use `pointer-events-none` so they don't interfere with text selection or clicks. The blue color (rgba(59,130,246,0.25)) matches Tailwind blue-500 at 25% opacity, similar to native selection highlight.

**Test updates (useTextSelection.test.ts):**

- Remove `cloneRange` from mock range objects (no longer needed).
- Add `getClientRects` mock to range objects returning a DOMRectList-like array with at least one rect.
- Update test assertions: when bubble is non-null, verify `selectionRects` is an array with the expected relative coordinates.
- Mock `containerRef.current.getBoundingClientRect()` to return a known rect (e.g., `{ top: 100, left: 50 }`) and set `scrollTop = 0`, `scrollLeft = 0` so relative coords = viewport coords minus container offset.
  </action>
  <verify>
    <automated>cd frontend && npx vitest run tests/unit/useTextSelection.test.ts --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>useTextSelection returns selectionRects in bubble state. savedRangeRef mechanism fully removed. HighlightOverlay component created. All useTextSelection tests pass with updated mocks.</done>
</task>

<task type="auto">
  <name>Task 2: Wire HighlightOverlay into ThreadView scroll container</name>
  <files>frontend/src/components/thread/ThreadView.tsx</files>
  <action>
In ThreadView.tsx:

1. Import `HighlightOverlay` from `../branching/HighlightOverlay`.

2. Find the scroll container's inner content wrapper (the div that has `position: relative` and contains MessageList). Render `<HighlightOverlay rects={bubble?.selectionRects ?? []} />` as a child of that wrapper. This ensures the overlay divs scroll with content since they are position:absolute inside a position:relative parent.

3. Verify the content wrapper has `position: relative` (it likely does for GutterColumn pill positioning already). If not, add `relative` to its className.

4. The overlay should render ONLY when `bubble` is non-null. When `clearBubble` sets bubble to null, the HighlightOverlay receives an empty array and returns null -- highlight disappears.

No other changes needed. The ActionBubble continues to work exactly as before (it uses bubble.top/left for its own positioning via position:fixed).
  </action>
  <verify>
    <automated>cd frontend && npx vitest run tests/unit/ --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>HighlightOverlay renders inside ThreadView scroll container when text is selected. Highlight divs appear at correct positions relative to scroll content. Highlight disappears when bubble is dismissed. All existing tests pass.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx vitest run tests/unit/useTextSelection.test.ts` -- all tests pass
2. `cd frontend && npx vitest run tests/unit/` -- no regressions
3. `cd frontend && npx tsc --noEmit` -- no type errors
</verification>

<success_criteria>
- Text selection triggers both the ActionBubble AND blue highlight overlay rectangles over the selected text
- The highlight overlay persists even after React re-renders (it uses stored coordinates, not native selection)
- Dismissing the bubble (clicking outside, pressing Escape, or clicking an action) removes the highlight
- The savedRangeRef / requestAnimationFrame restoration mechanism from quick-22 is fully removed
- All unit tests pass, no type errors
</success_criteria>

<output>
After completion, create `.planning/quick/23-fix-text-selection-highlight-with-css-cu/23-SUMMARY.md`
</output>
