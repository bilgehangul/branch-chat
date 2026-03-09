# Domain Pitfalls

**Domain:** Branching AI chat interface with text selection, gutter annotations, SSE streaming, animated navigation
**Project:** DeepDive Chat
**Researched:** 2026-03-08
**Confidence:** HIGH (core pitfalls from well-understood APIs) / MEDIUM (Framer Motion + scroll interaction specifics)

---

## Critical Pitfalls

Mistakes that cause rewrites or major regressions.

---

### Pitfall 1: Text Selection Destroyed by DOM Mutation During Streaming

**What goes wrong:** The user selects a paragraph of AI response text while streaming is still in progress. React re-renders the message component as new tokens arrive, which replaces the DOM nodes containing the selected text. The browser's `window.getSelection()` range either becomes invalid (collapsed to zero length), silently points to stale nodes that no longer exist in the document, or throws `NotFoundError` when `range.getBoundingClientRect()` is called. The action bubble disappears or renders at position (0, 0).

**Why it happens:** React's reconciler does not preserve text nodes across re-renders even when the content looks identical — it replaces them. The Selection API holds `Node` references, not text content references. When the node is replaced, the selection range's `startContainer` and `endContainer` are detached from the live document.

**Consequences:** Action bubble flickers, appears at wrong position, or vanishes entirely mid-stream. Users who try to branch while a response is still generating get a broken experience or a no-op click.

**Prevention:**
- Freeze the message component's rendered output once a paragraph is complete. Stream tokens into a buffer; only commit full paragraphs to the rendered DOM. Never re-render a paragraph once it has been committed.
- Alternatively: disable text selection entirely while a message is actively streaming. Show a visual indicator ("Generating... selection available when complete"). Re-enable `user-select` via CSS class once `done: true` arrives on the stream.
- Do NOT attempt to save and restore selection ranges across re-renders — this is unreliable across browsers and requires serializing range offsets to text content, which breaks the moment any annotated span is inserted.

**Warning signs:**
- Action bubble appears at top-left of screen (0, 0 position)
- `getBoundingClientRect()` returns all zeros
- Console `NotFoundError` or `InvalidStateError` from Range methods
- Bubble disappears immediately after appearing during active streaming

**Phase:** v0.1 Core Shell — address before any streaming work ships to users.

---

### Pitfall 2: Action Bubble Positioning Breaks on Annotated Text Spans

**What goes wrong:** After a paragraph is annotated (simplified text replaces original, or a source citation badge is injected), the DOM structure of that paragraph changes. If the action bubble position is computed by calling `getBoundingClientRect()` on the selected range at selection time and then stored as absolute pixel values, those values become stale the moment the DOM mutates. Later re-selections on annotated text land on `<span>` nodes inside the paragraph rather than the raw text node. The range's bounding rect now reflects the span's geometry, which may differ by the height of injected citation blocks above it.

**Why it happens:** `getBoundingClientRect()` is a point-in-time snapshot. Any DOM insertion above the selected paragraph shifts everything downward. Source citation blocks (injected below paragraph) push subsequent paragraphs down, invalidating stored y-coordinates.

**Consequences:** Bubble appears at the correct position initially, then "jumps" after annotations are applied to earlier paragraphs. Users cannot reliably click the bubble.

**Prevention:**
- Never store absolute pixel coordinates. Compute bubble position on every `selectionchange` event and on every relevant DOM mutation.
- Attach a `MutationObserver` to the message container; on any childList or characterData mutation, recompute bubble position if a selection is still active.
- Use `requestAnimationFrame` to debounce position computation — never compute synchronously inside a React event handler where the DOM paint hasn't flushed yet.

**Warning signs:**
- Bubble position is correct on fresh messages but wrong on annotated ones
- Bubble is offset by exactly the height of a citation block
- Bug only reproduces after "Find Sources" action on an earlier paragraph

**Phase:** v0.2 Inline Features — specifically when Find Sources and Simplify features ship.

---

### Pitfall 3: ResizeObserver Loop on Gutter Pill Positioning

