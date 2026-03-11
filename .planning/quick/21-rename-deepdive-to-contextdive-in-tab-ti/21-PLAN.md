---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/index.html
  - frontend/src/App.tsx
  - frontend/e2e/auth.spec.ts
  - frontend/e2e/fixtures/chat-stream.txt
  - frontend/e2e/fixtures/find-sources.json
  - frontend/e2e/root-chat.spec.ts
  - frontend/e2e/simplify.spec.ts
  - frontend/e2e/go-deeper.spec.ts
  - frontend/e2e/navigation.spec.ts
  - frontend/e2e/find-sources.spec.ts
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/layout/AncestorPeekPanel.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Browser tab title shows 'ContextDive' instead of 'DeepDive'"
    - "Sign-in modal says 'ContextDive' instead of 'DeepDive'"
    - "When summarize or compact is triggered, a loading indicator appears in the thread area"
    - "Loading indicator disappears when the operation completes or fails"
  artifacts:
    - path: "frontend/index.html"
      provides: "Updated page title"
      contains: "ContextDive"
    - path: "frontend/src/App.tsx"
      provides: "Updated sign-in text"
      contains: "ContextDive"
  key_links:
    - from: "ThreadView.tsx"
      to: "sessionStore.summarizeThread/compactThread"
      via: "async wrapper with loading state"
      pattern: "operationLoading"
---

<objective>
Rename "DeepDive" to "ContextDive" across the frontend codebase, and add loading indicators for summarize/compact thread operations.

Purpose: Brand rename + UX improvement (users get visual feedback during async operations).
Output: Updated title/branding + loading spinners on summarize/compact.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/index.html
@frontend/src/App.tsx
@frontend/src/components/thread/ThreadView.tsx
@frontend/src/components/layout/AppShell.tsx
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/components/layout/AncestorPeekPanel.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename DeepDive to ContextDive everywhere</name>
  <files>frontend/index.html, frontend/src/App.tsx, frontend/e2e/auth.spec.ts, frontend/e2e/fixtures/chat-stream.txt, frontend/e2e/fixtures/find-sources.json, frontend/e2e/root-chat.spec.ts, frontend/e2e/simplify.spec.ts, frontend/e2e/go-deeper.spec.ts, frontend/e2e/navigation.spec.ts, frontend/e2e/find-sources.spec.ts</files>
  <action>
    Replace all occurrences of "DeepDive" with "ContextDive" in these files:

    1. `frontend/index.html` line 17: `<title>DeepDive</title>` -> `<title>ContextDive</title>`
    2. `frontend/src/App.tsx` line 23: "Sign in to DeepDive Chat" -> "Sign in to ContextDive Chat"
    3. E2E test files — update all string literals and assertions:
       - `auth.spec.ts`: title regex `/DeepDive|frontend/` -> `/ContextDive|frontend/`
       - `root-chat.spec.ts`: "Hello, what is DeepDive?" -> "Hello, what is ContextDive?" and related assertions
       - `simplify.spec.ts`, `go-deeper.spec.ts`, `navigation.spec.ts`, `find-sources.spec.ts`: all `text=DeepDive` locators -> `text=ContextDive`
    4. E2E fixtures:
       - `chat-stream.txt`: `**DeepDive**` -> `**ContextDive**`
       - `find-sources.json`: "DeepDive Research Tool" -> "ContextDive Research Tool", URL `deepdive` -> `contextdive`

    Do a final grep for any remaining "DeepDive" (case-insensitive) in the frontend/ directory to catch anything missed. Do NOT touch backend/, .planning/, or other non-frontend files.
  </action>
  <verify>
    <automated>cd frontend && grep -ri "deepdive" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" --include="*.txt" src/ e2e/ index.html | grep -v node_modules | wc -l</automated>
    Should return 0 (no remaining DeepDive references in frontend source).
  </verify>
  <done>All "DeepDive" references in frontend code replaced with "ContextDive". Browser tab shows "ContextDive". Sign-in text says "ContextDive Chat".</done>
</task>

<task type="auto">
  <name>Task 2: Add loading indicators for summarize/compact operations</name>
  <files>frontend/src/components/thread/ThreadView.tsx, frontend/src/components/layout/AppShell.tsx, frontend/src/components/branching/GutterColumn.tsx, frontend/src/components/layout/AncestorPeekPanel.tsx</files>
  <action>
    Add visual loading feedback when summarize or compact operations are in progress. The approach:

    1. In `ThreadView.tsx`:
       - Add a `useState<string | null>` called `operationLoading` (stores threadId being operated on, or null).
       - Wrap the `onSummarize` handler (around line 388): set `operationLoading` to threadId before await, clear it in finally block.
       - Wrap the `onCompact` handler (around line 417): same pattern — set before, clear in finally.
       - Render a loading overlay/banner when `operationLoading` is not null: a small inline banner at the top of the thread content area (inside the scroll container) showing a spinner + "Summarizing..." or "Compacting..." text. Use Tailwind classes consistent with the app's dark mode support. Example:
         ```
         {operationLoading && (
           <div className="flex items-center gap-2 px-4 py-2 text-sm text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 rounded-lg mx-4 mt-2">
             <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
             </svg>
             Processing...
           </div>
         )}
         ```
       - Place this banner just above the MessageList inside the scroll container.

    2. In `AppShell.tsx`:
       - Same pattern: add `operationLoading` state.
       - Wrap the `onSummarize` and `onCompact` callbacks (lines ~114-115) to set/clear loading state.
       - Pass the loading threadId down or show a small spinner near the sidebar thread entry. Since AppShell triggers these from the sidebar context menu, show a subtle spinner next to the thread title in the sidebar while the operation runs. Alternatively, since AppShell passes these to child components that have their own context menus, the simplest approach is to add a toast-like notification or a small loading state. Use the same inline banner approach if AppShell has a thread content area, or pass `operationLoading` as a prop to the relevant child.

    3. In `GutterColumn.tsx` and `AncestorPeekPanel.tsx`:
       - These receive `onSummarize`/`onCompact` as props and pass them to context menus. The loading state is managed by the parent (ThreadView/AppShell), so no changes needed in these files unless you want to disable the menu items during loading. Optional: accept an `operationLoading` prop and disable Summarize/Compact buttons in the context menu when loading is truthy. This prevents double-clicks.

    Keep it simple. The primary goal is showing the user that something is happening. A spinner + text banner at the thread level is sufficient.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | tail -5</automated>
    TypeScript compiles without errors.
  </verify>
  <done>When user triggers Summarize or Compact from any context menu, a visible loading indicator appears in the thread area. The indicator disappears when the operation completes or fails. No double-triggering is possible during loading.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx tsc --noEmit` — no type errors
2. `cd frontend && grep -ri "deepdive" --include="*.ts" --include="*.tsx" --include="*.html" src/ e2e/ index.html` — zero results
3. Visual: open app, verify tab title says "ContextDive"
4. Visual: trigger summarize on a thread, verify spinner appears and disappears
</verification>

<success_criteria>
- Browser tab title reads "ContextDive"
- Sign-in modal reads "Sign in to ContextDive Chat"
- All E2E tests reference "ContextDive" instead of "DeepDive"
- Summarize/Compact operations show a loading spinner while in progress
- Loading spinner disappears on completion or failure
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/21-rename-deepdive-to-contextdive-in-tab-ti/21-SUMMARY.md`
</output>
