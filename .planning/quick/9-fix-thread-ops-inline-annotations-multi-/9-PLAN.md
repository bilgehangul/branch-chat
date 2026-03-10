---
phase: quick-9
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/store/sessionStore.ts
  - frontend/src/components/thread/ThreadView.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/hooks/useTextSelection.ts
  - frontend/src/components/branching/ActionBubble.tsx
  - frontend/src/components/thread/MarkdownRenderer.tsx
  - frontend/src/components/thread/MessageBlock.tsx
  - frontend/src/components/annotations/CitationBlock.tsx
  - frontend/src/components/annotations/SimplificationBlock.tsx
  - frontend/src/api/simplify.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Right-click delete on a gutter pill shows confirm dialog and fully removes thread + children + messages from store and DB"
    - "Summarize creates a new child thread containing a summary of the selected thread's conversation"
    - "Compact replaces the selected thread's content with a single summary message, removing all child threads"
    - "Find Sources inline action works end-to-end: select text, click Find Sources, citation block appears with results"
    - "Simplify inline action works end-to-end: select text, pick mode, simplification block appears with rewritten text"
    - "Multi-paragraph selection (across multiple data-paragraph-id blocks) shows the ActionBubble with all actions available"
    - "AI responses render Markdown properly with dark-mode-compatible colors, correct prose spacing, and readable code blocks"
  artifacts:
    - path: "frontend/src/store/sessionStore.ts"
      provides: "Corrected summarizeThread (creates child) and compactThread (replaces with summary) implementations"
    - path: "frontend/src/hooks/useTextSelection.ts"
      provides: "Multi-paragraph selection support"
    - path: "frontend/src/components/thread/MarkdownRenderer.tsx"
      provides: "Dark-mode-aware prose classes and layout fixes"
  key_links:
    - from: "frontend/src/components/branching/GutterColumn.tsx"
      to: "frontend/src/store/sessionStore.ts"
      via: "onSummarize/onCompact callbacks"
      pattern: "summarizeThread|compactThread"
    - from: "frontend/src/hooks/useTextSelection.ts"
      to: "frontend/src/components/branching/ActionBubble.tsx"
      via: "bubble state with multi-paragraph anchorText"
      pattern: "anchorText.*paragraphId"
---

<objective>
Fix thread operations (delete/summarize/compact), inline annotations (find resources + simplify), multi-paragraph selection, and output formatting.

Purpose: Multiple features are broken or not working as intended. This plan fixes all of them in three focused tasks.
Output: Working thread ops, inline annotations, multi-paragraph selection, and proper Markdown rendering.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/store/sessionStore.ts
@frontend/src/components/thread/ThreadView.tsx
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/hooks/useTextSelection.ts
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/thread/MarkdownRenderer.tsx
@frontend/src/components/thread/MessageBlock.tsx
@frontend/src/components/annotations/CitationBlock.tsx
@frontend/src/components/annotations/SimplificationBlock.tsx
@frontend/src/api/simplify.ts
@frontend/src/api/search.ts
@frontend/src/api/client.ts
@frontend/src/api/sessions.ts
@frontend/src/types/index.ts
@backend/src/routes/sessions.ts
@backend/src/routes/simplify.ts
@backend/src/routes/find-sources.ts

<interfaces>
From frontend/src/types/index.ts:
```typescript
export interface Thread {
  id: string; depth: 0|1|2|3|4; parentThreadId: string | null;
  anchorText: string | null; parentMessageId: string | null;
  title: string; accentColor: string; messageIds: string[];
  childThreadIds: string[]; scrollPosition: number;
}
export interface Message {
  id: string; threadId: string; role: 'user' | 'assistant';
  content: string; annotations: Annotation[]; childLeads: ChildLead[];
  isStreaming: boolean; createdAt: number;
}
export interface Annotation {
  id: string; type: 'source' | 'rewrite' | 'simplification';
  targetText: string; paragraphIndex: number; originalText: string;
  replacementText: string | null; citationNote: string | null;
  sources: SourceResult[]; isShowingOriginal: boolean;
}
```