**What goes wrong:** Gutter child lead pills are positioned by reading `offsetTop` of each source paragraph and applying it as `top` CSS on the corresponding pill. This read is triggered by a `ResizeObserver` on the message container. If the ResizeObserver callback updates any CSS that affects layout (e.g., adjusting the container height, or updating a sibling element that affects flow), the browser detects a layout-affecting change during an observation callback and fires `ResizeObserver loop limit exceeded` warnings. In some cases, the observer continuously re-fires, causing a jitter loop where pills oscillate between positions.

**Why it happens:** The ResizeObserver spec prohibits callbacks from modifying layout in ways that would trigger re-observation of the same element. However, writing to a React state setter inside an observer callback causes a React re-render, which can cause layout changes that trigger the observer again. This is a common off-by-one loop pattern.

**Consequences:** Browser console floods with `ResizeObserver loop limit exceeded`. Pills visually jitter. On Firefox, the observer silently stops firing entirely after too many violations.

**Prevention:**
- Do NOT write React state directly inside a ResizeObserver callback. Instead, accumulate measurements into a ref (`measurementsRef.current = {...}`), then schedule a React state update via `setTimeout(..., 0)` or `queueMicrotask` to break the synchronous observation chain.
- Observe the message content container, not the pill container itself. The pill container is downstream of the measurement — observing it creates the loop.
- Use `IntersectionObserver` as a secondary signal for "something scrolled or was added" rather than driving layout from ResizeObserver alone.
- Provide a single `positionAllPills()` function that reads all `offsetTop` values in one pass (read phase), then writes all `top` values in one pass (write phase). Never interleave reads and writes.

**Warning signs:**
- "ResizeObserver loop limit exceeded" in the browser console
- Pills flicker rapidly between two positions
- Observer fires hundreds of times per second according to Performance tab
- Bug only occurs when there are 2+ child leads in the same parent thread

**Phase:** v0.1 Core Shell — gutter pills are part of the first ship. Must be validated before v0.2 adds more annotation types that change paragraph heights.

---

### Pitfall 4: Zustand Store Mutability — Nested Tree State Breaks React Reactivity

**What goes wrong:** The thread tree is a nested object: `{ threads: { [id]: { messages: [...], children: [id, ...] } } }`. Developers update child arrays or message arrays by pushing directly into the existing array reference (`state.threads[id].messages.push(newMsg)`). Because Zustand detects changes by reference equality, subscribers that depend on `threads[id].messages` do not re-render — the array reference is the same object even though its contents changed. The UI freezes mid-stream with no new tokens appearing.

**Why it happens:** Zustand's default `set` mechanism works by shallow-merging the top-level state object. Deeply nested mutations that don't change top-level reference won't trigger selectors that aren't watching the mutated subtree. Even with `immer` middleware, forgetting to actually use the draft proxy and instead calling `.push()` on the original (non-draft) array bypasses immer's structural sharing.

**Consequences:** Streaming tokens don't appear in the UI even though the backend is sending them. State is silently corrupted — the store has the correct data but React components don't know about it. Only a full page reload reveals the correct state.

**Prevention:**
- Use Zustand `immer` middleware from day one. Apply it at store initialization, not added later.
- Enforce a rule: all state updates happen through explicitly named actions. No inline `set(state => { state.threads[id].messages.push(...) })` without the immer draft pattern.
- For streaming specifically: accumulate streamed tokens in a `streamBuffer` ref (outside Zustand), and batch-commit to the store at intervals (every 50ms or per-chunk) using a single `set()` call that replaces the entire message content string — never appends to an existing string in place.
- Write a unit test for the store that verifies selector re-renders on message append. Add this test before writing any streaming code.

**Warning signs:**
- React DevTools shows no re-renders on a component that should be updating
- Store state (visible in Zustand DevTools) is correct but UI is stale
- Bug disappears when adding `console.log` (which triggers re-evaluation) but reappears without it
- Bug only occurs during streaming, not on static messages

**Phase:** v0.1 Core Shell — must be solved at store design time. Retrofitting Zustand store shape mid-project is expensive.

---

### Pitfall 5: SSE Streaming Re-Renders Degrading to O(n²) as Message Grows

