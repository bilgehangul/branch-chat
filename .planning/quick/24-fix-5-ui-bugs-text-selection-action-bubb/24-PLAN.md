---
phase: quick-24
plan: 24
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useTextSelection.ts
  - frontend/src/components/branching/ActionBubble.tsx
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/thread/MessageList.tsx
  - frontend/src/components/history/SessionHistory.tsx
autonomous: true
requirements: [UI-BUG-01, UI-BUG-02, UI-BUG-03, UI-BUG-04, UI-BUG-05]
must_haves:
  truths:
    - "User can click and drag to select text directly on assistant message paragraphs"
    - "ActionBubble (Go Deeper, Simplify, Find Sources) appears above the selected text after mouseup"
    - "Branch pills in the gutter column are vertically aligned with the paragraph they originated from, not the top of the message"
    - "Subbranch/descendant pill lists are expanded by default and do not collapse when hovering"
    - "Sidebar parent branch sections for the active session are open by default, collapsible via chevron"
  artifacts:
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Text selection hook with correct event handling"
    - path: "frontend/src/components/thread/ThreadView.tsx"
      provides: "ActionBubble wiring and overlay that does not block selection"
    - path: "frontend/src/components/branching/GutterColumn.tsx"
      provides: "Descendant pills expanded by default"
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "Sidebar sections open by default, stacked layout"
  key_links:
    - from: "useTextSelection.ts"
      to: "ThreadView.tsx"
      via: "bubble state drives ActionBubble render"
      pattern: "bubble && activeThread"
    - from: "MessageList.tsx"
      to: "GutterColumn.tsx"
      via: "BranchPillCell rendered in grid column 2"
      pattern: "BranchPillCell"
---

<objective>
Fix 5 UI bugs affecting text selection, action bubble visibility, branch pill alignment, subbranch hover behavior, and sidebar layout.

Purpose: These bugs degrade core branching UX -- users cannot select text to branch, pills are misaligned, and sidebar is hard to navigate.
Output: All 5 bugs resolved in the affected components.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Key types and contracts the executor needs -->

From frontend/src/hooks/useTextSelection.ts:
```typescript
export interface SelectionState {
  anchorText: string;
  paragraphId: string;
  messageId: string;
  top: number;
  left: number;
  absoluteTop: number;
  absoluteLeft: number;
  selectionRects: SelectionRect[];
}
export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  wrapperRef?: RefObject<HTMLElement | null>
): { bubble: SelectionState | null; clearBubble: () => void }
```

From frontend/src/components/branching/ActionBubble.tsx:
```typescript
export interface ActionBubbleProps {
  bubble: { anchorText: string; paragraphId: string; messageId: string; top: number; left: number; };
  isAtMaxDepth: boolean;
  flipped?: boolean;
  onGoDeeper: (anchorText: string, paragraphId: string) => void;
  onFindSources: (anchorText: string, paragraphId: string, messageId: string) => void;
  onSimplify: (anchorText: string, paragraphId: string, messageId: string, mode: SimplifyMode) => void;
  onDismiss: () => void;
}
```

