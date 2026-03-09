# Phase 3: Core Thread UI - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the working chat interface: message rendering (GFM Markdown + syntax highlighting), streaming AI responses, the input bar, and all navigation chrome (breadcrumb bar, left spine strip). Root thread is fully functional with multi-turn conversation. Navigation chrome is present and clickable but child thread navigation only activates once Phase 4 creates threads. No branching, no gutter pills, no inline actions — those are Phase 4 and 5.

</domain>

<decisions>
## Implementation Decisions

### Message layout
- Full-width messages — no left/right chat bubbles
- User messages: slightly lighter background (zinc-800 tint) with a small "You" role label above
- AI messages: default zinc-900 background with a small "Gemini" role label above
- No timestamps shown on messages (adds noise without value for a research tool)
- Generous spacing: 32px between message blocks
- Role labels are small, muted (zinc-400 or similar), positioned above their message block

### Input bar
- Auto-expanding textarea: grows from 1 line up to ~4 lines, then scrolls internally
- Send button only — Enter key inserts a newline (not submit). User must click Send.
- Placeholder text: "Ask anything..."
- During streaming: input is disabled, send button changes to a Stop button (user can abort the stream)
- After stream ends or Stop pressed: input re-enables normally

### Streaming visual feedback
- Pre-first-token (latency gap): animated typing dots (...) appear in the AI message area
- During streaming: blinking underscore (`_`) at the end of the last streamed token
- Text selection disabled (CHAT-06): message renders at ~80% opacity during streaming, returns to full opacity when complete
- Auto-scroll behavior: follows new tokens only if the user is already at the bottom of the thread view; stops auto-scrolling if user has scrolled up

### Navigation chrome
- Breadcrumb bar: chevron-separated path — `Root > Thread Title > Child Title`
- Root thread breadcrumb label: first few words of the first user message (generic placeholder until first message is sent, e.g. "New Chat")
- Breadcrumb ancestors are clickable — navigate with slide-left transition
- Overflow: middle crumbs collapse to `...`; clicking `...` shows dropdown of full path (NAV-03)
- Left spine strip (28px): shows colored left border in thread accent color + parent thread title rotated 90° vertically along the strip
- Spine is visible at thread depth ≥ 1 only; clicking navigates to parent with slide-left transition
- Slide transitions: 200ms ease-out directional — no extra visual flourishes (no breadcrumb flash, no fade)

### Claude's Discretion
- Exact role label typography (font size, weight, margin)
- Markdown rendering library choice (react-markdown, marked, etc.) and syntax highlighting library (prism, highlight.js, shiki)
- Code block color scheme for dark mode
- Exact opacity value for streaming disabled state (~80% guideline)
- Stop button visual design (icon, color)
- Empty state shown before user sends first message

</decisions>

<specifics>
## Specific Ideas

- The blinking underscore streaming cursor should feel terminal-style — consistent with the research/document aesthetic
- The spine strip vertical text should be readable at 28px width — may need to be truncated to fit
- The "Send button only" decision is intentional: this is a research tool where users often write multi-paragraph prompts, not quick one-liners

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/layout/AppShell.tsx`: Shell skeleton with 3 placeholder slots — header (breadcrumb), main (thread/messages), footer (input bar). Phase 3 fills all three.
- `frontend/src/api/chat.ts`: SSE streaming client already built with fetch+ReadableStream — Phase 3 creates `useStreamingChat` hook to wire it to Zustand
- `frontend/src/store/sessionStore.ts`: `addMessage`, `updateMessage`, `setMessageStreaming` all implemented and ready to use
- `frontend/src/store/selectors.ts`: `currentThread`, `threadAncestry`, `isAtMaxDepth` selectors available

### Established Patterns
- Dark theme: zinc-900 background, zinc-100 text, zinc-800 borders (established in AppShell)
- Font: Inter body, JetBrains Mono code (from PROJECT.md — add via npm or CDN)
- Zustand v5 curried `create<SessionState>()()` pattern — follow existing store pattern
- SSE: streams token chunks, ends with `data: [DONE]\n\n` — existing chat.ts handles this

### Integration Points
- `AppShell.tsx` header slot → BreadcrumbBar component
- `AppShell.tsx` main slot → ThreadView component (message list + auto-scroll)
- `AppShell.tsx` footer slot → ChatInput component
- `App.tsx` renders AppShell for `<SignedIn>` state — session must be initialized (`createSession`) when user signs in
- `useAuth().userId` from Clerk passed to `createSession(userId)` on sign-in

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-core-thread-ui*
*Context gathered: 2026-03-09*