**What goes wrong:** Each SSE chunk triggers a Zustand `set()`, which updates the `content` string for the active streaming message. If the message component re-renders on every chunk (which it will, as the content changes), and if the component renders all previous messages in the thread on each render, render cost grows linearly with chunk count. For a long response (500+ tokens), this creates noticeable jank after the first few seconds of streaming.

**Why it happens:** React's default reconciliation re-runs component render functions. If `Thread` renders `[...messages].map(...)` and `messages` is the selector result, every chunk invalidates the selector and re-renders the entire list. Message components that aren't the active streaming one should never re-render during streaming — but they will if they aren't memoized.

**Consequences:** The browser's main thread is saturated during streaming. Scroll position jumps unpredictably. Framer Motion animations stutter. CPU usage spikes. On low-end hardware, the tab becomes unresponsive.

**Prevention:**
- Memoize every `Message` component with `React.memo`. Use a stable `id` prop for the key.
- Separate the streaming message from the historical messages list in the store selector. Create a `useStreamingMessage(threadId)` selector that only subscribes to the current streaming message content. Historical message components subscribe only to `messages.length`, not message content.
- Consider streaming into a DOM ref (`textareaRef.current.textContent += token`) for the visible streaming display, and only committing to Zustand state when the stream completes. This keeps streaming out of React's reconciler entirely.
- Throttle Zustand `set()` calls to a maximum of 30 per second using a timestamp check, regardless of SSE chunk frequency.

**Warning signs:**
- Chrome Performance tab shows long tasks (>50ms) during streaming
- Frame rate drops below 30fps while streaming is active
- Non-streaming messages visually flash/re-render (visible with React DevTools "Highlight updates")
- `useEffect` cleanup in old message components runs during streaming (sign of unnecessary unmount/remount)

**Phase:** v0.1 Core Shell — streaming is the first major feature. Performance must be validated with a long response (1000+ tokens) before v0.1 ships.

---

### Pitfall 6: Framer Motion Slide Transitions Clobber Scroll Position

**What goes wrong:** Thread navigation uses a slide-left / slide-right transition powered by Framer Motion `AnimatePresence`. When the user navigates back to a parent thread, the scroll position in that thread should restore to the paragraph that spawned the current child (i.e., where the child lead pill is). Instead, the scroll position is either: (a) reset to 0 by the animation, (b) set before the element has been re-mounted and its layout calculated, or (c) the Framer Motion exit animation of the departing thread causes a layout shift that changes the scroll target's `offsetTop` value mid-animation.

**Why it happens:** `AnimatePresence` keeps both the entering and exiting component in the DOM simultaneously during the transition (so both can animate). If scroll position is restored via `element.scrollIntoView()` in a `useEffect`, that effect may fire while the exiting thread is still in the DOM, causing layout measurements to be wrong. Additionally, Framer Motion applies CSS transforms (translate) to animating elements, which creates new stacking contexts and can cause `getBoundingClientRect()` to return transform-adjusted coordinates that don't match the final resting position.

**Consequences:** User navigates back to parent thread; the view scrolls to the wrong paragraph, or snaps to top, or overshoots the target. The core UX value proposition (returning to your exact place) is broken.

**Prevention:**
- Do not use `element.scrollIntoView()` from `useEffect` for scroll restoration during transitions. Instead, set scroll position in the animation's `onAnimationComplete` callback, after the entering thread has settled and the exiting thread has unmounted.
- Use a Zustand `scrollTargetRef` that stores the DOM `ref` of the target paragraph — don't store a pixel offset that becomes stale during animation.
- Apply Framer Motion transitions only to the `x` axis (slide). Do not animate `opacity` or `height` on the thread container — these affect layout and create measurement errors.
- Test scroll restoration with a parent thread that has more content than fits the viewport.

**Warning signs:**
- Scroll restoration works correctly when the animation duration is set to 0 but fails at normal speed
- `scrollIntoView()` fires before the exit animation completes (check with console timing)
- The restored scroll position is off by the height of the exiting thread's last rendered state
- Bug only occurs on deep navigation (depth 2+), not on the first child

**Phase:** v0.1 Core Shell — navigation is part of the first ship. Must be tested with a realistic thread tree before v0.1 complete.

---

### Pitfall 7: Clerk JWT Validation Added as Middleware but Not Enforced on All Routes

