# Architecture Patterns

**Domain:** Branching AI chat interface (DeepDive Chat)
**Researched:** 2026-03-08
**Confidence:** HIGH — derived from project spec + well-established React/Zustand/SSE patterns

---

## Recommended Architecture

### System Boundary Map

```
Browser (React + Vite)
│
├── ClerkProvider (auth context, wraps all routes)
│
├── SessionProvider (Zustand store, ephemeral, no persistence)
│   └── thread tree: root + up to 4 child generations
│
├── UI Layer
│   ├── ThreadView (active thread messages + input)
│   ├── GutterColumn (child lead pills, DOM-anchored)
│   ├── AnnotationOverlay (text selection bubble + actions)
│   ├── BreadcrumbBar (navigation path at top)
│   └── SpineStrip (depth indicator, left, depth ≥ 1)
│
└── API Client (fetch + EventSource)
    └── /api/* → backend proxy

Backend (Node.js + Express, stateless, on Render)
│
├── POST /api/chat         → SSE stream to AI provider
├── POST /api/simplify     → single-shot rewrite
├── POST /api/cite         → Tavily or Responses API search
└── Middleware: Clerk JWT validation, CORS, rate limit

External
├── Gemini 2.0 Flash (primary, via Google AI SDK)
├── Tavily (web search, when provider=gemini)
└── Clerk (auth tokens)
```

---

## Component Boundaries

### Frontend Components

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ClerkProvider` | Auth session, token vending | All protected routes |
| `useSessionStore` (Zustand) | Thread tree state, active thread pointer, mutations | Every component that reads or writes thread data |
| `ThreadView` | Renders message list for active thread, input bar, streaming state | `useSessionStore`, `useStreamingStore`, `MessageRenderer` |
| `MessageRenderer` | Renders a single message with inline annotations applied | `AnnotationLayer`, paragraph ref registration |
| `AnnotationLayer` | Applies simplify/cite mutations to paragraph text; keeps originals | `useSessionStore` (annotation records) |
| `TextSelectionBubble` | Detects selection events, shows action bubble (Go Deeper / Find Sources / Simplify) | DOM selection API, `useSelectionStore` |
| `GutterColumn` | Renders child lead pills; reads paragraph DOM positions | `useSessionStore` (child thread metadata), `useParagraphPositions` |
| `ChildLeadPill` | Pill UI, hover preview card, click→navigate | `useSessionStore.navigate(threadId)` |
| `BreadcrumbBar` | Renders ancestor path; click navigates up | `useSessionStore` (thread path) |
| `SpineStrip` | Left 28px accent-colored depth strip; click navigates to parent | `useSessionStore.activeThread.depth` |
| `ThreadTransition` | Wraps `ThreadView`, applies 200ms slide animation on navigate | `useSessionStore.activeThreadId` (key prop trigger) |
| `InputBar` | User message input, send button, disabled during streaming | `useStreamingStore.isStreaming` |

### Backend Modules

| Module | Responsibility | Communicates With |
|--------|---------------|-------------------|
| `router/chat.js` | POST handler, validates Clerk JWT, opens SSE, pipes AI stream | Gemini SDK / OpenAI SDK (via provider abstraction) |
| `router/simplify.js` | POST handler, returns single rewrite response | AI provider abstraction |
| `router/cite.js` | POST handler, runs web search, returns citations | Search provider abstraction |
| `lib/aiProvider.js` | Provider abstraction — `chat()`, `simplify()` — swaps by env var | Gemini SDK or OpenAI SDK |
| `lib/searchProvider.js` | Search abstraction — `search(query)` — swaps by env var | Tavily client or OpenAI Responses API |
| `middleware/auth.js` | Verifies Clerk JWT on every protected route | Clerk Node SDK |

---

## Zustand Store Shape

This is the most critical architectural decision. Use a **normalized flat map** for threads, not a nested tree. Nested trees cause expensive re-renders on any mutation anywhere in the tree.

```typescript
// Types

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string           // final text (or streaming accumulator)
  paragraphIds: string[]    // ordered paragraph IDs for DOM ref registration
  streaming: boolean
  annotations: Record<string, Annotation>  // keyed by paragraphId
}

interface Annotation {
  type: 'simplify' | 'cite'
  paragraphId: string
  original: string
  modified: string          // simplified text or text with citation injected
  showing: 'modified' | 'original'
  meta?: CitationMeta | SimplifyMeta
}

interface ChildLead {
  threadId: string
  anchorParagraphId: string   // which paragraph spawned this child
  title: string               // 32 char max
  accentColor: AccentColor
}