From frontend/src/api/simplify.ts:
```typescript
export async function simplifyText(params: { text: string; mode: 'simpler' | 'example' | 'analogy' | 'technical' }, getToken): Promise<ApiResponse<{ rewritten: string }>>;
export async function summarizeMessages(params: { text: string }, getToken): Promise<ApiResponse<{ rewritten: string }>>;
```

From frontend/src/api/search.ts:
```typescript
export function toSourceResult(r: SearchResult): SourceResult;
export async function searchSources(params: { query: string }, getToken): Promise<ApiResponse<{ results: SearchResult[]; citationNote: string }>>;
```

From frontend/src/store/sessionStore.ts:
```typescript
deleteThread: (threadId: string) => void;
summarizeThread: (threadId: string, getToken) => Promise<void>;
compactThread: (threadId: string, getToken) => Promise<void>;
createThread: (params: CreateThreadParams) => string;
addMessage: (message: Message) => void;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix thread operations (delete confirmation, summarize as child, compact)</name>
  <files>
    frontend/src/store/sessionStore.ts
    frontend/src/components/thread/ThreadView.tsx
    frontend/src/components/branching/GutterColumn.tsx
  </files>
  <action>
Three fixes in this task:

**1a. Delete thread — verify wiring is correct**

The delete flow is: GutterColumn right-click -> ThreadContextMenu -> ConfirmDialog -> onDelete(threadId) -> ThreadView's onDeleteThread callback which calls `deleteThread(threadId)` (Zustand) + `deleteThreadFromDB(threadId, getToken)` (backend).

Inspect whether the ConfirmDialog's mousedown backdrop handler (`onMouseDown` on the overlay div) is conflicting with ThreadContextMenu's own mousedown dismiss handler (line 57-59 in GutterColumn.tsx: `document.addEventListener('mousedown', handler)` closes the context menu on any mousedown). The issue: when ConfirmDialog opens, the context menu's global mousedown listener fires and closes the menu (including the dialog) before the user can interact.

Fix in GutterColumn.tsx `ThreadContextMenu`:
- When `pendingDelete` is true, do NOT close the context menu via the global mousedown handler. Guard the handler: `if (pendingDelete) return;` — but since `pendingDelete` is state, the listener captures a stale closure. Instead, use a ref to track pendingDelete:
  ```typescript
  const pendingDeleteRef = useRef(false);
  // sync ref with state
  useEffect(() => { pendingDeleteRef.current = pendingDelete; }, [pendingDelete]);
  // in the mousedown handler:
  const handler = (e: MouseEvent) => {
    if (pendingDeleteRef.current) return; // don't dismiss while confirm dialog is open
    onClose();
  };
  ```

**1b. Summarize thread — create summary as new child thread**

Currently `summarizeThread` in sessionStore.ts replaces the thread's messages with a single summary message (lines 252-300). The user wants it to CREATE A NEW CHILD THREAD under the selected thread containing the summary.

Rewrite `summarizeThread` in sessionStore.ts:
1. Gather all messages from the thread AND recursively from all descendant child threads (to summarize the full tree structure).
2. Build `combinedText` that includes thread title + messages from each thread in the tree.
3. Call `summarizeMessages({ text: combinedText }, getToken)`.
4. On success, use `get().createThread()` to create a new child thread under the target thread with title "Summary" and the same accent color.
5. Create a summary message in the new child thread using `addMessage()`.
6. Do NOT modify the original thread's messages — the summary is additive.

Update ThreadView.tsx `onSummarize` callback to also persist the new child thread to backend (fire-and-forget `createThreadOnBackend`).

**1c. Compact thread — replace thread content with summary**

Currently `compactThread` keeps the last 3 messages and prepends a summary. The user wants to: summarize ALL content (the selected thread AND its children), then replace the selected thread's messages with a single summary message, and DELETE all child threads.

Rewrite `compactThread` in sessionStore.ts:
1. Gather all messages from the thread + all descendant threads recursively.
2. Build `combinedText` from all messages.
3. Call `summarizeMessages({ text: combinedText }, getToken)`.
4. On success:
   - Collect all child thread IDs recursively.
   - Remove all child threads and their messages from state.
   - Replace the target thread's messageIds with a single new summary message.
   - Clear the target thread's childThreadIds.
5. Clean up childLeads in the target thread's messages that reference deleted threads.

Update ThreadView.tsx `onCompact` callback to also delete child threads from backend (fire-and-forget loop of `deleteThreadFromDB` for each child, or just delete the top-level children since backend cascades).
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - Delete thread shows confirm dialog that stays visible (not immediately dismissed), and on confirm removes thread + children from store and fires backend delete
    - Summarize creates a new child thread with a summary message under the selected thread (original messages preserved)
    - Compact replaces thread content with a single summary, removes all child threads
    - All three operations compile without TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix inline annotations (find resources, simplify) + multi-paragraph selection</name>
  <files>
    frontend/src/hooks/useTextSelection.ts
    frontend/src/components/branching/ActionBubble.tsx
    frontend/src/components/thread/ThreadView.tsx
    frontend/src/api/search.ts
    frontend/src/api/simplify.ts
    frontend/src/api/client.ts
  </files>
  <action>
Three sub-fixes:

**2a. Fix inline Find Resources**

The issue is likely that `searchSources` in `api/search.ts` passes `body: JSON.stringify(params)` to `apiRequest`, but `apiRequest` in `api/client.ts` does NOT re-stringify — it passes fetchOptions through directly. However, `apiRequest` always sets `Content-Type: application/json`. Check the actual flow:

1. `searchSources({ query }, getToken)` calls `apiRequest('/api/find-sources', { method: 'POST', body: JSON.stringify({ query }), getToken })`.
2. `apiRequest` destructures `getToken` out, passes `body` through to fetch.

This should work. The more likely issue: check that the backend `/api/find-sources` route is actually mounted and that the `searchProvider` (Tavily) is configured. If the API returns an error, the frontend shows an error annotation block.

Debug approach: Add error logging to `handleFindSources` in ThreadView.tsx to log the actual response. Also check if `getToken` is returning a valid token.

However, the most likely culprit for "not working" is the ActionBubble `onFindSources` callback. Looking at ThreadView.tsx line 399-401:
```typescript
onFindSources={(anchorText, paragraphId, messageId) =>
  void handleFindSources(anchorText, paragraphId, messageId)
}
```
And ActionBubble line 120: `onClick={() => { onFindSources(bubble.anchorText, bubble.paragraphId, bubble.messageId); onDismiss(); }}`

This calls `onDismiss()` which clears the bubble. The `handleFindSources` function uses `bubble.anchorText` etc. from the already-captured closure params, so that's fine.

Check if `searchSources` body is double-encoded: `apiRequest` receives `body: JSON.stringify(params)` — and does NOT stringify again. The body is passed directly to fetch. This is correct.

Check if the backend `find-sources` route requires a specific `Content-Type` or body shape. The backend reads `req.body.query` — Express json middleware parses the body. This should work.

If both find-sources and simplify are "not working", the common factor is `apiRequest` in `client.ts`. Look at line 23: `const res = await fetch(...)`. On error (non-200), it dispatches auth-expired on 401, or returns the JSON. But for 502 errors from the backend (UPSTREAM_ERROR), it would return the JSON error envelope. The frontend handles `response.error` correctly.

The actual bug may be simpler: test by running the app and checking browser console. But since we can't do that, ensure robust error handling and add `console.error` in catch blocks.

One potential issue: `apiRequest` always calls `res.json()` even if the response is not JSON (e.g., HTML error page). Wrap the `res.json()` call in a try-catch:

In `frontend/src/api/client.ts`, wrap the final `res.json()` in try-catch:
```typescript
try {
  return await res.json() as ApiResponse<T>;
} catch {
  return { data: null, error: { code: 'PARSE_ERROR', message: 'Invalid response from server' } };
}
```

**2b. Fix inline Simplify**

Same pattern as find-sources. `simplifyText` in `api/simplify.ts` calls `apiRequest('/api/simplify', { method: 'POST', body: JSON.stringify({ text, mode }), getToken })`. Backend validates `text` and `mode`. This should work.

Apply the same `res.json()` safety fix from 2a.

Add `console.error` logging in `handleSimplify` and `handleFindSources` in ThreadView.tsx for the error case, logging `response.error` so bugs are diagnosable from browser console.

**2c. Multi-paragraph selection**

Currently `useTextSelection.ts` lines 60-64 reject cross-block selections:
```typescript
if (!anchorBlock || !focusBlock || anchorBlock !== focusBlock) {
  setBubble(null);
  return;
}
```

Fix: Allow cross-block selection. When anchor and focus are in different blocks:
1. Use the anchor block's paragraph ID (the block where selection started).
2. Walk up from both anchorNode and focusNode to find their respective `[data-paragraph-id]` elements.
3. If both exist and are in the same `[data-message-id]` container, allow the selection.
4. Set `paragraphId` to the FIRST (lowest-numbered) paragraph in the selection range.
5. Capture the full `sel.toString().trim()` as `anchorText`.

Updated logic in `useTextSelection.ts`:
```typescript
// Allow cross-block selection within the same message
if (!anchorBlock || !focusBlock) {
  setBubble(null);
  return;
}

