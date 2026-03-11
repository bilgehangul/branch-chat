---
phase: quick-17
plan: 17
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/components/history/SessionHistory.tsx
  - frontend/src/hooks/useResizableSidebar.ts
autonomous: true
must_haves:
  truths:
    - "User can drag the right edge of the sidebar to resize it between 200px and 500px"
    - "Sidebar width persists across page refreshes via localStorage"
    - "Each chat entry shows a 3-dot menu on hover with Edit title and Delete options"
    - "Edit title enables inline rename that updates the thread title in Zustand"
    - "Delete shows a confirmation and removes the thread"
    - "Child threads display indented under their parent with expand/collapse toggles"
  artifacts:
    - path: "frontend/src/hooks/useResizableSidebar.ts"
      provides: "Resize drag logic + localStorage persistence"
    - path: "frontend/src/components/layout/AppShell.tsx"
      provides: "Resizable sidebar with drag handle"
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "3-dot menu per chat + hierarchical tree with collapse"
  key_links:
    - from: "useResizableSidebar.ts"
      to: "AppShell.tsx"
      via: "hook return value: width, onMouseDown handler, isResizing"
    - from: "SessionHistory.tsx"
      to: "sessionStore.ts"
      via: "setThreadTitle and deleteThread actions"
---

<objective>
Overhaul the Chats sidebar with three improvements: (1) draggable resize handle on the right edge with localStorage persistence, (2) per-chat 3-dot hover menu with inline rename and delete, (3) proper hierarchical thread tree with expand/collapse toggles.

Purpose: Improve sidebar UX - resizable for user preference, per-chat actions for management, and proper tree display for thread hierarchy.
Output: Updated AppShell sidebar + SessionHistory with all three features.
</objective>

<context>
@frontend/src/components/layout/AppShell.tsx
@frontend/src/components/history/SessionHistory.tsx
@frontend/src/store/sessionStore.ts
@frontend/src/types/index.ts
</context>

<interfaces>
From frontend/src/types/index.ts:
```typescript
export interface Thread {
  id: string;
  depth: 0 | 1 | 2 | 3 | 4;
  parentThreadId: string | null;
  title: string;
  childThreadIds: string[];
  // ...other fields
}
```