interface Thread {
  id: string
  parentId: string | null
  depth: number               // 0 = root, max 4
  accentColor: AccentColor
  title: string
  anchorText: string | null   // the selected paragraph text that created this thread
  anchorParagraphId: string | null
  messageIds: string[]        // ordered
  childLeads: ChildLead[]     // child threads spawned from this thread
}

interface SessionState {
  threads: Record<string, Thread>          // flat map
  messages: Record<string, Message>        // flat map
  rootThreadId: string | null
  activeThreadId: string | null
  streamingMessageId: string | null        // which message is currently streaming

  // Actions
  createRootThread: () => void
  createChildThread: (parentThreadId: string, anchorParagraphId: string, anchorText: string) => string
  appendStreamChunk: (messageId: string, chunk: string) => void
  finalizeStream: (messageId: string) => void
  navigate: (threadId: string) => void
  applyAnnotation: (messageId: string, annotation: Annotation) => void
  toggleAnnotation: (messageId: string, paragraphId: string) => void
  getAncestorPath: (threadId: string) => Thread[]  // for breadcrumb
}
```

**Why flat map over nested tree:**
- Any mutation (append chunk, add annotation) touches exactly two records: the message and the thread. No cascading re-renders up the tree.
- Selectors are `O(1)` lookups by ID rather than tree traversal.
- `immer` (via `zustand/middleware/immer`) handles nested object mutations within a record cleanly.

**Store slicing:** Split into two Zustand stores if performance requires it — `useSessionStore` for tree structure and navigation, `useStreamingStore` for the hot-path streaming state (chunk append). This prevents message list from re-rendering on every chunk.

```typescript
// Streaming slice (separate store or slice)
interface StreamingState {
  activeStreamId: string | null
  buffer: string              // accumulating chunks
  flush: () => void           // called on SSE close
}
```

---

## Data Flow

### 1. Root Thread Initialization

```
User loads app
  → ClerkProvider validates token
  → SessionStore.createRootThread() → sets rootThreadId + activeThreadId
  → ThreadView mounts, renders empty message list + InputBar
```

### 2. User Sends Message (Streaming)

```
User types + submits
  → InputBar calls sendMessage(content)
  → Optimistically: SessionStore adds user Message, adds assistant placeholder Message (streaming=true)
  → StreamingStore sets activeStreamId = assistantMessageId
  → fetch POST /api/chat with {messages, threadId, provider}
    → backend validates Clerk JWT
    → backend opens AI provider stream
    → backend SSE: "data: {chunk}" events
  → Browser EventSource onmessage:
    → StreamingStore.appendChunk(chunk)
    → (batched at ~60fps or on RAF): SessionStore.appendStreamChunk(messageId, buffer)
  → SSE closes (event: "done")
    → SessionStore.finalizeStream(messageId) → streaming=false, paragraphIds assigned
    → MessageRenderer re-renders with final text + paragraph refs registered
```

### 3. Text Selection → Child Thread Creation

```
User selects text in a paragraph
  → SelectionBubble detects window.getSelection(), identifies paragraphId via closest [data-paragraph-id]
  → User clicks "Go Deeper"
  → SessionStore.createChildThread(activeThreadId, paragraphId, selectedText)
    → new Thread created with depth+1, assigned accentColor from palette
    → ChildLead appended to parent thread's childLeads[]
    → activeThreadId updated to new child thread ID
  → ThreadTransition: key prop changes → CSS slide animation (200ms ease-out)
  → GutterColumn in parent (now background) retains DOM positions for lead pill anchoring
```

### 4. Paragraph DOM Position Tracking (Gutter Anchoring)

```
MessageRenderer mounts paragraphs with ref callbacks:
  → each <p data-paragraph-id="pid"> registers in useParagraphPositions(threadId)
  → useParagraphPositions stores: Record<paragraphId, { top: number }>
  → positions computed via element.getBoundingClientRect() relative to message list scroll container

