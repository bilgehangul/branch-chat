---
phase: quick-25
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useTextSelection.ts
  - frontend/src/components/branching/ActionBubble.tsx
  - frontend/src/components/branching/HighlightOverlay.tsx
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/history/SessionHistory.tsx
autonomous: true
requirements: [FIX-TEXT-SELECTION, FIX-SIDEBAR-COLLAPSE]
must_haves:
  truths:
    - "User can select text in assistant messages without overlay divs blocking mouse events"
    - "ActionBubble appears at correct viewport position above/below selection"
    - "ActionBubble dismisses on click outside or scroll past 100px threshold"
    - "Go Deeper, Find Sources, Simplify actions all work from the portal-rendered bubble"
    - "HighlightOverlay renders selection highlight without interfering with text selection"
    - "Sidebar ThreadNode sections are collapsed by default"
    - "Each ThreadNode expand/collapse toggle works independently per layer"
  artifacts:
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Simplified viewport-coords-only selection hook"
    - path: "frontend/src/components/branching/ActionBubble.tsx"
      provides: "position:fixed portal-rendered action bubble"
    - path: "frontend/src/components/thread/ThreadView.tsx"
      provides: "Clean grid with no overlay divs — bubble/highlight rendered via portal"
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "Collapsed-by-default ThreadNode sections"
  key_links:
    - from: "frontend/src/components/thread/ThreadView.tsx"
      to: "ActionBubble via createPortal"
      via: "React portal to document.body"
      pattern: "createPortal.*ActionBubble"
    - from: "frontend/src/hooks/useTextSelection.ts"
      to: "ThreadView bubble state"
      via: "useTextSelection(scrollRef) — no wrapperRef needed"
      pattern: "useTextSelection\\(scrollRef\\)"
---

<objective>
Fix two broken UI systems: (1) rewrite text selection + ActionBubble from scratch using position:fixed and React Portal to eliminate overlay divs that block mouse events inside the CSS Grid, and (2) fix sidebar ThreadNode sections to be collapsed by default with independent per-layer expand/collapse.

Purpose: Text selection is fundamentally broken — overlay divs inside the CSS Grid prevent mouse events. Sidebar sections expand by default, cluttering the view.
Output: Working text selection with portal-based ActionBubble, collapsed-by-default sidebar sections.
</objective>

