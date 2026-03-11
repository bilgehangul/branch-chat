---
phase: quick-16
plan: 16
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/history/SessionHistory.tsx
  - frontend/src/hooks/useTextSelection.ts
autonomous: true
requirements: [SIDEBAR-HIERARCHY, SIDEBAR-TITLE-UPDATE, ACTIONBUBBLE-POSITION]

must_haves:
  truths:
    - "Child threads appear nested under their parent thread in the sidebar, with increasing indentation per depth level"
    - "When user sends first message in a new chat, the sidebar title updates to show first 35 chars of the question"
    - "ActionBubble appears near the selected text horizontally, not at the far right edge of the screen"
  artifacts:
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "Hierarchical thread tree rendering + live title from Zustand store"
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Centered bubble positioning relative to selection"
  key_links:
    - from: "frontend/src/components/history/SessionHistory.tsx"
      to: "Zustand store threads"
      via: "threads prop from AppShell"
      pattern: "threads\\[.*\\]\\.title"
---

<objective>
Fix three UI bugs: (1) sidebar threads are flat instead of hierarchical, (2) chat name in sidebar does not update after first prompt, (3) ActionBubble appears too far right.

Purpose: Improve sidebar usability and ActionBubble positioning.
Output: Updated SessionHistory.tsx and useTextSelection.ts.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/history/SessionHistory.tsx
@frontend/src/components/layout/AppShell.tsx
@frontend/src/hooks/useTextSelection.ts
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/App.tsx
@frontend/src/store/sessionStore.ts

<interfaces>
From frontend/src/types/index.ts:
```typescript
export interface Thread {
  id: string;
  depth: 0 | 1 | 2 | 3 | 4;
  parentThreadId: string | null;
  anchorText: string | null;
  parentMessageId: string | null;
  title: string;
  accentColor: string;
  messageIds: string[];
  childThreadIds: string[];
  scrollPosition: number;
}
```

From frontend/src/api/sessions.ts:
```typescript
export interface SessionListItem {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  title: string;
}
```

From frontend/src/hooks/useTextSelection.ts:
```typescript
export interface SelectionState {
  anchorText: string;
  paragraphId: string;
  messageId: string;
  top: number;    // viewport-relative from getBoundingClientRect().top
  left: number;   // viewport-relative from getBoundingClientRect().right  <-- BUG: uses rect.right
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix sidebar hierarchy and live title update</name>
  <files>frontend/src/components/history/SessionHistory.tsx</files>
  <action>
Two bugs in SessionHistory.tsx:

**Bug 1 — Flat thread list instead of hierarchy:**
Currently collects all depth > 0 threads into a flat `childThreads` array. Fix by building a proper tree:
- Create a helper function `buildThreadTree(threads: Record<string, Thread>)` that returns root-level threads (depth === 0) each with nested children resolved via `parentThreadId`.
- Create a recursive `ThreadNode` component that renders a thread button and recursively renders its children (found via `thread.childThreadIds` mapped through the threads record).
- Indent children using `pl-{N}` where N increases with depth (e.g., depth 1 = pl-4, depth 2 = pl-6, depth 3 = pl-8).
- Prefix child threads with a "corner" indicator like `└` instead of the current `-`.
- Keep the existing click handler `onNavigateThread?.(thread.id)`.

**Bug 2 — Sidebar title not updating after first prompt:**
The `sessions` prop comes from `App.tsx` local state (`sessionsList`) which is fetched once from the backend and never updated when Zustand's `setThreadTitle` fires. Fix:
- For the ACTIVE session (where `isActive === true`), find the root thread (depth === 0) from the `threads` prop (Zustand store data).
- If a root thread exists and has a non-empty, non-default title (not "New chat"), display its `title` instead of `session.title`.
- This ensures the sidebar reflects the live Zustand title set by `useStreamingChat.ts` after the first user message.

Keep existing styling patterns (Tailwind classes, dark mode variants). Keep the existing `nav` and `ul` structure.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>Child threads render nested under their parent with visual indentation; active session shows live Zustand root thread title instead of stale session.title; TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Fix ActionBubble horizontal positioning</name>
  <files>frontend/src/hooks/useTextSelection.ts</files>
  <action>
The bubble currently positions at `left: rect.right` (the right edge of the selection bounding rectangle). This pushes the ActionBubble to the far right of the screen when selections are wide.

Fix the `left` calculation in the `handleMouseUp` function:
- Change from `left: rect.right` to `left: rect.left + rect.width / 2` to center the bubble horizontally above the selection.
- This places the bubble's left edge at the horizontal center of the selection. The ActionBubble component already renders at `left: bubble.left` with no X transform, so the bubble will appear roughly centered over the selection.
- Also add viewport clamping: ensure `left` does not exceed `window.innerWidth - 200` (approximate bubble width) so it does not overflow off-screen to the right. And ensure `left` is at least 8px so it does not go off-screen to the left.

The final line should be:
```typescript
const rawLeft = rect.left + rect.width / 2;
const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - 200));
```
Then use `left: clampedLeft` in the setBubble call.

Do NOT modify ActionBubble.tsx — only change the position calculation in useTextSelection.ts.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>ActionBubble appears horizontally centered over the text selection, clamped within viewport bounds; no TypeScript errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit --project frontend/tsconfig.app.json` passes
- `npx vitest run --project frontend` passes (if configured)
- Manual: Open app, create a new chat, send a message — sidebar title updates from "New chat" to first 35 chars
- Manual: Create a child thread via Go Deeper — child appears nested under parent in sidebar
- Manual: Select text in an AI response — ActionBubble appears near the selection center, not at the far right
</verification>

<success_criteria>
1. Sidebar shows hierarchical thread nesting with visual indentation per depth level
2. Active session's sidebar title reflects the live Zustand root thread title after first message
3. ActionBubble is horizontally centered over the selected text, clamped within viewport
4. TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/16-fix-sidebar-hierarchy-chat-name-update-a/16-SUMMARY.md`
</output>