**What goes wrong:** The Clerk backend JWT validation is wired up as Express middleware, but it is applied selectively (e.g., only to `/api/chat`) and forgotten on `/api/stream`, `/api/sources`, or `/api/simplify` routes added later. Or the middleware is applied globally but the streaming route uses a different Express Router instance that doesn't inherit the global middleware. Unauthenticated requests to the streaming route succeed and consume AI provider quota without authentication.

**Why it happens:** Express middleware is registered per-router-instance. A `router.use(clerkMiddleware)` on the main `app` does not automatically apply to a sub-router created with `express.Router()` unless explicitly passed. Developers often add new routes quickly and skip verifying that authentication is active.

**Consequences:** Any visitor (or script) can hit the streaming endpoint and generate AI responses, burning Gemini/OpenAI API quota. In experiment phase this is tolerable; at scale it is a billing catastrophe.

**Prevention:**
- Create a single `authenticatedRouter` that has Clerk middleware registered at the top. All API routes must be registered on this router — never on the bare `app` object for authenticated paths.
- Write an integration test that calls each API route without a Clerk JWT and asserts a 401 response. Run this test in CI.
- Add a middleware audit comment at the top of the Express entry file listing every route and its auth status: `// AUTHENTICATED: /api/chat, /api/stream, /api/sources, /api/simplify`.
- Use TypeScript to type the `req` object as `AuthenticatedRequest` (extends Express `Request` with `auth: ClerkJWT`) so unauthenticated route handlers fail to compile if they try to read `req.auth`.

**Warning signs:**
- Curl to `/api/stream` without Authorization header returns 200 (should be 401)
- Gemini quota consumed faster than user count explains
- New route added and developer doesn't update middleware registration
- Integration test suite has no 401 assertion tests

**Phase:** v0.1 Core Shell — auth must be complete before any streaming route is deployed.

---

### Pitfall 8: Provider Abstraction Layer Leaks Gemini-Specific Shapes

**What goes wrong:** The AI provider abstraction is designed as `interface AIProvider { chat(messages, options): AsyncIterable<string> }`. This works for simple chat. But when "Find Sources" is added, OpenAI's Responses API returns citations as structured objects embedded in the response, while Gemini requires a separate Tavily call and citation injection. The abstraction tries to accommodate both by adding `searchAndCite(query): Promise<Citation[]>` to the interface. Then simplification modes require `simplify(text, mode): Promise<string>`. Each new feature punches a different-shaped hole in the abstraction until the interface has 6 methods with subtle behavioral differences between providers.

**Why it happens:** API capabilities are not symmetric. OpenAI's Responses API is a fundamentally different paradigm (stateful, tool-calling, built-in search) from Gemini's stateless completion API with external Tavily search. Designing a single interface that abstracts both without leaking either provider's concepts is genuinely hard. The common failure mode is abstracting the easy parts (text generation) and special-casing the hard parts (search, citations) at the call site.

**Consequences:** "Switching providers is a config change" is not true. Switching providers requires code changes in the abstraction layer, the search service, and any caller that handles provider-specific edge cases. The abstraction provides false confidence.

**Prevention:**
- Accept that the abstraction is a facade, not a perfect interface. Design it to encapsulate all provider-specific logic inside two concrete classes (`GeminiProvider`, `OpenAIProvider`), each of which implements the full feature set for that provider. Neither class's internals should be visible to callers.
- The interface should be defined by DeepDive Chat's needs, not by provider API shapes: `chat()`, `findSources()`, `simplify()`. Each concrete class translates from that interface to its provider's native API internally.
- For v1 (Gemini only), ship the `GeminiProvider` fully. Leave `OpenAIProvider` as a stub that throws `NotImplementedError`. This forces the abstraction to be complete before the second provider is needed.
- Do NOT design the interface by looking at Gemini's API and adding one thin wrapper — design it by looking at what the UI features need and working backward.

**Warning signs:**
- Call sites have `if (provider === 'openai') { ... } else { ... }` blocks outside the provider classes
- The `AIProvider` interface has a method that takes a Gemini-specific parameter type
- "Find Sources" feature implementation lives partially in the provider class and partially in the route handler
- Switching the `PROVIDER` env var causes a runtime error rather than a clean fallback