GutterColumn reads:
  → childLeads from SessionStore (for active thread's parent, or any ancestor)
  → positions from useParagraphPositions(parentThreadId)
  → renders <ChildLeadPill style={{ top: positions[lead.anchorParagraphId] }} />

ResizeObserver + scroll listener on message list → re-computes positions on content layout changes
```

The position tracking must be in a **local React ref/state** (not Zustand), because it is purely presentational and tied to DOM lifecycle. Putting pixel positions in global store causes unnecessary re-renders.

### 5. Annotation Application

```
User selects text → clicks "Simplify" (mode: ELI5 / Formal / Shorter / Bullets)
  → POST /api/simplify {text, mode} (non-streaming)
  → response: { rewritten: string }
  → SessionStore.applyAnnotation(messageId, { type:'simplify', paragraphId, original, modified, showing:'modified' })
  → MessageRenderer reads annotations[paragraphId] → renders modified text
  → toggle button: SessionStore.toggleAnnotation() → flips showing field
  → annotated paragraph retains data-paragraph-id → still selectable for further actions
```

### 6. Navigation (Breadcrumb / Spine)

```
User clicks breadcrumb ancestor or spine strip
  → SessionStore.navigate(threadId)
  → activeThreadId changes
  → ThreadTransition: key prop changes → slide animation (reverse direction if going up)
  → GutterColumn recomputes for new active thread's children
  → BreadcrumbBar recomputes path via getAncestorPath(activeThreadId)
```

---

## Provider Abstraction Layer

The AI and search providers must be behind thin interfaces on the backend. This is a `config-only` swap, not a code change.

```javascript
// lib/aiProvider.js
const PROVIDER = process.env.AI_PROVIDER // 'gemini' | 'openai'

export function streamChat(messages, onChunk, onDone) {
  if (PROVIDER === 'openai') return openaiStreamChat(messages, onChunk, onDone)
  return geminiStreamChat(messages, onChunk, onDone)
}

export function simplify(text, mode) {
  if (PROVIDER === 'openai') return openaiSimplify(text, mode)
  return geminiSimplify(text, mode)
}

// lib/searchProvider.js
export function search(query) {
  if (PROVIDER === 'openai') return openaiSearch(query)   // Responses API with web_search
  return tavilySearch(query)
}
```

SSE response format must be provider-neutral on the wire. The backend normalizes both Gemini and OpenAI streaming events into:

```
data: {"type":"chunk","text":"..."}
data: {"type":"done"}
data: {"type":"error","message":"..."}
```

The frontend EventSource handler never knows which provider is active.

---

## SSE Streaming Pattern

### Backend (Express)

```javascript
router.post('/chat', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    await streamChat(req.body.messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
    }, () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
    })
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
    res.end()
  }
})
```

### Frontend (EventSource via fetch + ReadableStream)

Use `fetch` + `ReadableStream` rather than the browser `EventSource` API. Reason: `EventSource` does not support POST requests or custom headers (needed for Clerk JWT). The fetch-based approach supports both.

```typescript
async function streamChat(messages: Message[], token: string, onChunk: (text: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n\n')
    buffer = lines.pop() ?? ''   // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const event = JSON.parse(line.slice(6))
      if (event.type === 'chunk') onChunk(event.text)
      if (event.type === 'done') return
      if (event.type === 'error') throw new Error(event.message)
    }
  }
}
```

**Chunk batching:** Do not call `SessionStore.appendStreamChunk` on every chunk. Accumulate in a local ref and flush on `requestAnimationFrame` at ~60fps. This prevents Zustand triggering 30+ re-renders per second during fast model output.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Nested Thread Tree in Zustand
**What goes wrong:** Storing threads as `{ children: Thread[] }` nested objects means any mutation (appending a chunk deep in the tree) triggers re-render of all components subscribed to the root.
**Instead:** Flat map `Record<threadId, Thread>` with parentId references. Derive tree structure in selectors.

### Anti-Pattern 2: DOM Positions in Zustand
**What goes wrong:** Storing `{ paragraphId: top_px }` in the global store causes re-renders on every scroll event and layout shift.
**Instead:** Track positions in a component-local `useRef` / `useState`, computed lazily via `ResizeObserver` and scroll events scoped to the message list container.

### Anti-Pattern 3: EventSource for Authenticated Streaming
**What goes wrong:** Browser `EventSource` is GET-only, cannot send Authorization headers. Clerk JWT cannot be attached.
**Instead:** `fetch` + `ReadableStream` reader with manual SSE line parsing.

### Anti-Pattern 4: Rendering Annotations as Separate Overlay Elements
**What goes wrong:** Positioning an overlay `<div>` over paragraph text requires constant position sync with scroll and layout changes. Fragile.
**Instead:** Inline mutation — `MessageRenderer` replaces paragraph text content with annotated version based on the annotation record. Toggling flips `showing` field and re-renders in place. No positioned overlays needed for annotation text.

### Anti-Pattern 5: One Giant Zustand Store
**What goes wrong:** `useSessionStore(state => state)` or broad selectors re-render everything on any update.
**Instead:** Narrow selectors (`useSessionStore(state => state.threads[id])`) or split into two stores (session tree vs streaming hot path).

### Anti-Pattern 6: Rebuilding Thread Context on Every Message Send
**What goes wrong:** Sending only the current thread's messages loses the anchor context that spawned this thread.
**Instead:** Include the parent thread's anchor paragraph text as a system message prefix when constructing the chat context for a child thread. This keeps the child focused without sending the entire parent history.

---

## Scalability Considerations

This is a desktop-only, single-user, ephemeral-session v1 app. Scalability concerns are intentionally deferred. The relevant constraints are:

| Concern | At current scope | If persisted later |
|---------|-----------------|-------------------|
| Thread tree size | Max 5 depth, bounded by session lifetime | Need DB with adjacency list or nested set |
| Streaming connections | One at a time per session | No change — one active stream per user |
| Backend state | Stateless by design | Introduce Redis for session if needed |
| Re-render performance | Narrow Zustand selectors + chunk batching sufficient | No change needed |

---

## Build Order (Dependency Graph)

Build in this sequence. Each layer depends on the previous being stable.

### Layer 1: Backend Proxy Shell (no frontend dependency)
1. Express server scaffold on Render, CORS configured
2. Clerk JWT middleware (auth.js)
3. AI provider abstraction (aiProvider.js) — Gemini only initially
4. POST /api/chat → SSE stream, hardcoded test response first, then real Gemini
5. POST /api/simplify — single-shot
6. POST /api/cite + searchProvider.js (Tavily)

*Gate: curl /api/chat returns SSE chunks with a valid Clerk token before frontend work begins.*

### Layer 2: Frontend Foundation
7. Vite + React scaffold, Clerk auth gates, protected routes
8. Zustand session store — thread/message types, createRootThread, navigate
9. fetch-based SSE client (streamChat utility)

*Gate: Can create root thread, send message, see chunks accumulate in store.*

### Layer 3: Core Thread UI
10. ThreadView + MessageRenderer — renders message list for active thread
11. InputBar — send message, disable during streaming
12. StreamingStore + chunk batching on RAF
13. BreadcrumbBar — reads getAncestorPath(), click navigates
14. SpineStrip — shows at depth ≥ 1, click navigates to parent

*Gate: Can have a conversation in a single thread. Streaming works. Navigation UI present.*

### Layer 4: Branching
15. Text selection detection → TextSelectionBubble (position relative to viewport)
16. "Go Deeper" → createChildThread, ThreadTransition slide animation
17. GutterColumn + useParagraphPositions hook + ResizeObserver
18. ChildLeadPill rendering, anchored to paragraphId top position

*Gate: Can branch from a paragraph, slide into child, see lead pill in parent gutter, navigate back.*

### Layer 5: Inline Annotations
19. POST /api/simplify integration → AnnotationLayer, toggleAnnotation
20. POST /api/cite integration → CitationBlock component, badge rendering
21. Re-selectability of annotated paragraphs (verify data-paragraph-id survives annotation render)

*Gate: Can simplify a paragraph, toggle back, cite a claim, branch from annotated text.*

### Layer 6: Polish
22. Hover preview card on ChildLeadPill
23. Accent color palette assignment (8-color, deterministic by depth + sibling index)
24. Error states (stream failure, API errors, auth expiry)
25. Depth limit enforcement (Go Deeper disabled at depth 4)
26. Breadcrumb overflow (ellipsis for deep paths)
27. Dark/light theme
28. E2E tests (Playwright): auth, streaming, branching, annotation, navigation

---

## Key Architectural Decisions Summary

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Zustand store shape | Flat normalized maps (threads, messages) with ID references | Prevents cascade re-renders; O(1) lookups |
| Streaming client | fetch + ReadableStream with manual SSE parsing | EventSource cannot send Authorization headers |
| Chunk batching | Accumulate in ref, flush on requestAnimationFrame | Prevents 30+ renders/sec during fast model output |
| DOM position tracking | Component-local ref + ResizeObserver, not Zustand | Pixel positions are presentational, not business state |
| Annotation rendering | Inline text mutation in MessageRenderer | Eliminates fragile overlay positioning |
| Provider abstraction | Thin adapter functions in backend lib/, env-var switched | Config change only, no frontend impact |
| Thread context for child | Prepend parent anchor paragraph as system message prefix | Keeps child focused without full parent history |
| Two Zustand stores (optional) | session store + streaming store if profiling shows need | Isolates hot-path (chunk append) from tree structure |

---

## Sources

- Project spec: `.planning/PROJECT.md` — HIGH confidence (primary source)
- Zustand flat normalized state pattern: established React state management best practice, documented in Zustand README and Redux style guide (analogous principle) — HIGH confidence
- fetch + ReadableStream for SSE with auth headers: documented limitation of browser EventSource API — HIGH confidence
- requestAnimationFrame chunk batching: standard React performance technique for high-frequency updates — HIGH confidence
- ResizeObserver for DOM position tracking: W3C standard, supported in all modern browsers — HIGH confidence