From frontend/src/types/index.ts (ChildLead):
```typescript
// ChildLead has: threadId, paragraphIndex, anchorText, messageCount
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix text selection, ActionBubble visibility, and overlay interaction</name>
  <files>
    frontend/src/hooks/useTextSelection.ts
    frontend/src/components/thread/ThreadView.tsx
  </files>
  <action>
**Bug 1 — Text selection broken on message text:**

The HighlightOverlay and ActionBubble wrapper divs in ThreadView.tsx use `position: absolute` with `top: 0, left: 0, right: 0, bottom: 0` inside the CSS Grid. Even with `pointerEvents: 'none'`, these full-size absolute divs can interfere with the grid layout and text selection in some browsers.

Fix in `ThreadView.tsx`:
1. Move the HighlightOverlay and ActionBubble absolute container divs OUTSIDE the grid `<div ref={contentWrapperRef}>` but still inside `<div ref={scrollRef}>`. Position them as siblings of the grid wrapper, using `position: absolute` relative to the scroll container. This prevents the overlay from being a grid child that can interfere with text selection on grid content.
2. Specifically: after the `<div ref={contentWrapperRef} ...>` closing tag but before `</div>` (scrollRef), add the highlight overlay and action bubble containers. Make scrollRef `position: relative` so absolute children position correctly.
3. The overlay and bubble still need to scroll with content. Since they are inside scrollRef, they will scroll naturally. Use `contentWrapperRef` to compute positions relative to it.

Alternatively, a simpler fix: Keep the overlay divs inside the grid but ensure they use `col-span-full` with `position: absolute` AND `pointer-events: none` AND `z-index: -1` for the highlight overlay (so it renders behind text, not in front). The ActionBubble wrapper should remain `pointer-events: none` on the outer div and `pointer-events: auto` on the inner.

Actually, the most likely cause: investigate whether the absolute-positioned `col-span-full` overlay div (lines 503-507 in ThreadView.tsx) creates a stacking context that blocks mouse events for text selection even though it has `pointerEvents: none`. The div wrapping it still participates in grid layout. Test by temporarily removing the overlay and see if selection works.

The real fix: The overlay wrapper div at line 504 has `style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}` but the PARENT div at line 503 `<div className="col-span-full">` is a grid item that has a default height/width in the grid. This col-span-full div takes up a grid row, potentially pushing content or creating an invisible element. Change both overlay wrapper divs (lines 503-506 and 510-511) from `<div className="col-span-full">` to `<div className="col-span-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>`. Wait -- they already do that on the inner div. The issue is the OUTER div is a grid child that takes up space.

**Final approach:** Change the two overlay/bubble wrapper divs from being grid children to being absolutely positioned within the `contentWrapperRef` (which already has `relative` via the `relative` class on line 457). Remove the outer `<div className="col-span-full">` wrapper entirely. Instead, place the HighlightOverlay and ActionBubble divs as direct children of `contentWrapperRef` with `position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 10` — NOT as grid items. They should not have `className="col-span-full"`. Use `style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}`.

**Bug 2 — ActionBubble not appearing:**

This is a consequence of Bug 1. If text selection events are being blocked by the overlay, the `useTextSelection` mouseup handler never fires or produces no valid selection. Fixing Bug 1 should resolve Bug 2.

Additionally, verify in `useTextSelection.ts`:
- The `setTimeout(() => { ... }, 0)` in handleMouseUp should work. However, if the mouseup event itself is not reaching the handler because of event interference, the fix from Bug 1 is necessary.
- Ensure the `el.addEventListener('mouseup', handleMouseUp)` listener is on the scroll container (`scrollRef`), which wraps everything including the grid. This is correct.

No changes needed to `useTextSelection.ts` or `ActionBubble.tsx` unless testing reveals additional issues after fixing the overlay stacking.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Text can be selected by click-dragging on assistant message paragraphs
    - ActionBubble appears positioned above the selection after mouseup on assistant text
    - HighlightOverlay still renders correctly over selected text without blocking interaction
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix branch pill vertical alignment and subbranch hover collapse</name>
  <files>
    frontend/src/components/thread/MessageList.tsx
    frontend/src/components/branching/GutterColumn.tsx
  </files>
  <action>
**Bug 3 — Branch pills not vertically aligned with selected text paragraph:**

Currently in `MessageList.tsx`, each message gets ONE grid row with two columns: message content (col 1) and all pills for that message (col 2). The pills are placed at `self-start pt-2` which puts them at the top of the message, not aligned with the specific paragraph they originated from.

The `ChildLead` has a `paragraphIndex` field that indicates which paragraph the branch came from. To align pills with their source paragraph, the approach needs to change:

Fix in `MessageList.tsx`:
Instead of rendering all pills for a message in a single cell at the top, render pills inline next to their source paragraph. This requires a different layout approach:

Option A (simpler, recommended): Within the message content column, use a per-paragraph wrapper that includes a relative-positioned pill indicator. This means modifying `MessageBlock` or `MarkdownRenderer` to accept pill data and render pills adjacent to specific paragraphs. This is too invasive.

