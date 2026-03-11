---
phase: quick-19
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/history/SessionHistory.tsx
  - frontend/src/App.tsx
autonomous: true
requirements: [UI-FIX-01, UI-FIX-02]
must_haves:
  truths:
    - "3-dot menu button is visible on every chat entry without hovering"
    - "When switching to a different chat session, the sidebar title shows the actual chat title (first 35 chars of first prompt), not 'Root'"
  artifacts:
    - path: "frontend/src/components/history/SessionHistory.tsx"
      provides: "Always-visible 3-dot menu button + improved liveTitle fallback"
    - path: "frontend/src/App.tsx"
      provides: "Session list refresh after loading a session"
  key_links:
    - from: "SessionHistory.tsx liveTitle logic"
      to: "Zustand root thread title"
      via: "liveRootThread.title check"
      pattern: "liveRootThread.*title.*Root"
---

<objective>
Fix two UI bugs: (1) make the 3-dot menu button always visible instead of hover-only, and (2) fix chat title showing "Root" when switching sessions.

Purpose: Improve sidebar usability — users need to see the menu button and the correct chat title at all times.
Output: Updated SessionHistory.tsx and App.tsx
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/history/SessionHistory.tsx
@frontend/src/App.tsx
@frontend/src/api/sessions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make 3-dot menu always visible and fix chat title "Root" fallback</name>
  <files>frontend/src/components/history/SessionHistory.tsx, frontend/src/App.tsx</files>
  <action>
**In SessionHistory.tsx — ThreeDotButton (line 47-57):**
1. Remove `opacity-0 group-hover:opacity-100` from the className so the button is always visible.
2. Change the text content from `&#x2026;` (horizontal ellipsis) to a vertical ellipsis character `⋮` for better clickability.
3. Increase the button size slightly: change `text-xs` to `text-sm`, and change `px-1 py-0.5` to `px-1.5 py-1`.
4. Make the default color more visible: change `text-stone-400 dark:text-slate-500` to `text-stone-500 dark:text-slate-400`.

**In SessionHistory.tsx — liveTitle logic (lines 350-356):**
5. Update the liveTitle null-check on line 354 to ALSO filter out `'Root'` (case-insensitive). The condition should be:
   ```
   liveRootThread.title &&
   liveRootThread.title !== 'New chat' &&
   liveRootThread.title.toLowerCase() !== 'root'
   ```
   This prevents the sidebar from showing "Root" as a title when the thread title was never updated from the backend default.

**In App.tsx — handleLoadSession (lines 111-137):**
6. After `hydrateSession()` completes (line 131-136), refresh the sessions list so stale titles update. Add after line 136:
   ```typescript
   // Refresh session list to pick up any title changes from backend
   const updatedSessions = await fetchSessions(getToken);
   setSessionsList(updatedSessions);
   ```
   This ensures that when switching sessions, the session list titles are refreshed from the backend (which reads the root thread's current title).
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - ThreeDotButton is always visible (no opacity-0/group-hover), uses vertical ellipsis, slightly larger
    - liveTitle filters out "Root" in addition to "New chat"
    - handleLoadSession refreshes sessionsList after hydrating to get fresh titles from backend
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit --project frontend/tsconfig.app.json` passes
2. Visual check: 3-dot menu button visible on all chat entries without hovering
3. Functional check: switching sessions shows correct title, not "Root"
</verification>

<success_criteria>
- 3-dot menu button is always visible with higher contrast
- Chat title never shows "Root" — falls back to session.title from the refreshed list or "New chat"
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/19-make-3-dot-menu-more-visible-fix-chat-ti/19-SUMMARY.md`
</output>
