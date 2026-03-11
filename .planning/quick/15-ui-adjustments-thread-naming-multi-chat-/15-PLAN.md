---
phase: quick-15
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useStreamingChat.ts
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/components/history/SessionHistory.tsx
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/App.tsx
autonomous: true
requirements: [UI-TITLE, UI-MULTI-CHAT, UI-FOLDER-HISTORY, UI-CHILD-PROXIMITY]

must_haves:
  truths:
    - "Parent thread title is the first 35 characters of the first user question"
    - "User can start a new chat via a button in the sidebar"
    - "History sidebar is titled 'Chats' and shows child threads under each session like a folder tree"
    - "Child thread pills are closer to the message output (reduced right padding)"
  artifacts:
    - path: "frontend/src/hooks/useStreamingChat.ts"
      provides: "35-char title logic"
      contains: "text.slice(0, 35)"
    - path: "frontend/src/components/layout/AppShell.tsx"
      provides: "Renamed sidebar header + new chat button"
      contains: "Chats"
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "Folder-style thread tree under each session"
    - path: "frontend/src/components/thread/ThreadView.tsx"
      provides: "Reduced child thread padding"
  key_links:
    - from: "AppShell.tsx"
      to: "App.tsx"
      via: "onNewChat callback prop"
      pattern: "onNewChat"
---

<objective>
Four UI adjustments in a single plan: fix thread naming to use first 35 characters, add multi-chat support with a "Start a new chat" button, restructure the history sidebar as folder-style "Chats", and reduce the distance between child thread pills and message output.

Purpose: Improve usability — thread titles are more meaningful, users can create multiple chats, history is organized hierarchically, and child thread navigation is tighter.
Output: Updated sidebar, thread naming, and layout spacing.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/hooks/useStreamingChat.ts
@frontend/src/components/layout/AppShell.tsx
@frontend/src/components/history/SessionHistory.tsx
@frontend/src/components/thread/ThreadView.tsx
@frontend/src/App.tsx
@frontend/src/store/sessionStore.ts
@frontend/src/api/sessions.ts
@frontend/src/store/selectors.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From frontend/src/api/sessions.ts:
```typescript
export interface SessionListItem {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  title: string;
}
export function createSessionOnBackend(
  payload: { sessionId: string; rootThreadId: string; accentColor?: string },
  getToken: () => Promise<string | null>
): Promise<{ sessionId: string; rootThreadId: string } | null>;
```

From frontend/src/store/sessionStore.ts:
```typescript
createSession: (userId: string) => void;
clearSession: () => void;
// Session creates a root thread with title 'Root'
```

