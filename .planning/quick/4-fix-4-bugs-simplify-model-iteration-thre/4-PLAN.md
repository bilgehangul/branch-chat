---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/providers/gemini.ts
  - backend/src/routes/index.ts
  - frontend/src/store/sessionStore.ts
  - frontend/src/api/simplify.ts
  - frontend/src/components/branching/ActionBubble.tsx
  - frontend/src/components/layout/SpineStrip.tsx
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/components/layout/AncestorPeekPanel.tsx
autonomous: true
requirements: [BUG-01, BUG-02, BUG-03, BUG-04]

must_haves:
  truths:
    - "Simplify uses only 2 reliable models, adds 1-second delay between retries, and surfaces a user-readable error on failure"
    - "Summarize calls /api/simplify with mode=simpler and replaces thread messages with a single summary message"
    - "Compact collapses messages older than the last 3 into a single summary message using /api/simplify"
    - "Text selection ActionBubble does not vanish when the user re-clicks within a message to adjust their selection"
    - "On mobile (<640px): ancestor panels are hidden, gutter pill right-offset and width are reduced, SpineStrip collapses to a narrow touch target, ThreadView right-padding is responsive"
  artifacts:
    - path: "backend/src/providers/gemini.ts"
      provides: "Reduced FREE_TIER_MODELS to 2 entries, 1-second delay between model retries in simplify()"
    - path: "backend/src/routes/index.ts"
      provides: "No new route needed — summarize/compact reuse /api/simplify"
    - path: "frontend/src/store/sessionStore.ts"
      provides: "summarizeThread and compactThread call /api/simplify, mutate messages in store"
    - path: "frontend/src/api/simplify.ts"
      provides: "Exported summarizeMessages helper used by store actions"
    - path: "frontend/src/components/branching/ActionBubble.tsx"
      provides: "mousedown handler checks selection is still non-collapsed before dismissing"
    - path: "frontend/src/components/layout/SpineStrip.tsx"
      provides: "w-7 replaced with sm:w-7 w-5 responsive class"
    - path: "frontend/src/components/thread/ThreadView.tsx"
      provides: "pr-[200px] replaced with sm:pr-[200px] pr-[120px]"
    - path: "frontend/src/components/branching/GutterColumn.tsx"
      provides: "Pill width/right offset uses responsive values: 120px wide on mobile, 184px on sm+"
    - path: "frontend/src/components/layout/AppShell.tsx"
      provides: "Ancestor panels hidden on mobile with hidden sm:flex; widths unchanged"
    - path: "frontend/src/components/layout/AncestorPeekPanel.tsx"
      provides: "border softened to opacity-60 on mobile, gradient fade preserved"
  key_links:
    - from: "frontend/src/store/sessionStore.ts"
      to: "/api/simplify"
      via: "fetch call in summarizeThread/compactThread using apiRequest pattern"
      pattern: "apiRequest.*api/simplify"
    - from: "frontend/src/components/branching/ActionBubble.tsx"
      to: "window.getSelection()"
      via: "mousedown handler guards dismissal on isCollapsed check"
      pattern: "getSelection.*isCollapsed"
---

<objective>
Fix 4 bugs discovered post-Phase-6: Gemini model iteration hammering all 5 models, summarize/compact being no-op stubs, text selection bubble dismissing prematurely, and branch/thread visuals being unresponsive on mobile.

Purpose: Make the application functionally correct and usable on all screen sizes.
Output: 10 modified files across backend and frontend. No new files required.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key decisions from history relevant to these fixes:
- Clerk auth: use `getToken` passed as function parameter — no React hooks in API layer (Phase 02-03 decision)
- `apiRequest` from `frontend/src/api/client.ts` is the single HTTP utility — all new API calls use it
- Zustand store actions use `set`/`get` — no direct React in store
- `summarizeThread` and `compactThread` currently only call `console.log` — they need real implementations
- `FREE_TIER_MODELS` in `gemini.ts` currently has 5 entries; the first (`gemini-3-flash-preview`) and last two (`gemini-2.0-flash-lite`, `gemini-2.0-flash`) are the problematic cascade sources
- `ActionBubble` useEffect on line 59-69: `handleMouseDown` calls `onDismiss()` unconditionally when click is outside bubble — no check on whether selection is still active
- `LeadPill` in `GutterColumn.tsx` line 170: `style={{ position: 'absolute', top, right: 8, width: 184 }}` — inline style, cannot use Tailwind breakpoints here; must use JS-computed width or a wrapper class
- `AppShell.tsx` line 31: `const w = distFromParent === 0 ? 180 : distFromParent === 1 ? 110 : 68` — these widths feed `AncestorPeekPanel` as a `width` prop (inline style)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Gemini model iteration (Bug 1) + implement summarize/compact via /api/simplify (Bug 2)</name>
  <files>
    backend/src/providers/gemini.ts
    frontend/src/store/sessionStore.ts
    frontend/src/api/simplify.ts
  </files>
  <action>
