---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/ui/ConfirmDialog.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/layout/AncestorPeekPanel.tsx
  - frontend/src/store/sessionStore.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Right-clicking a thread pill or ancestor panel and choosing Delete opens a centered modal overlay, not an inline confirmation"
    - "The modal can be dismissed with Cancel (no deletion) or confirmed with Delete (thread deleted)"
    - "Right-clicking Summarize or Compact on any ancestor panel calls a real store action for that thread ID"
    - "All three actions (Delete, Summarize, Compact) work on threads multiple levels above the active thread"
  artifacts:
    - path: frontend/src/components/ui/ConfirmDialog.tsx
      provides: "Reusable modal overlay with title, body, Cancel and Confirm buttons"
      exports: ["ConfirmDialog"]
    - path: frontend/src/store/sessionStore.ts
      provides: "summarizeThread and compactThread actions"
      contains: "summarizeThread"
  key_links:
    - from: "ThreadContextMenu / ContextMenu Delete button"
      to: "ConfirmDialog"
      via: "useState confirmingThreadId"
      pattern: "ConfirmDialog.*onConfirm"
    - from: "Summarize / Compact buttons"
      to: "sessionStore.summarizeThread / compactThread"
      via: "prop callbacks"
      pattern: "onSummarize|onCompact"
---

<objective>
Replace inline "Are you sure?" confirmation with a proper centered modal overlay for Delete, and wire Summarize/Compact context menu buttons to real store actions that work on any ancestor thread.

Purpose: The existing inline confirmation is barely visible inside the dropdown menu. A modal overlay is more intentional and accessible. Summarize/Compact stubs (`alert('coming soon')`) need to be real actions callable on any thread ID so ancestor panel right-clicks are functional.
Output: ConfirmDialog modal component, store stubs for summarize/compact, both context menus updated.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/components/layout/AncestorPeekPanel.tsx
@frontend/src/store/sessionStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ConfirmDialog modal and update both context menus to use it</name>
  <files>frontend/src/components/ui/ConfirmDialog.tsx, frontend/src/components/branching/GutterColumn.tsx, frontend/src/components/layout/AncestorPeekPanel.tsx</files>
  <action>
**Step A — Create `frontend/src/components/ui/ConfirmDialog.tsx`:**

A minimal portal-based modal overlay. Use `createPortal` (from `react-dom`) to render outside the menu stacking context so it appears centered on screen regardless of z-index nesting.

```tsx
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-80 max-w-[90vw] space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {body && <p className="text-xs text-slate-500">{body}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Step B — Update `GutterColumn.tsx` `ThreadContextMenu`:**

Remove the `confirming` state and inline "Are you sure?" flow entirely. Replace with a `pendingDelete` boolean state that controls whether the ConfirmDialog renders.

Import `ConfirmDialog` at top of file. Update `ThreadContextMenu`:

```tsx
import { ConfirmDialog } from '../ui/ConfirmDialog';