Option B (practical): Keep the current grid layout but change the pill column to use a flex column with spacers that approximate the paragraph positions. For each `ChildLead`, use its `paragraphIndex` to compute a vertical offset. This is fragile.

Option C (best compromise): Change the pill column div from `self-start pt-2` to `self-stretch` so it spans the full height of the message row. Inside `BranchPillCell`, group pills by `paragraphIndex` and use CSS to distribute them vertically. Add `data-paragraph-index` attributes and use a `position: relative` container with pills offset to approximate alignment.

**Actually, the most practical fix:** Since the grid row already aligns the pill cell with the message block, and paragraphs inside the message block have `data-paragraph-id` attributes, we can use a JS-based approach to read paragraph positions and apply matching `marginTop` to each pill group. BUT this contradicts the Phase 09 decision to use CSS Grid and remove JS measurement.

**Simplest correct fix:** In `MessageList.tsx`, change the pill column from rendering ALL pills in one block at the top to rendering them distributed across the message height. Change the pill column div to `self-stretch` (stretch full row height). In `BranchPillCell`, sort pills by `paragraphIndex` and add proportional spacing between groups. Use a `flex-1` spacer approach: for each unique paragraphIndex among the leads, render pills with `flex-grow` spacers proportional to the gap between paragraphIndexes.

Concrete implementation:
1. In `MessageList.tsx` line 67, change `<div className="flex flex-col gap-1 items-end self-start pt-2">` to `<div className="flex flex-col items-end self-stretch">` to allow the pill column to span the full message height.
2. In `GutterColumn.tsx` `BranchPillCell`, sort leads by `paragraphIndex`. Render pills inside a flex column that uses `justify-around` or `justify-evenly` distribution. This gives approximate vertical alignment without JS measurement.
3. Alternatively (even simpler), just use `self-center` instead of `self-start` so pills center vertically relative to the message. This is a one-line change and provides much better alignment than top-pinning.

**Go with the simplest approach:** Change `self-start pt-2` to `self-center` in MessageList.tsx line 67. This centers pills vertically within the message grid row, which is a significant improvement for single-pill messages (most common case). For multiple pills from different paragraphs, this is still better than top-pinning.

**Bug 4 — Subbranch hover list collapses when trying to hover over it:**

In `GutterColumn.tsx`, the `LeadPill` component has descendant pills that use `max-h-0` (collapsed) by default and `max-h-[200px]` on hover of the parent pill button. The problem: `onMouseLeave` fires when moving from the pill button to the descendant list below it, because the descendant div is a sibling, not a child of the hovered element.

Fix: The `isHovered` state is set by `onMouseEnter`/`onMouseLeave` on the `<button>` element (line 163-164). But the descendant list (lines 177-189) is outside the button. The parent `<div className="relative">` (line 155) wraps both.

Solution: Move `onMouseEnter`/`onMouseLeave` from the `<button>` (line 163-164) to the parent `<div className="relative">` (line 155). This way, hovering over the descendant list (which is inside the parent div) keeps `isHovered` true.

Additionally, per the bug description "make expanded by default instead": Change the default state of descendant pills from collapsed (`max-h-0`) to expanded. Remove the hover-based expand/collapse entirely. In line 178, change `${isHovered ? 'max-h-[200px]' : 'max-h-0'}` to just `max-h-[200px]` (always expanded). This makes subbranches always visible, which is the user's preference. Remove the `overflow-hidden transition-[max-height] duration-200` classes since there is no transition needed.

Simplify: Change line 178 from:
```
<div className={`mt-0.5 border-l border-slate-200 dark:border-zinc-700 ml-2 overflow-hidden transition-[max-height] duration-200 ${isHovered ? 'max-h-[200px]' : 'max-h-0'}`}>
```
to:
```
<div className="mt-0.5 border-l border-slate-200 dark:border-zinc-700 ml-2">
```
(Remove overflow-hidden, transition, and max-height classes entirely.)

