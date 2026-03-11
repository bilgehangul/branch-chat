---
phase: quick-18
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/sessions.ts
  - frontend/src/api/sessions.ts
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/hooks/useStreamingChat.ts
  - frontend/src/App.tsx
autonomous: true
requirements: [ROOT-MENU, ROOT-TITLE]
must_haves:
  truths:
    - "3-dot menu appears on session-level (root chat) entries in the sidebar on hover"
    - "Clicking Edit title on root chat allows inline rename that persists to backend"
    - "Clicking Delete on root chat deletes the session and all its threads/messages"
    - "When user sends first message in a new chat, the sidebar title updates from Root to first 35 chars"
    - "Title update persists to backend and survives page refresh"
  artifacts:
    - path: "backend/src/routes/sessions.ts"
      provides: "DELETE /api/sessions/:id endpoint"
    - path: "frontend/src/components/layout/AppShell.tsx"
      provides: "onRenameSession and onDeleteSession callbacks wired to SessionHistory"
    - path: "frontend/src/hooks/useStreamingChat.ts"
      provides: "Backend title persistence on first message"
  key_links:
    - from: "frontend/src/components/layout/AppShell.tsx"
      to: "frontend/src/components/history/SessionHistory.tsx"
      via: "onRenameSession and onDeleteSession props"
      pattern: "onRenameSession=|onDeleteSession="
    - from: "frontend/src/hooks/useStreamingChat.ts"
      to: "frontend/src/api/sessions.ts"
      via: "updateThreadOnBackend call after setThreadTitle"
      pattern: "updateThreadOnBackend"
---

<objective>
Fix two bugs with the root/session-level chat entry in the sidebar:
1. The 3-dot menu (edit title, delete) does not appear on session entries because onRenameSession/onDeleteSession are not wired up.
2. The root chat title stays as "Root" because setThreadTitle in useStreamingChat only updates Zustand, never persists to the backend.

Purpose: Root chat entries should behave identically to child thread entries — hoverable 3-dot menu with rename/delete, and auto-title on first message.
Output: Working 3-dot menu on all sidebar entries, title auto-update that persists.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/history/SessionHistory.tsx
@frontend/src/components/layout/AppShell.tsx
@frontend/src/hooks/useStreamingChat.ts
@frontend/src/store/sessionStore.ts
@frontend/src/api/sessions.ts
@frontend/src/App.tsx
@backend/src/routes/sessions.ts

<interfaces>
<!-- SessionHistory already has full 3-dot menu infrastructure for sessions (lines 404-434).
     It renders ThreeDotButton + DropdownMenu for session entries ONLY when
     (onRenameSession || onDeleteSession) is truthy. Currently AppShell passes neither. -->

From frontend/src/api/sessions.ts:
```typescript
export async function updateThreadOnBackend(
  threadId: string,
  patch: { title?: string; scrollPosition?: number },
  getToken: () => Promise<string | null>
): Promise<void>;
```

From frontend/src/components/history/SessionHistory.tsx (already accepts these props):
```typescript
interface SessionHistoryProps {
  onRenameSession?: (sessionId: string, title: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}
```