function ThreadContextMenu({ x, y, threadId, onDelete, onClose, onSummarize, onCompact }: ContextMenuProps) {
  const [pendingDelete, setPendingDelete] = useState(false);
  // ...
```

The menu body becomes:
- "Delete thread" button: `onClick={() => setPendingDelete(true)}` — does NOT close the menu
- "Summarize" button: calls `onSummarize(threadId); onClose();`
- "Compact" button: calls `onCompact(threadId); onClose();`

After the menu `</div>`, render:
```tsx
{pendingDelete && (
  <ConfirmDialog
    title="Delete thread?"
    body="This thread and all its messages will be removed. This cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => { onDelete(threadId); onClose(); }}
    onCancel={() => setPendingDelete(false)}
  />
)}
```

Update `ContextMenuProps` interface to add:
```ts
onSummarize: (threadId: string) => void;
onCompact: (threadId: string) => void;
```

Update the `ThreadContextMenu` call inside `LeadPill` to pass `onSummarize` and `onCompact` as props (bubble from `LeadPillProps` → `GutterColumnProps`).

**Step C — Update `AncestorPeekPanel.tsx` `ContextMenu`:**

Apply the same pattern: remove `confirming` state, add `pendingDelete` boolean, render `ConfirmDialog` portal when true.

Update the `ContextMenu` local interface to add `onSummarize` and `onCompact` props. Update `AncestorPeekPanelProps` to add `onSummarize?: (threadId: string) => void` and `onCompact?: (threadId: string) => void`. Pass them through from parent to `ContextMenu`.

The Summarize and Compact buttons call `onSummarize?.(threadId); onClose();` and `onCompact?.(threadId); onClose();` respectively.
  </action>
  <verify>
    <automated>cd "/c/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>ConfirmDialog renders as a centered modal overlay. ThreadContextMenu and ContextMenu no longer have inline "Are you sure?" — Delete opens modal. Summarize/Compact buttons call their respective callback props. Zero TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add summarizeThread / compactThread store stubs and wire AppShell + ThreadView</name>
  <files>frontend/src/store/sessionStore.ts, frontend/src/components/layout/AppShell.tsx, frontend/src/components/thread/ThreadView.tsx</files>
  <action>
**Step A — Add store actions in `sessionStore.ts`:**

After the `deleteThread` action, add two stub actions:

```ts
summarizeThread: (threadId: string) => {
  // TODO: Phase 5 — call backend /api/summarize endpoint, replace messages with summary
  // Stub: mark thread with a flag or log — no-op for now
  console.log('[summarizeThread] threadId:', threadId);
},
compactThread: (threadId: string) => {
  // TODO: Phase 5 — call backend /api/compact endpoint, condense older messages
  console.log('[compactThread] threadId:', threadId);
},
```

Declare them in the `SessionState` interface:
```ts
summarizeThread: (threadId: string) => void;
compactThread: (threadId: string) => void;
```

**Step B — Wire in `AppShell.tsx`:**

Add selectors:
```ts
const summarizeThread = useSessionStore(s => s.summarizeThread);
const compactThread = useSessionStore(s => s.compactThread);
```

Pass to each `AncestorPeekPanel`:
```tsx
onSummarize={summarizeThread}
onCompact={compactThread}
```

**Step C — Wire in `ThreadView.tsx`:**

The `GutterColumn` receives `onDeleteThread` today. Add `onSummarize` and `onCompact` props to `GutterColumnProps` and `GutterColumn` component signature.

In `ThreadView.tsx`:
```ts
const summarizeThread = useSessionStore(s => s.summarizeThread);
const compactThread = useSessionStore(s => s.compactThread);
```

Pass to `GutterColumn`:
```tsx
onSummarize={summarizeThread}
onCompact={compactThread}
```

GutterColumn threads these down to `LeadPill` → `ThreadContextMenu`.
  </action>
  <verify>
    <automated>cd "/c/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>summarizeThread and compactThread exist on the store. AppShell passes them to AncestorPeekPanel. ThreadView passes them to GutterColumn. Right-clicking Summarize or Compact on any ancestor or gutter pill calls the store action (logs to console). Zero TypeScript errors.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    - ConfirmDialog modal overlay component (centered on screen, backdrop click to cancel)
    - Both context menus (gutter pill right-click and ancestor panel right-click) now open the modal on Delete
    - Summarize and Compact wired to store stubs (console.log, no alert())
    - Works on threads at any ancestry depth
  </what-built>
  <how-to-verify>
    Start the app: `cd frontend && npm run dev` (or if already running, reload).

    1. Open a session with at least 2 levels of child threads (root → child → grandchild).
    2. Navigate to the grandchild thread so two AncestorPeekPanel columns appear on the left.
    3. Right-click the leftmost (oldest ancestor) panel → click "Delete thread".
       Expected: A centered modal appears over the full screen with "Delete thread?" title and a backdrop.
    4. Click Cancel → modal closes, thread still exists.
    5. Right-click the same panel → Delete → click "Delete" in modal → thread is deleted.
    6. Right-click a gutter pill on the active thread → click "Delete thread" → same modal appears.
    7. Right-click an ancestor panel → click "Summarize" → no alert(), check browser console for `[summarizeThread]` log.
    8. Right-click an ancestor panel → click "Compact" → console shows `[compactThread]` log.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
TypeScript check: `cd frontend && npx tsc --noEmit` — zero errors.
Manual verification covers: modal rendering, Cancel/Confirm flows, ancestry depth, Summarize/Compact console output.
</verification>

<success_criteria>
- Delete confirmation appears as a centered modal overlay (not inline in dropdown)
- Clicking outside the modal (backdrop) dismisses it without deleting
- Summarize and Compact buttons call real store actions for the targeted threadId (any ancestor level)
- No `alert()` calls remain for these actions
- Zero TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/2-the-delete-thread-should-be-like-a-pop-u/2-SUMMARY.md`
</output>
