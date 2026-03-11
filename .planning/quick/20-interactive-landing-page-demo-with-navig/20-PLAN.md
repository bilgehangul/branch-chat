---
phase: quick-20
plan: 20
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/demo/demoData.ts
  - frontend/src/components/demo/DemoThreadView.tsx
  - frontend/src/components/demo/DemoAppShell.tsx
  - frontend/src/components/demo/DemoChat.tsx
  - frontend/src/App.tsx
autonomous: true
requirements: [QUICK-20]

must_haves:
  truths:
    - "Unauthenticated visitor sees the real app layout with sidebar, breadcrumbs, ancestor peek panels, gutter pills, and message list"
    - "Visitor can click gutter pills to navigate into child/grandchild threads and use breadcrumbs to go back"
    - "Find Sources citation block and Simplify annotation block are visible and expandable in the demo"
    - "Context card shows parent context when viewing a child thread"
    - "Sidebar shows hierarchical thread tree for the demo session"
    - "Chat input is disabled with a Sign in to start chatting CTA"
    - "All interactive navigation works (thread switching, breadcrumbs, sidebar tree, gutter pills) without API calls"
  artifacts:
    - path: "frontend/src/components/demo/demoData.ts"
      provides: "Rich demo data with 3-depth thread hierarchy (root, child, grandchild), annotations, childLeads"
    - path: "frontend/src/components/demo/DemoThreadView.tsx"
      provides: "ThreadView replacement using real MessageList, GutterColumn, ContextCard without auth/streaming"
    - path: "frontend/src/components/demo/DemoAppShell.tsx"
      provides: "AppShell replacement with real sidebar, breadcrumbs, ancestor peek panels for demo mode"
    - path: "frontend/src/App.tsx"
      provides: "Hydrates Zustand store with demo data for unauthenticated visitors"
  key_links:
    - from: "frontend/src/App.tsx"
      to: "useSessionStore.hydrateSession"
      via: "Populates store with demo threads/messages on mount when not signed in"
      pattern: "hydrateSession.*DEMO"
    - from: "frontend/src/components/demo/DemoThreadView.tsx"
      to: "MessageList, GutterColumn, ContextCard"
      via: "Renders real components reading from hydrated Zustand store"
      pattern: "import.*MessageList|GutterColumn"
    - from: "frontend/src/components/demo/DemoAppShell.tsx"
      to: "BreadcrumbBar, AncestorPeekPanel, SessionHistory"
      via: "Renders real layout components reading from hydrated Zustand store"
      pattern: "import.*BreadcrumbBar|AncestorPeekPanel"
---

<objective>
Replace the static DemoChat landing page with an interactive demo that uses the REAL app components (MessageList, GutterColumn, BreadcrumbBar, AncestorPeekPanel, SessionHistory, ContextCard) populated with pre-loaded demo data in the Zustand store.

Purpose: Visitors see the actual app experience -- navigating threads, expanding annotations, clicking gutter pills -- convincing them to sign in.
Output: Interactive landing page demo using real components with 3-depth thread hierarchy, annotations, and full navigation.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/demo/DemoChat.tsx (current static demo -- will be replaced)
@frontend/src/components/demo/demoData.ts (current demo data -- will be expanded)
@frontend/src/App.tsx (renders DemoChat for unauth users -- will switch to DemoAppShell)
@frontend/src/components/layout/AppShell.tsx (real app shell -- DemoAppShell mirrors this)
@frontend/src/components/thread/ThreadView.tsx (real thread view -- DemoThreadView is simplified version)
@frontend/src/store/sessionStore.ts (hydrateSession used to seed demo data)
@frontend/src/components/thread/MessageList.tsx (reused directly in demo)
@frontend/src/components/thread/ContextCard.tsx (reused directly in demo)
@frontend/src/components/branching/GutterColumn.tsx (reused directly in demo)
@frontend/src/components/layout/BreadcrumbBar.tsx (reused directly in demo)
@frontend/src/components/layout/AncestorPeekPanel.tsx (reused directly in demo)
@frontend/src/components/history/SessionHistory.tsx (reused directly in demo)