**backend/src/providers/gemini.ts — reduce model list and add delay:**

Replace `FREE_TIER_MODELS` (currently 5 entries) with only 2 reliable models:
```typescript
const FREE_TIER_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;
```

In the `simplify()` method's retry loop (lines 81-94), add a 1-second delay between model attempts. After the `console.warn` line and before the next iteration, insert:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

Apply the same delay in `streamChat()` (lines 52-73) and `generateCitationNote()` (lines 105-120) for consistency.

Also improve the error surfaced to the client: in `simplify.ts` route (backend), change the catch block error message from `'AI provider request failed'` to `'AI is temporarily overloaded. Please try again in a moment.'` — this appears in the frontend SimplificationBlock error UI.

**frontend/src/api/simplify.ts — add summarize helper:**

Add a new exported function below `simplifyText`:
```typescript
export async function summarizeMessages(
  params: { text: string },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<{ rewritten: string }>> {
  return apiRequest<{ rewritten: string }>('/api/simplify', {
    method: 'POST',
    body: JSON.stringify({ text: params.text, mode: 'simpler' }),
    getToken,
  });
}
```

**frontend/src/store/sessionStore.ts — implement summarizeThread and compactThread:**

The store currently cannot call async API functions directly (Zustand actions are synchronous by convention here, but they CAN be async — the store uses `create` with `set`/`get`). Update the interface and implementations:

In the `SessionState` interface, change the signatures:
```typescript
summarizeThread: (threadId: string, getToken: () => Promise<string | null>) => Promise<void>;
compactThread: (threadId: string, getToken: () => Promise<string | null>) => Promise<void>;
```

Implement `summarizeThread`:
1. Get the thread from `get().threads[threadId]`. If missing, return.
2. Collect all messages: `get().threads[threadId].messageIds.map(id => get().messages[id]).filter(Boolean)`.
3. Build a combined text block: each message formatted as `"[User]: {content}\n[AI]: {content}"` pairs.
4. Call `summarizeMessages({ text: combinedText }, getToken)` (import from `'../api/simplify'`).
5. On success: create a new Message with `id: crypto.randomUUID()`, `role: 'assistant'`, `content: '[Summary]\n' + rewritten`, `threadId`, `isStreaming: false`, `childLeads: []`, `annotations: []`.
6. Replace the thread's messageIds with just this new summary message id using `set()`.
7. On error: `console.error('[summarizeThread] failed:', err)` — do not throw (non-fatal).

Implement `compactThread`:
1. Get ordered messages for the thread.
2. If 3 or fewer messages, return (nothing to compact).
3. Take all messages except the last 3: `const toCompact = messages.slice(0, messages.length - 3)`.
4. Build combined text from `toCompact` using the same formatting as summarizeThread.
5. Call `summarizeMessages({ text: combinedText }, getToken)`.
6. On success: create a compact summary Message. Replace the thread's messageIds with `[summaryMsgId, ...last3Ids]`.
7. On error: `console.error('[compactThread] failed:', err)` — do not throw.

**Update callers in GutterColumn.tsx and AncestorPeekPanel.tsx:**

Both components receive `onSummarize` and `onCompact` callbacks. These are wired through `AppShell.tsx` from `useSessionStore`. The `getToken` function must be passed through. In `AppShell.tsx`, import `useAuth` from `@clerk/clerk-react` and get `getToken`. Then wrap the store actions:
```typescript
const { getToken } = useAuth();
// ...
onSummarize={(threadId) => void summarizeThread(threadId, getToken)}
onCompact={(threadId) => void compactThread(threadId, getToken)}
```
Do this for both the ancestor panel props and the GutterColumn props (passed via ThreadView).

In `ThreadView.tsx`, the `summarizeThread` and `compactThread` from the store are passed to `GutterColumn`. Add `getToken` from `useAuth()` (already imported via `const { getToken } = useAuth()` on line 39). Wrap them:
```typescript
onSummarize={(threadId) => void summarizeThread(threadId, getToken)}
onCompact={(threadId) => void compactThread(threadId, getToken)}
```

