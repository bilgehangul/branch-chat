# Phase 4: Branching - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable text selection on any AI response text, show a floating action bubble, and let users "Go Deeper" to create a child thread anchored to the selected paragraph. Build right-gutter lead pills showing where branches originated. Find Sources and Simplify buttons appear in the bubble but are NOT wired (Phase 5). Navigation (breadcrumbs, spine) already works — this phase creates the threads those components navigate between.

</domain>

<decisions>
## Implementation Decisions

### Action bubble
- Icon + text label for each button — clearest UX, no ambiguity
- **Go Deeper is primary**: accent color treatment (blue highlight), visually dominant
- Find Sources and Simplify are secondary: muted/ghost style — present but clearly subordinate
- Positioned 8px above the top-right corner of the selection (per BRANCH-02)
- Dismisses immediately on any click outside; selection is cleared on dismiss
- Bubble appears within 100ms of releasing the mouse after a valid selection

### Gutter column
- The 200px right gutter is **NOT always present** — it appears only when the first child branch is created
- Before any branches exist: content column fills the full available width (no reserved gutter space)
- After first branch: gutter column appears alongside the content column with the lead pill
- Layout reflow is acceptable on first branch creation

### Accent color palette
- **Muted/pastel tones** — 8 colors that don't compete with text content
- Suggested palette (Claude's discretion on exact hex): dusty rose, sage green, soft lavender, warm amber, slate blue, muted teal, peach, dusty mauve
- Colors cycle in creation order (first child = color 1, second = color 2, etc.)
- Colors are used for: left spine strip border, breadcrumb active crumb, anchor paragraph underline, lead pill pip, child thread accent throughout

### Selection scope
- **Any rendered text is selectable** — prose paragraphs AND code blocks AND list items AND table cells
- Selection is still capped to one paragraph/block (the block where the drag began)
- Code block selections result in the code snippet as anchor text — this is valid and expected

### Child thread context propagation
- **System prompt injection**: when the backend receives a chat request for a child thread (depth ≥ 1), the system prompt is prefixed with:
  `"You are in a focused sub-conversation about: [anchor text]. Context from parent message: [first ~200 chars of parent message]. Stay focused on this specific topic unless the user redirects."`
- The anchor text and parent message excerpt are sent from the frontend as part of the chat request payload
- This keeps AI responses relevant and avoids the AI losing track of why the child thread was created
- The backend's existing `systemInstruction` config field is used for this injection — no new API surface needed

### Depth limit
- Thread depth max is 4 (0–4), locked in store as `MAX_THREAD_DEPTH = 4`
- "Go Deeper" button in the bubble is disabled at depth 4 with a tooltip: "Maximum depth reached"
- Find Sources and Simplify remain enabled at any depth (Phase 5 will wire them)

### Claude's Discretion
- Exact hex values for the 8-color muted palette
- Lead pill hover preview card layout (anchor text + first exchange preview)
- Exact paragraph/block boundary detection implementation (data-paragraph-id strategy)
- Colored underline implementation (CSS text-decoration vs border-bottom vs pseudo-element)

</decisions>

<specifics>
## Specific Ideas

- The context propagation decision is critical to the product's value — a child thread that doesn't know why it was created defeats the purpose. The system prompt injection should be concise but specific.
- Muted palette keeps the visual chrome from overwhelming the actual content — this is a research tool, not a color demo
- "Go Deeper is primary" reflects the core product value proposition — it should be obvious that branching is the main action

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/store/sessionStore.ts`: `createThread`, `addChildLead`, `setActiveThread` all implemented and ready
- `frontend/src/types/index.ts`: `ChildLead { threadId, paragraphIndex, anchorText, messageCount }`, `Thread.accentColor`, `MAX_THREAD_DEPTH = 4`
- `frontend/src/store/selectors.ts`: `isAtMaxDepth` selector already checks depth < 4
- `frontend/src/components/thread/ThreadView.tsx`: slide transition (200ms ease-out) already implemented — child thread navigation will reuse this
- `frontend/src/components/thread/MessageBlock.tsx`: renders individual messages — needs `data-paragraph-id` attributes added to enable selection anchoring
- `frontend/src/components/layout/BreadcrumbBar.tsx`, `SpineStrip.tsx`: already read `accentColor` from thread — will automatically pick up child thread accent colors

### Established Patterns
- Zustand flat store: `threads[id]`, `messages[id]` — `createThread` returns new thread ID
- Dark theme: zinc-900/800/700 backgrounds (established)
- Slide transitions: Tailwind `transition-transform duration-200 ease-out` (established in ThreadView)
- `useAuth().getToken` passed as function parameter into API modules (established pattern)

### Integration Points
- `MessageBlock.tsx` → needs `data-paragraph-id` on each rendered paragraph for selection tracking
- `useStreamingChat.ts` → needs `systemInstruction` parameter derived from thread ancestry for child threads
- `backend/src/routes/chat.ts` → already accepts `systemInstruction` via config; frontend must pass it for child threads
- New `ActionBubble` component listens for `mouseup` on the message container, reads `window.getSelection()`
- New `GutterColumn` component renders lead pills, only mounts when `thread.childThreadIds.length > 0`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-branching*
*Context gathered: 2026-03-09*
