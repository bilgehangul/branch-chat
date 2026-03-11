---
phase: quick-22
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useTextSelection.ts
  - frontend/src/components/branching/ActionBubble.tsx
autonomous: true
requirements: [QUICK-22]
must_haves:
  truths:
    - "Browser text selection highlight remains visible after drag-selecting text in an AI response"
    - "ActionBubble buttons remain functional (Go Deeper, Find Sources, Simplify) with selection still visible"
    - "Selection is cleared normally when user clicks away or dismisses bubble"
  artifacts:
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Selection preservation across React re-renders"
    - path: "frontend/src/components/branching/ActionBubble.tsx"
      provides: "Non-focus-stealing bubble container"
  key_links:
    - from: "useTextSelection.ts"
      to: "ThreadView.tsx"
      via: "bubble state + clearBubble"
      pattern: "useTextSelection\\(scrollRef\\)"
---

<objective>
Fix the browser text selection highlight disappearing after drag-selecting text in an AI response.

Purpose: When a user drags to select text, the native browser selection highlight vanishes — making it impossible to see what was selected when the ActionBubble appears. The user needs to see their highlighted text to confirm what they selected before clicking Go Deeper, Find Sources, or Simplify.

Output: Selection highlight stays visible while ActionBubble is shown.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/hooks/useTextSelection.ts
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/thread/ThreadView.tsx
@frontend/src/index.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Preserve browser selection across React re-render in useTextSelection + harden ActionBubble focus prevention</name>
  <files>frontend/src/hooks/useTextSelection.ts, frontend/src/components/branching/ActionBubble.tsx</files>
  <action>
The root cause: when `setBubble(...)` fires in `useTextSelection`, React re-renders ThreadView and its children. If React recreates DOM nodes that the browser Selection anchors reference, the selection is destroyed. Additionally, the ActionBubble div container may receive implicit focus on mount.

Fix in `useTextSelection.ts`:
1. Add a `savedRangeRef = useRef<Range | null>(null)` to store the selection range before triggering re-render.
2. In `handleMouseUp`, right before calling `setBubble(...)`, clone and save the range: `savedRangeRef.current = range.cloneRange()`.
3. Add a `useEffect` that runs when `bubble` changes from null to non-null. Inside it, use `requestAnimationFrame(() => { ... })` to restore the selection after the React re-render paint:
   ```
   const sel = window.getSelection();
   if (sel && savedRangeRef.current) {
     if (sel.isCollapsed || sel.rangeCount === 0) {
       sel.removeAllRanges();
       sel.addRange(savedRangeRef.current);
     }
   }
   ```
4. When `clearBubble` is called, also clear `savedRangeRef.current = null`.
5. Return `clearBubble` as a function that does both: `setBubble(null)` and `savedRangeRef.current = null`.

Fix in `ActionBubble.tsx`:
1. Add `tabIndex={-1}` and `onMouseDown={(e) => e.preventDefault()}` on the outer bubble `<div>` container itself (not just the buttons). This prevents the container from receiving focus when it appears or is clicked between buttons.
2. Add `style` property `userSelect: 'none'` on the outer bubble div to prevent accidental text selection within the bubble itself from interfering.
3. Keep all existing `onMouseDown={(e) => e.preventDefault()}` on individual buttons as-is.

Do NOT:
- Add `user-select: none` to the message content area (that would break selection entirely)
- Call `window.getSelection().removeAllRanges()` anywhere in these files
- Change the setTimeout(0) pattern in handleMouseUp (it is correct for letting browser finalize selection)
  </action>
  <verify>
    <automated>cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>
  - Dragging to select text in an AI response keeps the blue highlight visible after the ActionBubble appears
  - Clicking a bubble button (Go Deeper, Find Sources, Simplify) works with selection still highlighted
  - Dismissing the bubble (clicking away) clears both the bubble and the selection normally
  - All existing tests pass
  </done>
</task>

</tasks>

<verification>
1. Run `cd frontend && npx vitest run` — all tests pass
2. Manual: Open the app, select text in an AI response by dragging, confirm the blue highlight stays visible when the ActionBubble appears
3. Manual: Click Go Deeper with selection visible — child thread created correctly
4. Manual: Click away to dismiss — selection and bubble both clear
</verification>

<success_criteria>
- Browser text selection highlight remains visible while ActionBubble is displayed
- All ActionBubble actions work correctly with preserved selection
- No regressions in existing text selection or branching behavior
</success_criteria>

<output>
After completion, create `.planning/quick/22-fix-text-selection-disappearing-keep-hig/22-SUMMARY.md`
</output>