From backend/src/routes/sessions.ts line 27:
```typescript
// Session list title comes from root thread: rootThread?.title ?? 'Untitled'
// So renaming the root thread title IS renaming the session title.
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add backend DELETE /api/sessions/:id and wire frontend session rename/delete</name>
  <files>backend/src/routes/sessions.ts, frontend/src/api/sessions.ts, frontend/src/components/layout/AppShell.tsx, frontend/src/App.tsx</files>
  <action>
**Backend — backend/src/routes/sessions.ts:**
Add a DELETE /api/sessions/:id route to the sessionsRouter (after the GET /:id route, before the thread routes). Implementation:
1. Verify ownership (find session by id, check userId matches req.verifiedUser.sub)
2. Delete all threads in the session: `await Thread.deleteMany({ sessionId })`
3. Delete all messages in the session: `await Message.deleteMany({ sessionId })`
4. Delete the session itself: `await Session.findByIdAndDelete(sessionId)`
5. Return `{ data: { deleted: true }, error: null }`

**Frontend — frontend/src/api/sessions.ts:**
Add a `deleteSessionFromDB` function following the existing pattern (fire-and-forget, try/catch):
```typescript
export async function deleteSessionFromDB(
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }, getToken);
  } catch {
    // fire-and-forget
  }
}
```

**Frontend — frontend/src/components/layout/AppShell.tsx:**
1. Import `updateThreadOnBackend` and `deleteSessionFromDB` from `../../api/sessions`.
2. Create `handleRenameSession` callback: Find the root thread (depth 0) in `threads`, call `useSessionStore.getState().setThreadTitle(rootThread.id, newTitle)` to update Zustand, then call `updateThreadOnBackend(rootThread.id, { title: newTitle }, getToken)` to persist. This is sufficient because the session list title is derived from the root thread title on the backend.
3. Create `handleDeleteSession` callback: Call `deleteSessionFromDB(sessionId, getToken)`, then remove the session from the sessions list by calling a new `onDeleteSessionFromList` callback passed from App.tsx, and if the deleted session is the current one, call `onNewChat()` to create a fresh session.
4. Pass `onRenameSession={handleRenameSession}` and `onDeleteSession={handleDeleteSession}` to the SessionHistory component.
5. Remove the TODO comment on lines 58-59.

**Frontend — frontend/src/App.tsx:**
1. Add `handleRemoveSessionFromList` function that filters `sessionsList` by id: `setSessionsList(prev => prev.filter(s => s.id !== sessionId))`.
2. Pass this as a new prop `onRemoveSession` to AppShell (add to AppShellProps interface).
3. In AppShell, use `onRemoveSession` inside `handleDeleteSession` to remove the deleted session from the list.

Note: For rename, the session list title for the active session already reads from Zustand root thread (lines 350-356 in SessionHistory — `liveTitle` logic). For inactive sessions, rename will persist to backend and show on next `fetchSessions` call. This is acceptable UX.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit -p frontend/tsconfig.app.json && npx tsc --noEmit -p backend/tsconfig.json</automated>
  </verify>
  <done>3-dot menu appears on session entries with working Edit title (inline rename persisted to backend) and Delete (session + all data removed). Session list updates after delete.</done>
</task>

<task type="auto">
  <name>Task 2: Persist root thread title to backend on first message auto-title</name>
  <files>frontend/src/hooks/useStreamingChat.ts</files>
  <action>
In `useStreamingChat.ts`, after the existing `setThreadTitle` call on line 67, add a backend persistence call:

```typescript
if (isFirstMessage) {
  const title = text.slice(0, 35);
  store.setThreadTitle(activeThreadId, title);
  // Persist title to backend so it shows in session list on reload
  updateThreadOnBackend(activeThreadId, { title }, getToken);
}
```

Add the import at the top of the file:
```typescript
import { updateThreadOnBackend } from '../api/sessions';
```

The `getToken` parameter is already available — it is the parameter of the `useStreamingChat(getToken)` function.

This ensures:
1. Zustand updates immediately (already working) so the sidebar shows live title via `liveTitle` logic in SessionHistory.
2. Backend persists the title so on page refresh / next fetchSessions, the session list returns the correct title instead of "Root".
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit -p frontend/tsconfig.app.json</automated>
  </verify>
  <done>First message in a new chat auto-titles the root thread to first 35 chars, persisted to backend. On page refresh, session list shows the correct title instead of "Root".</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors for both frontend and backend.
2. Hover over a session entry in the sidebar — 3-dot menu appears.
3. Click Edit title — inline rename input appears, save persists.
4. Click Delete — session is removed from sidebar and backend.
5. Start a new chat, send a message — sidebar title updates from "Root" to first 35 chars of the message.
6. Refresh the page — the title persists (not reverted to "Root").
</verification>

<success_criteria>
- 3-dot menu visible on ALL sidebar chat entries (sessions and child threads)
- Session rename updates root thread title in Zustand + backend
- Session delete removes session + all threads/messages from backend
- First message auto-titles root thread and persists to backend
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/18-fix-root-chat-3-dot-menu-missing-title-s/18-SUMMARY.md`
</output>