<context>
@frontend/src/hooks/useTextSelection.ts
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/branching/HighlightOverlay.tsx
@frontend/src/components/thread/ThreadView.tsx
@frontend/src/components/thread/MessageList.tsx
@frontend/src/components/history/SessionHistory.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite text selection system with position:fixed portal</name>
  <files>
    frontend/src/hooks/useTextSelection.ts,
    frontend/src/components/branching/ActionBubble.tsx,
    frontend/src/components/branching/HighlightOverlay.tsx,
    frontend/src/components/thread/ThreadView.tsx
  </files>
  <action>
    **Step 1: Simplify useTextSelection.ts**

    Remove all wrapperRef-relative coordinate logic. The hook should only need `containerRef` (the scroll container). Remove:
    - `absoluteTop` and `absoluteLeft` fields from `SelectionState`
    - The `wrapperRef` parameter entirely
    - All computation of absolute coordinates relative to wrapperRef

    Keep:
    - `top` and `left` as viewport-relative coordinates (from `getBoundingClientRect`)
    - `selectionRects` computed relative to the scroll container (for HighlightOverlay)
    - `anchorText`, `paragraphId`, `messageId`
    - All the selection validation logic (same-message check, assistant-only, no-selection zones)
    - The setTimeout(0) mouseup pattern

    Updated `SelectionState` interface:
    ```typescript
    export interface SelectionState {
      anchorText: string;
      paragraphId: string;
      messageId: string;
      top: number;         // viewport-relative Y (for fixed positioning)
      left: number;        // viewport-relative X, centered and clamped
      selectionRects: SelectionRect[];
    }
    ```

    Updated function signature: `useTextSelection(containerRef: RefObject<HTMLElement | null>)` — no second parameter.

    **Step 2: Rewrite ActionBubble.tsx to use position:fixed**

    Change the outer container div from `className="absolute ..."` to `className="fixed ..."`. The `style` prop should use `top` and `left` directly from bubble props (these are now viewport coordinates). Keep the `transform: translateY(calc(-100% - 8px))` for above-selection positioning and `translateY(8px)` for flipped (below-selection).

    Update the `ActionBubbleProps.bubble` type — remove any absolute coordinate fields. It should only have: `anchorText`, `paragraphId`, `messageId`, `top`, `left`.

    All existing button logic, mode switching (default/simplify), mousedown preventDefault, dismiss-on-click-outside, and action handlers remain unchanged.

    **Step 3: Rewrite ThreadView.tsx — remove overlay div, use React Portal**

    Import `createPortal` from `react-dom`.

    Remove the entire overlay div block (lines ~507-544 in current code — the `<div className="col-span-full" style={{ position: 'relative', height: 0, overflow: 'visible', pointerEvents: 'none' }}>` and everything inside it).

    Remove the `contentWrapperRef` ref entirely — it is no longer needed. Update the `useTextSelection` call to only pass `scrollRef` (no second arg):
    ```typescript
    const { bubble, clearBubble } = useTextSelection(scrollRef);
    ```

    Remove the grid wrapper's `relative` class (it was only needed for the absolute-positioned overlay children). The grid div should keep its grid layout but no longer needs `relative`.

    Render ActionBubble and HighlightOverlay via React Portal to `document.body`, placed AFTER the closing `</div>` of the flex-col container (i.e., outside the component tree entirely via portal). Use this pattern:

    ```tsx
    {/* Portal: ActionBubble + HighlightOverlay rendered outside the grid */}
    {bubble && activeThread && createPortal(
      <ActionBubble
        bubble={{
          anchorText: bubble.anchorText,
          paragraphId: bubble.paragraphId,
          messageId: bubble.messageId,
          top: bubble.top,
          left: bubble.left,
        }}
        isAtMaxDepth={isAtMaxDepth(activeThread)}
        flipped={bubble.top < 80}
        onGoDeeper={handleGoDeeper}
        onFindSources={(anchorText, paragraphId, messageId) =>
          void handleFindSources(anchorText, paragraphId, messageId)
        }
        onSimplify={(anchorText, paragraphId, messageId, mode) =>
          void handleSimplify(anchorText, paragraphId, messageId, mode as SimplifyMode)
        }
        onDismiss={clearBubble}
      />,
      document.body
    )}
    {(bubble || lastSelectionRectsRef.current.length > 0) && createPortal(
      <HighlightOverlay
        rects={bubble ? bubble.selectionRects : lastSelectionRectsRef.current}
        annotationType={undefined}
        scrollRef={scrollRef}
      />,
      document.body
    )}
    ```

    Note the `flipped` threshold changes from `bubble.absoluteTop < 60` to `bubble.top < 80` (viewport coords — 80px from top of viewport is a reasonable threshold).

    **Step 4: Update HighlightOverlay.tsx for portal rendering**

    Since HighlightOverlay now renders in a portal (outside the scroll container), its rects (which are relative to the scroll container) need to be converted to viewport coordinates. Add a `scrollRef` prop:

    ```typescript
    interface HighlightOverlayProps {
      rects: SelectionRect[];
      annotationType?: 'source' | 'simplification' | 'go-deeper';
      scrollRef?: RefObject<HTMLElement | null>;
    }
    ```

    The component should:
    1. Use `position: fixed` for the wrapper (or each rect div)
    2. Convert each rect from scroll-container-relative to viewport coords:
       - If `scrollRef.current` exists: `viewportTop = containerRect.top + rect.top - container.scrollTop`
       - Similarly for left: `viewportLeft = containerRect.left + rect.left - container.scrollLeft`
    3. Use `pointer-events: none` and `z-index: 40` (below ActionBubble's z-50)
    4. Only render rects that are within the visible viewport area (clip to container bounds)

    Keep the HIGHLIGHT_COLORS map and per-annotation-type color logic unchanged.

    **Important integration notes:**
    - The `lastSelectionRectsRef` logic in ThreadView stays the same — it persists highlight rects after bubble dismiss
    - The scroll-dismiss effect (100px threshold) stays the same
    - The click-outside dismiss logic stays the same
    - All handleGoDeeper/handleFindSources/handleSimplify logic is unchanged
    - The crossfade transition logic is unchanged
    - Remove `contentWrapperRef` from the grid div's `ref` attribute
  </action>
  <verify>
    Run `cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit` to verify no TypeScript errors. Then run `cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npm run build --prefix frontend` to verify the build succeeds.
  </verify>
  <done>
    - Text selection works naturally on assistant message content (no overlay divs blocking mouse events)
    - ActionBubble appears at correct viewport position via React Portal with position:fixed
    - ActionBubble dismisses on click outside or 100px scroll
    - HighlightOverlay renders selection highlight via portal without interfering with the grid
    - All three actions (Go Deeper, Find Sources, Simplify) function correctly
    - No overlay divs remain inside the CSS Grid
    - TypeScript compiles clean, build succeeds
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix sidebar ThreadNode collapsed by default</name>
  <files>frontend/src/components/history/SessionHistory.tsx</files>
  <action>
    In the `ThreadNode` component (line 254 of SessionHistory.tsx), change the default state of `expanded` from `true` to `false`:

    ```typescript
    const [expanded, setExpanded] = useState(false);
    ```

    This is the only change needed. The expand/collapse toggle button already exists per ThreadNode (the SVG chevron at lines 292-306). Each ThreadNode already manages its own independent `expanded` state. The chevron already rotates 90 degrees when expanded. The children already conditionally render based on `expanded` (line 372).

    The stacking layout is already correct — when expanded, children render as subsequent `<li>` elements with increasing `paddingLeft` based on `thread.depth * 16`. There is no overlapping issue because each child is a normal flow element.

    No other changes needed — the architecture for per-layer independent expand/collapse is already in place; only the default value was wrong.
  </action>
  <verify>
    Run `cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit` to verify no TypeScript errors.
  </verify>
  <done>
    - Sidebar ThreadNode sections are collapsed by default (chevron pointing right)
    - Clicking the chevron expands that specific layer independently
    - Expanded layers stack cleanly without overlapping
    - Each layer's toggle is independent of other layers
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run build --prefix frontend` succeeds
3. Manual check: select text in an assistant message — ActionBubble appears above/below selection at correct position
4. Manual check: click outside bubble or scroll 100px — bubble dismisses
5. Manual check: Go Deeper / Find Sources / Simplify actions work from the bubble
6. Manual check: sidebar thread sections are collapsed by default, expand independently on chevron click
</verification>

<success_criteria>
- Zero overlay divs inside the CSS Grid (no height:0 overflow:visible pointer-events:none hacks)
- ActionBubble rendered via React Portal with position:fixed
- HighlightOverlay rendered via React Portal
- useTextSelection simplified to viewport-coords-only (no wrapperRef parameter)
- Sidebar ThreadNode sections collapsed by default
- TypeScript compiles clean, production build succeeds
</success_criteria>