Note: `GutterColumn`'s `onSummarize`/`onCompact` prop types are `(threadId: string) => void` — keep those prop signatures as-is. The wrapping happens at the call site in `ThreadView` and `AppShell`.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/backend" && npx tsc --noEmit 2>&1 | head -30</automated>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - `FREE_TIER_MODELS` has exactly 2 entries in gemini.ts
    - Each retry loop in gemini.ts has a 1-second await between model attempts
    - `summarizeMessages` is exported from frontend/src/api/simplify.ts
    - `summarizeThread` and `compactThread` in sessionStore.ts call the API and mutate messages in store
    - Both TypeScript checks pass with no errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix text selection dismiss bug (Bug 3)</name>
  <files>
    frontend/src/components/branching/ActionBubble.tsx
  </files>
  <action>
In `ActionBubble.tsx`, update the `handleMouseDown` function inside the `useEffect` (lines 60-63) to check whether the selection is still non-collapsed before dismissing:

Replace:
```typescript
function handleMouseDown(e: MouseEvent) {
  if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
    onDismiss();
  }
}
```

With:
```typescript
function handleMouseDown(e: MouseEvent) {
  if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
    // Don't dismiss if the user is clicking within a message element to adjust their selection.
    // Give the browser a tick to finalize the new selection state, then check.
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        onDismiss();
      }
      // If selection is still non-collapsed, the user re-selected text — keep bubble alive.
      // The useTextSelection mouseup handler will update bubble position if needed.
    }, 0);
  }
}
```

This mirrors the same setTimeout(0) pattern used in `useTextSelection.ts` to let the browser finalize selection state after mousedown. The selection being non-collapsed means the user is still selecting text; we preserve the bubble. If collapsed (click on non-text area, or single click), we dismiss.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | grep ActionBubble</automated>
  </verify>
  <done>
    - `handleMouseDown` in ActionBubble wraps `onDismiss()` in a `setTimeout(0)` that checks `window.getSelection().isCollapsed` first
    - No TypeScript errors in ActionBubble.tsx
    - Clicking within a message to adjust a text selection no longer collapses the bubble
  </done>
</task>

<task type="auto">
  <name>Task 3: Make branch/thread visuals responsive on mobile (Bug 4)</name>
  <files>
    frontend/src/components/layout/SpineStrip.tsx
    frontend/src/components/thread/ThreadView.tsx
    frontend/src/components/branching/GutterColumn.tsx
    frontend/src/components/layout/AppShell.tsx
    frontend/src/components/layout/AncestorPeekPanel.tsx
  </files>
  <action>
Apply responsive fixes to each file:

**SpineStrip.tsx** — line 20, the outer div currently has `w-7`. Change to `w-5 sm:w-7` so it narrows on mobile:
```tsx
className="w-5 sm:w-7 flex-shrink-0 flex items-center justify-center cursor-pointer bg-zinc-900 hover:bg-zinc-800 transition-colors"
```

**ThreadView.tsx** — line 312, the inner transition wrapper has `pr-[200px]` hardcoded. Change to responsive padding:
```tsx
className={`transition-transform duration-200 ease-out ${
  isTransitioning ? 'translate-x-[-100%]' : 'translate-x-0'
} ${hasChildThreads ? 'pr-[120px] sm:pr-[200px]' : ''}`}
```
This reserves 120px on mobile (enough for a compact pill) and 200px on sm+ screens.

**GutterColumn.tsx** — `LeadPill` uses an inline style on line 170: `style={{ position: 'absolute', top, right: 8, width: 184 }}`. This cannot use Tailwind breakpoints directly. Use a CSS custom property / window.innerWidth check instead. Read `window.innerWidth` inside `LeadPill` at render time (not in a hook — just inline for simplicity since it changes rarely and ResizeObserver in the parent will trigger re-renders on resize):

Replace the outer div's inline style:
```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
const pillWidth = isMobile ? 120 : 184;
const pillRight = isMobile ? 4 : 8;

// in return:
<div style={{ position: 'absolute', top, right: pillRight, width: pillWidth }}>
```