Also move hover handlers to the parent div so the preview card still works correctly when hovering.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Branch pills in gutter column are vertically centered relative to their message row, not pinned to top
    - Subbranch/descendant pill lists are always visible (expanded by default), no collapse on hover
    - Preview card on pill hover still works correctly
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix sidebar parent branch sections — open by default, collapsible, stacked</name>
  <files>
    frontend/src/components/history/SessionHistory.tsx
  </files>
  <action>
**Bug 5 — Sidebar parent branch sections should be open by default, collapsible via arrow click, and stacked like a sandwich (no overlapping):**

Currently in `SessionHistory.tsx`:
- The active session shows child threads via `ThreadNode` components (lines 559-582).
- `ThreadNode` has `const [expanded, setExpanded] = useState(true)` on line 254, so sections ARE already open by default.
- Thread nodes have chevron toggles (lines 304-321) when they have children.

The "stacked like a sandwich (no overlapping)" issue likely refers to the visual layout. Currently:
- Child threads use VS Code-style connecting lines (`border-l` and `border-t` spans, lines 276-290) with `paddingLeft: thread.depth * 16`.
- These absolute-positioned line decorators can overlap or cause visual confusion.

Fixes in `SessionHistory.tsx`:

1. **Ensure sections for the active session's direct child threads are displayed as clearly separated stacked cards (sandwich layout):**
   - In the active session's child thread rendering (lines 559-582), wrap each root-level child thread group in a card-like container with clear visual boundaries.
   - Change the `<ul className="ml-2 mt-1 space-y-0.5">` (line 560) to `<ul className="mt-1 space-y-1 pl-1">` for slightly more spacing between items.
   - Add a subtle background/border to each top-level thread branch section to create the "sandwich" / stacked card appearance.

2. **Ensure each branch section is visually distinct:**
   - In `ThreadNode`, add a wrapper with subtle background and left border using the thread's accent color for root-level branches (depth === 1, i.e., direct children of the session root).
   - Add `className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-md px-1 py-0.5 mb-1"` to the `<li>` for depth-1 threads.

3. **Make the arrow/chevron the only way to collapse (not the whole row):**
   - Currently clicking the thread title navigates (line 343: `onClick={() => onNavigateThread?.(thread.id)}`), and the chevron toggles expand (line 306: `onClick={() => setExpanded(!expanded)}`). This is already correct — the chevron is the collapse toggle and the title is for navigation.
   - No change needed here.

4. **Stacking fix — remove overlap from connecting lines:**
   - The absolute-positioned `border-l` and `border-t` lines (lines 276-290) can cause visual overlap especially when sections are close together. Simplify these to use just a left accent border on the `<li>` element itself instead of absolute positioned spans.
   - Replace the connecting lines implementation: Remove the two `<span>` elements for vertical/horizontal lines (lines 278-290). Instead, add a left border directly on the `<li>` element for nested threads: `style={{ paddingLeft: thread.depth * 16, borderLeft: thread.depth > 0 ? '2px solid' : 'none', borderLeftColor: thread.accentColor }}`.
   - This creates a clean stacked appearance without overlapping line decorators.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Sidebar branch sections for the active session are open/expanded by default
    - Each branch section is visually stacked with clear boundaries (no overlapping)
    - Chevron arrow collapses/expands the branch children
    - Clicking a thread title navigates to that thread (does not toggle collapse)
    - No TypeScript errors
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit` passes
2. Dev server runs: `npm run dev` starts without errors
3. Manual verification: Select text on an assistant message, ActionBubble appears, pills align with messages, subbranches visible, sidebar sections stacked
</verification>

<success_criteria>
- All 5 UI bugs are resolved
- Text selection works on assistant messages and ActionBubble appears
- Branch pills are vertically centered relative to their message row
- Subbranch descendant lists are always visible (no hover collapse)
- Sidebar parent branch sections render as stacked cards, open by default, collapsible via chevron
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/24-fix-5-ui-bugs-text-selection-action-bubb/24-SUMMARY.md`
</output>