**Phase:** v0.1 Core Shell — the abstraction interface must be designed before any provider code is written. Retrofitting it after Gemini code is entangled with route handlers is a significant rewrite.

---

## Moderate Pitfalls

---

### Pitfall 9: Paragraph Identity Unstable Across Message Re-Renders

**What goes wrong:** Gutter pill positioning depends on mapping a logical "paragraph N of message M" to a DOM element. If paragraph elements are identified by render-order index (e.g., the 3rd `<p>` tag in the message), but annotations insert new DOM elements above or between paragraphs (e.g., citation blocks), the index-based mapping silently shifts. Child lead pill for paragraph 3 now points to paragraph 4's DOM node.

**Prevention:**
- Assign stable `data-paragraph-id` attributes to each paragraph at parse time, derived from the message ID and paragraph content hash (or sequential index frozen at message commit). Never re-assign IDs during annotation.
- Query gutter pill targets by `data-paragraph-id`, not by DOM traversal order.

**Warning signs:**
- Pill positions are off by exactly one paragraph height after "Find Sources" is run
- Correct paragraph is highlighted in isolation tests but wrong one in integration tests with annotations

**Phase:** v0.1 Core Shell — stable IDs must exist before v0.2 adds citation injection.

---

### Pitfall 10: SSE Connection Not Closed on Client Navigation

**What goes wrong:** User starts a streaming response, then immediately navigates back to the parent thread via the breadcrumb. The Framer Motion transition fires, the streaming thread unmounts, but the EventSource connection to the backend is never explicitly closed. The backend continues streaming tokens to a dead connection. If the backend buffers sent SSE chunks in memory (e.g., for error recovery), that buffer grows unbounded. On the Render free tier, this causes memory pressure and pod restarts.

**Prevention:**
- `useEffect` cleanup function must call `eventSource.close()`. This is non-negotiable and must be enforced by code review checklist.
- Use an AbortController on the backend fetch: pass the signal to the Gemini SDK call. If the client disconnects (detected via `req.on('close', ...)` in Express), abort the upstream Gemini request immediately.
- Test by: start a streaming response, wait 2 seconds, navigate away. Verify the Render logs show the connection closed and no further tokens are generated.

**Warning signs:**
- Render logs show streaming continuing after client navigation
- Memory usage on Render pod increases over multiple stream-and-navigate sessions
- Backend process restarts on the free tier after an hour of use

**Phase:** v0.1 Core Shell — must be tested before deployment to Render.

---

### Pitfall 11: `user-select: none` on Gutter Column Bleeds Into Content Column