From frontend/src/store/sessionStore.ts:
```typescript
setThreadTitle: (threadId: string, title: string) => void;
deleteThread: (threadId: string) => void;
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create useResizableSidebar hook + wire into AppShell</name>
  <files>frontend/src/hooks/useResizableSidebar.ts, frontend/src/components/layout/AppShell.tsx</files>
  <action>
Create `frontend/src/hooks/useResizableSidebar.ts`:
- Custom hook that manages sidebar width state, initialized from `localStorage.getItem('sidebar-width')` or default 192 (w-48).
- Returns `{ width, onMouseDown, isResizing }`.
- `onMouseDown` attaches `mousemove` and `mouseup` listeners to `document` (cleanup on mouseup).
- On mousemove, clamp `e.clientX` between 200 and 500, update width state.
- On mouseup, persist final width to `localStorage.setItem('sidebar-width', ...)` and remove listeners.
- Set `isResizing` boolean while dragging (for cursor style).
- Also handle `touchstart`/`touchmove`/`touchend` for mobile.

Update `frontend/src/components/layout/AppShell.tsx`:
- Import and call `useResizableSidebar()`.
- Replace the `<aside>` fixed `w-48` class with inline `style={{ width }}` from the hook.
- Keep `flex-shrink-0`, `min-w-0` on the aside.
- Add a drag handle `<div>` as the last child of the aside (or as a sibling right after), styled as a 4px-wide vertical strip on the right edge of the sidebar:
  - `absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400/50 transition-colors` (make aside `relative`).
  - When `isResizing`, add `bg-blue-400/60` to the handle for visual feedback.
  - Attach `onMouseDown` from the hook to this handle.
- When `isResizing` is true, add `select-none cursor-col-resize` to the root flex container to prevent text selection and ensure cursor stays consistent during drag.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Sidebar width is draggable between 200-500px via the right-edge handle. Width persists in localStorage across refreshes. Drag handle highlights on hover and during drag.</done>
</task>

<task type="auto">
  <name>Task 2: Add 3-dot menu per chat + fix hierarchical thread tree with collapse</name>
  <files>frontend/src/components/history/SessionHistory.tsx</files>
  <action>
Rewrite `frontend/src/components/history/SessionHistory.tsx` with these changes:

**3-dot menu per chat entry:**
- Each session `<li>` and each `ThreadNode` shows a "..." button on hover (use `group` + `opacity-0 group-hover:opacity-100` pattern in Tailwind).
- The "..." button is positioned absolute right within the row.
- Clicking "..." opens a small dropdown menu (absolute positioned, z-10, bg-white dark:bg-zinc-800, shadow, rounded) with two items:
  1. "Edit title" -- sets an `editingId` state to that thread/session ID. The title text becomes an `<input>` (controlled, initialized with current title). On Enter or blur, call `onRenameSession?.(sessionId, newTitle)` for sessions or directly call the Zustand `setThreadTitle` for threads. On Escape, cancel edit.
  2. "Delete" -- shows a confirmation: replace the menu with "Delete?" + "Yes" / "No" buttons inline. On "Yes", call `onDeleteSession?.(sessionId)` for sessions, or the Zustand `deleteThread` for child threads.
- Click outside the menu closes it (use a useEffect with document click listener, or a transparent backdrop div).
- Add new optional props: `onRenameSession?: (sessionId: string, title: string) => void` and `onDeleteSession?: (sessionId: string) => void`. The executor should wire these through AppShell from the parent. For now, just accept them as optional props -- if not provided, rename/delete for sessions (as opposed to threads) should be no-ops or hidden.

**Hierarchical thread tree with expand/collapse:**
- `ThreadNode` component changes:
  - Add local `expanded` state, defaulting to `true`.
  - If thread has `childThreadIds.length > 0`, render a toggle button (small triangle: right-pointing when collapsed, down-pointing when expanded) before the thread title.
  - When collapsed, do NOT render child `ThreadNode` components.
  - Use `\u25B6` (right triangle) for collapsed, `\u25BC` (down triangle) for expanded.
  - Clicking the toggle toggles `expanded` state only (does NOT navigate to thread).
  - Clicking the thread title still navigates via `onNavigateThread`.
- Fix the indentation: use inline `style={{ paddingLeft: ${thread.depth * 16}px }}` instead of dynamic Tailwind `pl-` classes (which require safelist and are unreliable with computed values).
- Remove the `\u2514` (corner bracket) prefix, replaced by the expand/collapse toggle or a simple dash for leaf nodes.
- Pass `activeThreadId` prop to `SessionHistory` and down to `ThreadNode` to highlight the currently active thread in the tree (bold or bg highlight).

**Wire activeThreadId:**
- Add `activeThreadId?: string | null` to `SessionHistoryProps`.
- In `ThreadNode`, if `thread.id === activeThreadId`, apply `font-semibold bg-stone-200/50 dark:bg-zinc-700/50` classes.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Each chat entry shows a 3-dot menu on hover with "Edit title" (inline rename) and "Delete" (with confirmation). Thread tree shows proper hierarchical indentation with expand/collapse toggles. Active thread is highlighted in the tree.</done>
</task>

<task type="auto">
  <name>Task 3: Wire activeThreadId and session action props through AppShell</name>
  <files>frontend/src/components/layout/AppShell.tsx</files>
  <action>
In `AppShell.tsx`, pass `activeThreadId={activeThreadId}` to the `<SessionHistory>` component.

The `activeThreadId` is already read from Zustand on line 27 of AppShell.tsx.

Also update the SessionHistory call to pass `onRenameSession` and `onDeleteSession` if backend session APIs support it. Since the sessions API does not currently have delete/rename endpoints, these can be omitted for now (the 3-dot menu will only work for in-session threads which use Zustand directly). Add a TODO comment noting that session-level rename/delete requires backend API support.

Verify the full component tree compiles and the sidebar renders correctly.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>activeThreadId flows to SessionHistory for tree highlighting. AppShell compiles cleanly with all new props wired.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx tsc --noEmit` -- no type errors
2. `cd frontend && npx vite build` -- builds successfully
3. Manual: sidebar drag handle visible on right edge, dragging resizes between 200-500px
4. Manual: hover over chat entry shows "..." menu, Edit title and Delete work
5. Manual: child threads appear indented with expand/collapse toggles
6. Manual: refresh page, sidebar width preserved
</verification>

<success_criteria>
- Sidebar resizable by dragging right edge, width clamped 200-500px, persisted in localStorage
- 3-dot hover menu on each chat with working inline rename and delete confirmation
- Thread tree displays hierarchically with expand/collapse toggles on parent threads
- Active thread highlighted in the sidebar tree
- TypeScript compiles with no errors, Vite build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/17-resizable-sidebar-with-drag-handle-3-dot/17-SUMMARY.md`
</output>