Also soften the pill visual on mobile — the LeadPill button currently has `bg-white border border-slate-200 shadow-sm`. On mobile, add `bg-white/90` instead of solid white to make it slightly transparent and less heavy. Achieve this by passing `isMobile` down or inline:
```tsx
className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 text-left text-sm transition-colors cursor-pointer ${isMobile ? 'bg-white/90' : 'bg-white'}`}
```

**AppShell.tsx** — hide ancestor panels on mobile entirely. The ancestor panels map renders at line 29. Wrap each `AncestorPeekPanel` with a `hidden sm:flex` container div, OR apply it to the `AncestorPeekPanel` root element directly. Since `AncestorPeekPanel` uses `className="relative flex-shrink-0 flex flex-col ..."`, the cleanest fix is to add `hidden sm:flex` to the ancestor map wrapper in `AppShell`. Wrap the `ancestors.map(...)` output in a fragment but give each panel a hiding wrapper:

```tsx
{ancestors.map((thread, idx) => {
  const distFromParent = ancestors.length - 1 - idx;
  const w = distFromParent === 0 ? 180 : distFromParent === 1 ? 110 : 68;
  const nextThread = ancestry[idx + 1];
  return (
    <div key={thread.id} className="hidden sm:block flex-shrink-0" style={{ width: w }}>
      <AncestorPeekPanel
        thread={thread}
        allMessages={messages}
        highlightMessageId={nextThread?.parentMessageId ?? undefined}
        childThreadId={nextThread?.id}
        width={w}
        onClick={() => setActiveThread(thread.id)}
        onNavigate={setActiveThread}
        onDelete={deleteThread}
        onSummarize={(threadId) => void summarizeThread(threadId, getToken)}
        onCompact={(threadId) => void compactThread(threadId, getToken)}
      />
    </div>
  );
})}
```

Note: `AncestorPeekPanel` renders with `className="relative flex-shrink-0 flex flex-col ..."` and `style={{ width }}`. The outer `hidden sm:block` wrapper handles visibility; the inner component keeps its width from the prop. Remove `key` from the inner component since it's on the wrapper div now.

Also add `const { getToken } = useAuth()` import to `AppShell.tsx`:
```typescript
import { UserButton, useAuth } from '@clerk/clerk-react';
```
And add inside `AppShell`:
```typescript
const { getToken } = useAuth();
```

**AncestorPeekPanel.tsx** — soften visual styling. The root `div` has `bg-slate-50` and a hard `borderRight: '3px solid {accentColor}'`. Soften on mobile by replacing the solid background with a semi-transparent one and thinning the border:

Change the root div's `className` to include responsive opacity:
```tsx
className="relative flex-shrink-0 flex flex-col bg-slate-50/80 sm:bg-slate-50 cursor-pointer group hover:bg-slate-100 transition-colors"
```

Change the `style` borderRight to use 2px instead of 3px on mobile. Since this is an inline style, use a prop-derived check — `AncestorPeekPanel` already receives `width`, so we can infer mobile by `width < 100`:
```tsx
style={{ width, borderRight: `${width < 100 ? 2 : 3}px solid ${thread.accentColor}` }}
```

This makes deeply-nested (narrow) ancestor panels use a thinner accent border, reducing visual heaviness at small widths.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -40</automated>
  </verify>
  <done>
    - SpineStrip uses `w-5 sm:w-7`
    - ThreadView uses `pr-[120px] sm:pr-[200px]` when child threads exist
    - GutterColumn LeadPill reads `window.innerWidth` and uses 120px width / 4px right on mobile
    - AppShell wraps each AncestorPeekPanel in `hidden sm:block` — panels invisible on mobile
    - AncestorPeekPanel uses `bg-slate-50/80 sm:bg-slate-50` and thinner border for width < 100
    - TypeScript check passes with no errors
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:

1. Backend TypeScript: `cd backend && npx tsc --noEmit` — zero errors
2. Frontend TypeScript: `cd frontend && npx tsc --noEmit` — zero errors
3. Frontend tests: `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20` — no regressions
4. Manual smoke check (if possible): Select text in a message, click elsewhere in the same message — bubble should stay visible. On mobile viewport (DevTools 375px), ancestor panels should be hidden and pills should be narrower.
</verification>

<success_criteria>
- `FREE_TIER_MODELS` in gemini.ts has exactly 2 entries
- 1-second delay between retry attempts in all 3 gemini methods
- `summarizeThread` and `compactThread` make real API calls to /api/simplify
- ActionBubble does not dismiss when user re-clicks within message text to adjust selection
- On mobile: ancestor panels hidden, spine strip narrower, gutter pills 120px wide, thread content right-padding 120px
- Zero TypeScript errors in both backend and frontend
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-4-bugs-simplify-model-iteration-thre/4-SUMMARY.md` documenting:
- Files changed and what was fixed in each
- Any deviation from this plan and why
- Verification results (tsc output, test results)
</output>