**What goes wrong:** The 200px gutter column containing pills needs `user-select: none` (clicking pills shouldn't create text selections). If this is applied to a shared parent container that also wraps the content column, text selection in the content column breaks entirely — `window.getSelection()` returns empty even when the user visibly selects text.

**Prevention:**
- Apply `user-select: none` only to the gutter element itself, scoped tightly. Use `pointer-events: none` on pill elements that shouldn't capture mouse events.
- Test text selection in content column immediately after adding any CSS to the layout wrapper.

**Phase:** v0.1 Core Shell — layout CSS is foundational.

---

### Pitfall 12: Breadcrumb Bar Overflow Truncation Loses Active Thread Label

**What goes wrong:** At depth 4 (5 thread levels), the breadcrumb bar contains 5 labels. On a 1024px minimum viewport, after the left spine (28px) and right gutter (200px), the breadcrumb has ~796px. Five thread labels of 32 characters each at 14px require ~700px+ — they fit at depth 4 but not always. The naive `overflow: hidden; text-overflow: ellipsis` approach truncates the active (rightmost) thread label first because flexbox collapses from the end.

**Prevention:**
- Always keep the active thread label fully visible. Truncate intermediate ancestors instead.
- Use `flex-shrink: 0` on the active crumb and `flex-shrink: 1` with `min-width: 0` on all ancestors.
- Cap ancestor labels at 16 characters max when space is constrained; show full title on hover.

**Phase:** v0.2/v0.3 — depth 4 is only reachable after full navigation is working.

---

## Minor Pitfalls

---

### Pitfall 13: Accent Color Palette Accessibility

**What goes wrong:** 8 accent colors auto-assigned to child threads look fine on light backgrounds but fail WCAG AA contrast requirements for the text on pills in dark mode.

**Prevention:** Validate all 8 colors against both light and dark backgrounds before finalizing the palette. Use a contrast checker. Prefer colors that work at 4.5:1 ratio in both modes.

**Phase:** v0.3 Polish — dark/light theme is scoped there.

---

### Pitfall 14: Clerk SDK Version Mismatch Between Frontend and Backend

**What goes wrong:** `@clerk/react` and `@clerk/express` (or `@clerk/backend`) are installed at different major versions. JWT validation on the backend expects a different session claim shape than what the frontend SDK generates. Requests fail with cryptic 401 errors that look like networking issues.

**Prevention:** Pin both Clerk packages to the same major version in `package.json`. Check Clerk's changelog when upgrading either.

**Phase:** v0.1 Core Shell — set at project initialization.

---

### Pitfall 15: Framer Motion `AnimatePresence` `mode="wait"` Blocking Input During Transition

**What goes wrong:** If `AnimatePresence` is configured with `mode="wait"`, the entering thread doesn't mount until the exiting thread finishes its exit animation. During the 200ms transition, the user cannot interact with the UI at all. If they try to click a pill or type in the input, the event is swallowed.

**Prevention:** Use `mode="sync"` (default) so both enter and exit animate simultaneously, keeping the 200ms total. Only use `mode="wait"` if the simultaneous presence of two threads causes a layout problem — and fix the layout problem instead.

**Phase:** v0.1 Core Shell — navigation transitions ship in v0.1.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| v0.1 | Zustand store design | Nested tree mutations bypass reactivity | Use immer middleware from day one; write selector unit tests |
| v0.1 | SSE streaming first implementation | Re-renders on every chunk causing O(n²) cost | Memoize Message components; throttle set() calls |
| v0.1 | Gutter pill positioning | ResizeObserver loop triggering infinite re-observation | Separate read and write phases; never set state synchronously in observer callback |
| v0.1 | Text selection + streaming | Selection nodes detached by React re-render | Commit paragraphs to DOM only when complete; disable selection during streaming |
| v0.1 | Auth middleware | Routes added without inheriting Clerk middleware | Single authenticated router; integration test for 401 on every endpoint |
| v0.1 | SSE connection lifecycle | EventSource not closed on navigation | Enforce useEffect cleanup; AbortController on backend |
| v0.1 | Slide transition + scroll | Scroll restoration fires before layout settles | Restore scroll in onAnimationComplete, not in useEffect |
| v0.2 | Annotation + selection | Bubble position stale after citation injection | MutationObserver recomputes bubble position on any DOM change |
| v0.2 | Provider abstraction | Feature expansion exposes leaky abstraction | Design interface from UI needs, not provider shapes; stub OpenAIProvider early |
| v0.2 | Paragraph identity | Annotations shift index-based paragraph references | Stable data-paragraph-id at parse time, never reassigned |
| v0.3 | Breadcrumb overflow | Active thread label truncated at depth 4 | Active crumb is flex-shrink: 0; ancestors truncate first |
| v0.3 | Dark mode accent colors | Pill text fails contrast in dark mode | Validate all 8 colors against both themes before theming work |

---

## Sources

Note: Web research tools were unavailable during this research session. All findings are drawn from:
- MDN Selection API specification (well-documented browser behavior)
- ResizeObserver W3C specification and known loop detection behavior
- Zustand documentation (training data, August 2025 cutoff)
- Framer Motion AnimatePresence documented behavior
- Clerk SDK documentation patterns
- Direct project context from PROJECT.md

**Confidence:** HIGH for pitfalls 1, 3, 4, 5, 7, 10, 11 (browser spec behavior, well-known React patterns). MEDIUM for pitfalls 2, 6, 8, 9 (interaction of multiple systems where real-world project data would increase confidence). LOW for none — all pitfalls are grounded in documented API behavior or well-established React patterns.

Validation recommended: Run a 1000-token streaming session, a ResizeObserver stress test with 5 simultaneous pills, and a navigation-during-streaming test before v0.1 is declared complete.