// Both blocks must be in the same message
const anchorMessage = anchorBlock.closest('[data-message-id]');
const focusMessage = focusBlock.closest('[data-message-id]');
if (!anchorMessage || !focusMessage || anchorMessage !== focusMessage) {
  setBubble(null);
  return;
}

const messageId = anchorMessage.getAttribute('data-message-id') ?? '';

// Use the first (lowest index) paragraph as the anchor paragraph
const anchorParagraphId = anchorBlock.getAttribute('data-paragraph-id') ?? '0';
const focusParagraphId = focusBlock.getAttribute('data-paragraph-id') ?? '0';
const paragraphId = Number(anchorParagraphId) <= Number(focusParagraphId)
  ? anchorParagraphId : focusParagraphId;
```

Remove the `anchorBlock !== focusBlock` rejection. Keep the rest of the bubble positioning logic (use range.getBoundingClientRect()).

No changes needed in ActionBubble.tsx — it already passes anchorText/paragraphId/messageId through. The annotations will anchor to the first paragraph in the selection.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - apiRequest handles non-JSON responses gracefully (no uncaught parse errors)
    - handleFindSources and handleSimplify log errors to console for debugging
    - Multi-paragraph text selection across data-paragraph-id blocks within the same message shows the ActionBubble
    - Go Deeper, Find Sources, and Simplify all work with multi-paragraph selections
    - All TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix output formatting (Markdown rendering + dark mode)</name>
  <files>
    frontend/src/components/thread/MarkdownRenderer.tsx
    frontend/src/components/thread/MessageBlock.tsx
    frontend/src/components/annotations/CitationBlock.tsx
    frontend/src/components/annotations/SimplificationBlock.tsx
  </files>
  <action>
Fix Markdown rendering and layout issues:

**3a. MarkdownRenderer dark mode prose classes**

Current: `<div className="prose prose-slate max-w-none text-slate-900">` (line 134).

This uses light-mode colors hardcoded. The app uses dark mode by default (Phase 06-02 decision: dark is default).

Fix: Update prose classes to be dark-mode-aware:
```
prose prose-slate dark:prose-invert max-w-none
```

Remove the hardcoded `text-slate-900` — let Tailwind prose handle text color. `prose-invert` flips all prose colors for dark mode.

Also ensure the wrapper div does NOT set a background that conflicts with the message bubble's own background.

**3b. MessageBlock bubble styling for dark mode**

Current AI bubble: `bg-white text-slate-900 border border-slate-200 shadow-sm` (line 53).

For dark mode this should be:
```
bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-zinc-700 shadow-sm
```

Current user bubble: `bg-blue-600 text-white` — this works in both modes.

**3c. Inline code styling for dark mode**

Current inline code in MarkdownRenderer (line 175): `bg-slate-100 text-slate-800`.

Fix: Add dark variants: `bg-slate-100 dark:bg-zinc-700 text-slate-800 dark:text-slate-200`.

**3d. Pending/error annotation blocks dark mode**

The shimmer block (line 110) uses `border-slate-200 bg-slate-50` — add dark variants:
```
border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800
```
Shimmer bars: `bg-slate-300` -> `bg-slate-300 dark:bg-zinc-600`.

Error block (line 120): `border-red-200 bg-red-50` -> `border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950`.
Error text: `text-red-600` -> `text-red-600 dark:text-red-400`.

**3e. Prose element spacing and overflow**

Ensure `max-w-none` on the prose div prevents text from being cut off. Add `overflow-hidden` on the outer message bubble div to prevent long code blocks from overflowing. Specifically on the AI bubble div, add `overflow-hidden` so code blocks with horizontal scroll don't break the layout.

Also ensure the MarkdownRenderer prose div has `break-words` or `overflow-wrap: anywhere` for very long URLs/strings:
```
prose prose-slate dark:prose-invert max-w-none break-words
```

**3f. Table rendering**

The `pre` and `table` block tags have `data-paragraph-id` but no custom component overrides for table rendering. Tables rendered by `remarkGfm` should get proper styling. Add a `table` component override:
```tsx
table({ children, ...props }) {
  const n = getPId(props);
  return (
    <>
      <div className="overflow-x-auto">
        <table {...props} className="min-w-full">{children}</table>
      </div>
      {annotationsAfter(n)}
    </>
  );
},
```

Also add `pre` override for annotation support on code blocks:
```tsx
pre({ children, ...props }) {
  const n = getPId(props);
  return (
    <>
      <pre {...props} className="overflow-x-auto">{children}</pre>
      {annotationsAfter(n)}
    </>
  );
},
```
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - MarkdownRenderer uses dark:prose-invert for automatic dark mode text colors
    - AI message bubbles have dark mode background/border/text variants
    - Inline code, shimmer blocks, and error blocks have dark mode variants
    - Long code blocks don't overflow the message bubble (overflow-hidden/overflow-x-auto)
    - Tables render with horizontal scroll wrapper
    - All TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
After all three tasks:
1. `npx tsc --noEmit --project frontend/tsconfig.app.json` passes
2. `cd frontend && npx vite build` succeeds
3. Manual spot check: right-click a gutter pill -> Delete shows confirm dialog that stays open -> confirm deletes thread
4. Manual spot check: select text across two paragraphs -> ActionBubble appears -> Find Sources / Simplify work
5. Manual spot check: AI responses have readable text in dark mode with proper code block styling
</verification>

<success_criteria>
- Thread delete shows confirm dialog and works end-to-end (store + DB)
- Summarize creates a new child thread with conversation summary
- Compact replaces thread content with summary and removes child threads
- Find Sources returns citation results (or shows meaningful error)
- Simplify returns rewritten text (or shows meaningful error)
- Multi-paragraph selection shows ActionBubble with all actions
- Markdown renders with proper dark mode colors, code blocks don't overflow
- TypeScript compiles and Vite build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/9-fix-thread-ops-inline-annotations-multi-/9-SUMMARY.md`
</output>