<interfaces>
<!-- Key store method for hydrating demo data -->
From frontend/src/store/sessionStore.ts:
```typescript
hydrateSession: (data: {
  session: { id: string; createdAt: number };
  threads: Record<string, Thread>;
  messages: Record<string, Message>;
  activeThreadId: string | null;
}) => void;
```

From frontend/src/components/thread/MessageList.tsx:
```typescript
interface MessageListProps {
  messages: Message[];
  thread: Thread;
  onTryAnother?: (messageId: string, annotationId: string, anchorText: string, paragraphId: string, mode: SimplifyMode) => void;
  pendingAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string } | null;
  errorAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string; retryFn: () => void } | null;
}
```

From frontend/src/components/layout/AppShell.tsx:
```typescript
// Layout: sidebar (SessionHistory) | ancestor peek panels | main (header+BreadcrumbBar+ThreadView)
// SessionHistory reads threads/messages from store via useSessionStore
// BreadcrumbBar reads from store, calls setActiveThread on click
// AncestorPeekPanel takes thread, allMessages, highlightMessageId, width, onClick, onNavigate
```

From frontend/src/contexts/AuthContext.tsx:
```typescript
export function useAuth(): AuthContextValue;
// ThreadView calls useAuth() for getToken -- DemoThreadView must NOT call useAuth
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Expand demo data and create DemoThreadView</name>
  <files>
    frontend/src/components/demo/demoData.ts
    frontend/src/components/demo/DemoThreadView.tsx
  </files>
  <action>
**demoData.ts** -- Rewrite with photosynthesis topic and 3-depth hierarchy:

1. **Root thread** ("How does photosynthesis work?") with 4 messages:
   - msg-1: User asks about photosynthesis
   - msg-2: AI explains with multiple paragraphs covering light reactions and Calvin cycle. Include:
     - A `source` annotation on the paragraph about chlorophyll (paragraphIndex matching the paragraph that mentions it) with 3 realistic SourceResults (links to Khan Academy, Nature Education, etc.) and a citationNote
     - A `simplification` annotation (type: 'analogy') on the paragraph about electron transport chain with a replacementText analogy
     - A code block showing the chemical equation (use a markdown code block in content)
     - A childLead on the paragraph about "light reactions" pointing to child-thread-1
     - A childLead on the paragraph about "Calvin cycle" pointing to child-thread-2
   - msg-3: User asks follow-up about why leaves are green
   - msg-4: AI explains chlorophyll absorption spectrum

2. **Child thread 1** ("light reactions", depth 1, accentColor '#E8AA14'):
   - parentThreadId: root, parentMessageId: msg-2, anchorText: "light reactions"
   - msg-c1: User asks to break down light reactions step by step
   - msg-c2: AI explains photosystem I and II with detail
     - childLead on paragraph about "ATP synthase" pointing to grandchild-thread-1
   - childThreadIds includes grandchild-thread-1

3. **Child thread 2** ("Calvin cycle", depth 1, accentColor '#97CC04'):
   - parentThreadId: root, parentMessageId: msg-2, anchorText: "Calvin cycle"
   - msg-c3: User asks how CO2 is fixed
   - msg-c4: AI explains carbon fixation by RuBisCO

4. **Grandchild thread** ("ATP synthase", depth 2, accentColor '#F45D01'):
   - parentThreadId: child-thread-1, parentMessageId: msg-c2, anchorText: "ATP synthase"
   - msg-g1: User asks how ATP synthase works
   - msg-g2: AI explains the rotary motor mechanism

Export: `DEMO_SESSION`, `DEMO_THREADS` (Record<string, Thread>), `DEMO_MESSAGES` (Record<string, Message>), `DEMO_ROOT_THREAD_ID`, `DEMO_CHILD_THREAD_ID`

Root thread's `childThreadIds` should include both child-thread-1 and child-thread-2. All messageIds arrays must list their message IDs in order. Thread titles should be max 35 chars.

**DemoThreadView.tsx** -- Simplified ThreadView that does NOT call useAuth or useStreamingChat:

```typescript
export function DemoThreadView({ onSignInClick }: { onSignInClick: () => void })
```

Implementation:
- Read from Zustand store: threads, messages, activeThreadId, setScrollPosition, setActiveThread, deleteThread
- Derive activeThread and orderedMessages from store (same pattern as real ThreadView)
- Use refs: scrollRef, contentWrapperRef, bottomAnchorRef
- Include slide transition logic (isTransitioning state, useEffect on activeThreadId change)
- Include scroll position save/restore (same useEffect pattern as real ThreadView)
- Render the REAL components:
  - `<MessageList messages={orderedMessages} thread={activeThread} pendingAnnotation={null} errorAnnotation={null} />` (onTryAnother is a no-op that calls onSignInClick)
  - `<GutterColumn wrapperRef={contentWrapperRef} activeThread={activeThread} threads={threads} messages={messages} onNavigate={setActiveThread} onDeleteThread={() => {}} onSummarize={async () => {}} onCompact={async () => {}} />`
  - ContextCard is rendered by MessageList automatically
- Replace ChatInput with a disabled CTA footer:
  ```
  <footer> with disabled textarea placeholder="Sign in to start your own conversation..."
  and a "Sign in to start chatting" button that calls onSignInClick
  </footer>
  ```
- Do NOT import useAuth, useStreamingChat, useTextSelection, ActionBubble, searchSources, simplifyText, or any API modules
- Do NOT show ActionBubble (text selection is disabled in demo -- the static action bubble showcase from the old DemoChat is not needed since users can see it when they sign in)
- The `hasChildThreads` check for right padding on the slide wrapper should work the same as ThreadView

Style the disabled footer to match the existing app's ChatInput area but clearly indicate demo mode.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - demoData.ts exports DEMO_SESSION, DEMO_THREADS (5 threads across 3 depths), DEMO_MESSAGES (10+ messages) with annotations and childLeads
    - DemoThreadView.tsx renders real MessageList, GutterColumn from store without auth/streaming dependencies
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Create DemoAppShell and wire into App.tsx</name>
  <files>
    frontend/src/components/demo/DemoAppShell.tsx
    frontend/src/components/demo/DemoChat.tsx
    frontend/src/App.tsx
  </files>
  <action>
**DemoAppShell.tsx** -- Mirrors AppShell layout but for unauthenticated demo mode:

```typescript
export function DemoAppShell({ onSignInClick }: { onSignInClick: () => void })
```

Implementation -- mirror the structure of `AppShell.tsx` (read it carefully):

1. **Sidebar** (left, same styling as AppShell sidebar):
   - "Chats" header matching AppShell
   - NO "+ New Chat" button (or make it call onSignInClick)
   - Render `<SessionHistory>` with:
     - `sessions={[{ id: DEMO_SESSION.id, title: 'How does photosynthesis work?', createdAt: DEMO_SESSION.createdAt, messageCount: 4 }]}`
     - `onLoadSession={() => {}}` (no-op, only one session)
     - `currentSessionId={DEMO_SESSION.id}`
     - `threads={threads}` (from useSessionStore)
     - `onNavigateThread={setActiveThread}` (from useSessionStore -- this enables clicking child threads in sidebar)
     - `activeThreadId={activeThreadId}` (from useSessionStore)
     - `onRenameSession={() => {}}` and `onDeleteSession={() => {}}` (no-ops)
   - Include the resizable sidebar drag handle using `useResizableSidebar` hook

2. **Ancestor peek panels** (same logic as AppShell):
   - Use `selectThreadAncestry` from selectors
   - Map over ancestors (excluding current), render `<AncestorPeekPanel>` for each
   - Width calculation: same as AppShell (distFromParent === 0 ? 180 : distFromParent === 1 ? 110 : 68)
   - onClick navigates via setActiveThread
   - onNavigate={setActiveThread}, onDelete/onSummarize/onCompact are no-ops

3. **Main content area**:
   - Header with `<BreadcrumbBar />` (reads from store, fully functional)
   - `<ThemeToggle />` (works without auth)
   - "Sign in" button (calls onSignInClick) instead of user name + sign out
   - `<DemoThreadView onSignInClick={onSignInClick} />` in the main area

Do NOT render NetworkBanner or AuthExpiredBanner (not relevant for demo).

**DemoChat.tsx** -- Keep the file but it can be simplified or left as-is since it will no longer be imported by App.tsx. Actually, DELETE the old content and replace with a re-export or redirect comment, OR just leave it untouched (App.tsx will stop importing it). Best approach: leave DemoChat.tsx unchanged -- it costs nothing and could serve as fallback.

**App.tsx** -- Update the unauthenticated branch:

1. Add imports: `DemoAppShell`, `DEMO_SESSION`, `DEMO_THREADS`, `DEMO_MESSAGES`, `DEMO_ROOT_THREAD_ID` from demo modules
2. Add a `useEffect` that runs when `!isSignedIn`:
   - Call `useSessionStore.getState().hydrateSession({ session: DEMO_SESSION, threads: DEMO_THREADS, messages: DEMO_MESSAGES, activeThreadId: DEMO_ROOT_THREAD_ID })`
   - This seeds the Zustand store with demo data so all real components read from it
   - Use a ref or check to avoid re-hydrating on every render
3. In the `!isSignedIn` return block, replace `<DemoChat onSignInClick={...} />` with `<DemoAppShell onSignInClick={() => setIsModalOpen(true)} />`
4. Keep the `<SignInModal>` overlay
5. IMPORTANT: The existing `clearSession` useEffect already clears the store on sign-out, which is fine. When the user signs in, the `initSession` useEffect will hydrate with real data, overwriting the demo data.
6. IMPORTANT: When user signs OUT, the clearSession fires, then on next render `!isSignedIn` is true, and the demo hydration useEffect should re-seed the store. Use a dependency on `isSignedIn` to trigger re-hydration.

Guard against hydrating while signed in -- the useEffect should only hydrate when `!isSignedIn` and the store is empty (no session).
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30 && npx vite build --config frontend/vite.config.ts 2>&1 | tail -10</automated>
  </verify>
  <done>
    - DemoAppShell renders full app layout (sidebar with thread tree, ancestor peek panels, breadcrumbs, DemoThreadView) for unauthenticated visitors
    - App.tsx hydrates Zustand store with demo data when not signed in
    - Clicking threads in sidebar navigates (setActiveThread) -- breadcrumbs update, ancestor peek panels appear
    - Clicking gutter pills navigates to child threads
    - Annotations (citation block, simplification block) are visible and expandable
    - Chat input is disabled with sign-in CTA
    - TypeScript compiles and Vite builds without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit --project frontend/tsconfig.app.json` -- no type errors
2. `npx vite build --config frontend/vite.config.ts` -- production build succeeds
3. Manual: visit the app while signed out. Verify:
   - Sidebar shows "How does photosynthesis work?" session with nested child threads
   - Root thread messages display with annotations (citation block, simplification block)
   - Clicking a gutter pill navigates to child thread; breadcrumbs update
   - Clicking breadcrumb navigates back to parent
   - Ancestor peek panel appears when viewing child/grandchild threads
   - Chat input is disabled with "Sign in" CTA
   - Signing in clears demo and loads real session
</verification>

<success_criteria>
- Unauthenticated landing page uses real app components (MessageList, GutterColumn, BreadcrumbBar, AncestorPeekPanel, SessionHistory) with pre-populated demo data
- 3-depth thread hierarchy (root -> 2 children -> 1 grandchild) is fully navigable
- All navigation works: sidebar tree, gutter pills, breadcrumbs, ancestor peek panels
- Annotations visible and expandable (citation block with sources, simplification block with analogy)
- No API calls made in demo mode
- TypeScript and Vite build clean
</success_criteria>

<output>
After completion, create `.planning/quick/20-interactive-landing-page-demo-with-navig/20-SUMMARY.md`
</output>