From frontend/src/App.tsx:
```typescript
// AppShell receives: onSignOut, user, sessions, currentSessionId, onLoadSession
// Sessions list is fetched via fetchSessions(getToken) on sign-in
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Thread title fix + child thread proximity</name>
  <files>frontend/src/hooks/useStreamingChat.ts, frontend/src/components/thread/ThreadView.tsx</files>
  <action>
1. In `useStreamingChat.ts` line 66, change the title derivation from:
   ```
   const title = text.split(' ').slice(0, 6).join(' ');
   ```
   to:
   ```
   const title = text.slice(0, 35);
   ```
   This applies to the auto-title set on first message in a thread.

2. Also in `ThreadView.tsx` line 223, the Go Deeper handler has the same 6-word pattern:
   ```
   const title = anchorText.split(' ').slice(0, 6).join(' ');
   ```
   Change to:
   ```
   const title = anchorText.slice(0, 35);
   ```

3. In `ThreadView.tsx`, reduce the right padding that pushes content away from child thread pills. Change line 347:
   ```
   ${hasChildThreads ? 'pr-[120px] sm:pr-[200px]' : ''}
   ```
   to:
   ```
   ${hasChildThreads ? 'pr-[80px] sm:pr-[140px]' : ''}
   ```
   This brings the child thread pills ~40-60px closer to the message output.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && grep -n "text.slice(0, 35)" frontend/src/hooks/useStreamingChat.ts && grep -n "anchorText.slice(0, 35)" frontend/src/components/thread/ThreadView.tsx && grep -n "pr-\[80px\]" frontend/src/components/thread/ThreadView.tsx</automated>
  </verify>
  <done>Thread titles use first 35 characters instead of first 6 words. Child thread pills are closer to message content with reduced padding.</done>
</task>

<task type="auto">
  <name>Task 2: Multi-chat button + folder-style "Chats" sidebar</name>
  <files>frontend/src/components/layout/AppShell.tsx, frontend/src/components/history/SessionHistory.tsx, frontend/src/App.tsx</files>
  <action>
1. **App.tsx** — Add `handleNewChat` function and pass to AppShell:
   - Create `handleNewChat` async function that:
     a. Calls `clearSession()` then `createSession(user.sub)`.
     b. After a setTimeout(0) tick, reads the new session+rootThread from store and calls `createSessionOnBackend(...)`.
     c. Refreshes the sessions list by calling `fetchSessions(getToken)` and updating `setSessionsList`.
   - Pass `onNewChat={handleNewChat}` to `<AppShell>`.
   - Update `AppShellProps` to add `onNewChat: () => void`.

2. **AppShell.tsx** — Rename sidebar + add "Start a new chat" button + always show sidebar:
   - Accept new prop `onNewChat: () => void` in `AppShellProps`.
   - Change the sidebar to ALWAYS render (remove the `sessions.length > 0` conditional). The sidebar should always be visible on sm+ screens so users can start new chats even on their first visit.
   - Change sidebar header text from "History" to "Chats".
   - Add a "+ New Chat" button below the "Chats" header, above the SessionHistory list. Style: `w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors font-medium` with a "+" prefix. onClick calls `onNewChat`.

3. **SessionHistory.tsx** — Convert flat session list to folder-style tree:
   - Add a new prop: `threads: Record<string, Thread>` (the current Zustand threads map). Import Thread type from `../../types/index`.
   - For each session, show the session title as a folder header (slightly bolder, with a folder-like disclosure triangle or just indentation).
   - Below each session title, if that session is the currently loaded one (`isActive`), show its child threads (depth > 0) indented under it, like a file tree. Use the `threads` prop: filter threads where `depth > 0`, show them indented with a "- " prefix or a `pl-4` indent, truncated title, and clickable to navigate. For non-active sessions, just show the session title (we don't have their thread data loaded).
   - Pass `onNavigateThread: (threadId: string) => void` as a new prop for clicking child threads within the active session. AppShell passes `setActiveThread` for this.
   - Update AppShell to pass `threads={threads}` and `onNavigateThread={setActiveThread}` to SessionHistory.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && grep -n "onNewChat" frontend/src/App.tsx && grep -n "Chats" frontend/src/components/layout/AppShell.tsx && grep -n "onNavigateThread" frontend/src/components/history/SessionHistory.tsx && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>"+ New Chat" button visible in sidebar, sidebar titled "Chats", active session shows child threads in folder-style tree, TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit --project frontend/tsconfig.app.json` compiles without errors
- Visual: sidebar shows "Chats" header with "+ New Chat" button, active session shows child threads indented
- Thread title on first message is first 35 characters of question text
- Child thread pills are visibly closer to message content
</verification>

<success_criteria>
1. Thread titles = first 35 characters of the first question (not first 6 words)
2. "Start a new chat" button in sidebar creates a new session and refreshes list
3. Sidebar header says "Chats", child threads of active session shown in folder tree
4. Child thread pills have reduced padding (pr-80/sm:pr-140 instead of pr-120/sm:pr-200)
</success_criteria>

<output>
After completion, create `.planning/quick/15-ui-adjustments-thread-naming-multi-chat-/15-SUMMARY.md`
</output>
