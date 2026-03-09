---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/layout/AncestorPeekPanel.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Clicking Delete thread shows a confirmation dialog before any deletion occurs"
    - "Clicking Cancel in the dialog leaves the thread intact and closes the dialog"
    - "Clicking Confirm in the dialog deletes the thread"
  artifacts:
    - path: frontend/src/components/branching/GutterColumn.tsx
      provides: "ThreadContextMenu with confirmation gate"
    - path: frontend/src/components/layout/AncestorPeekPanel.tsx
      provides: "ContextMenu with confirmation gate"
  key_links:
    - from: "Delete thread button"
      to: "onDelete(threadId)"
      via: "confirmation dialog Confirm button"
      pattern: "onClick.*onDelete"
---

<objective>
Add a confirmation dialog to both Delete thread context menus before calling the delete handler.

Purpose: Prevent accidental deletion of threads — a destructive, unrecoverable action.
Output: Both ThreadContextMenu (GutterColumn.tsx) and ContextMenu (AncestorPeekPanel.tsx) show an inline confirmation step before invoking onDelete.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add confirmation state to GutterColumn ThreadContextMenu</name>
  <files>frontend/src/components/branching/GutterColumn.tsx</files>
  <action>
In `ThreadContextMenu` (the local component inside GutterColumn.tsx), add a `const [confirming, setConfirming] = useState(false)` state.

Change the Delete thread button behavior:
- When `confirming` is false: clicking the button sets `setConfirming(true)` — does NOT call onDelete yet.
- When `confirming` is true: replace the single Delete button with two inline elements:
  1. A short text label: `"Are you sure?"` (text-xs text-slate-500, px-3 pt-1.5 pb-0.5)
  2. Two side-by-side buttons in a flex row (px-3 pb-1.5 gap-2):
     - "Confirm" button: text-red-600 hover:bg-red-50, onClick calls `onDelete(threadId); onClose();`
     - "Cancel" button: text-slate-500 hover:bg-slate-100, onClick calls `setConfirming(false)`

Import `useState` is already present in the file — no new import needed.

Do not change any other part of the component.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>ThreadContextMenu renders "Are you sure?" + Confirm/Cancel on first Delete click; Confirm triggers onDelete; Cancel returns to normal menu.</done>
</task>

<task type="auto">
  <name>Task 2: Add confirmation state to AncestorPeekPanel ContextMenu</name>
  <files>frontend/src/components/layout/AncestorPeekPanel.tsx</files>
  <action>
In the local `ContextMenu` component inside AncestorPeekPanel.tsx, apply the identical confirmation pattern:

Add `const [confirming, setConfirming] = useState(false)` (import useState is already used in this file).

Change the Delete thread button:
- Default state: clicking sets `setConfirming(true)`, does NOT call onDelete.
- Confirming state: show `"Are you sure?"` label then two buttons (Confirm / Cancel) in the same style as Task 1.

Do not change any other part of the component.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>AncestorPeekPanel ContextMenu shows confirmation step before deleting; Cancel reverts to normal menu state.</done>
</task>

</tasks>

<verification>
Run TypeScript check: `cd frontend && npx tsc --noEmit` — zero errors.
Manual smoke test:
1. Right-click a gutter pill → click "Delete thread" → confirm "Are you sure?" appears.
2. Click Cancel → menu returns to normal Delete/Summarize/Compact state.
3. Click Delete again → click Confirm → thread is deleted.
4. Right-click an ancestor peek panel → same flow works.
</verification>

<success_criteria>
- Both context menus require a two-click confirmation before invoking onDelete
- Cancel returns the menu to its original single-click Delete state
- Zero TypeScript errors
- No changes to onDelete call sites or store logic
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-delete-thread-confirmation-dialog/1-SUMMARY.md`
</output>
