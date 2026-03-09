# Project Research Summary

**Project:** DeepDive Chat
**Domain:** Branching / non-linear AI research chat interface
**Researched:** 2026-03-08
**Confidence:** HIGH (stack, architecture, pitfalls) / MEDIUM (feature competitive landscape)

## Executive Summary

DeepDive Chat is a genuinely novel interaction design in the consumer AI space: a paragraph-level, spatially-anchored branching chat interface built for research workflows. No major competitor (ChatGPT, Claude.ai, Perplexity, Kagi) offers paragraph-level branching with spatial gutter markers showing where branches originated. The recommended approach is a React 18 + Vite frontend backed by a stateless Express proxy that forwards requests to Gemini 2.0 Flash via a thin provider abstraction. All session state is ephemeral (Zustand only, no database), authentication is handled by Clerk, and the UI is desktop-only for v1. The stack is well-understood and low-risk; the architectural complexity is concentrated in three areas: SSE streaming performance, DOM-anchored gutter pill positioning, and text selection stability during live streaming.

The key implementation insight is that the Zustand store must use a flat normalized map (not a nested thread tree) from day one, SSE streaming must be done via `fetch` + `ReadableStream` (not `EventSource`, which cannot send auth headers), and DOM pixel positions must never be stored in global state. The provider abstraction layer must be designed from the UI's needs — `chat()`, `findSources()`, `simplify()` — and implemented as two concrete classes (`GeminiProvider`, `OpenAIProvider`) that hide all provider-specific logic internally. Getting these three decisions wrong early requires expensive rewrites.

The biggest risks are: (1) text selection being invalidated by React re-renders during streaming, (2) ResizeObserver loop-limit violations when positioning gutter pills, and (3) Framer Motion scroll-restoration timing conflicts during thread navigation. All three are well-understood with clear prevention strategies documented in PITFALLS.md. The mitigation pattern is consistent: defer DOM interaction to after animation completion, accumulate hot-path updates in refs before committing to Zustand, and keep presentational state (pixel positions, selection ranges) out of the global store entirely.

---

## Key Findings

### Recommended Stack

The frontend stack is React 18 (not 19 — ecosystem compatibility risk) + Vite 5 + TypeScript 5 + Zustand 4.5 + Framer Motion 11 + Tailwind CSS 3.4. Markdown rendering uses react-markdown 9 + remark-gfm 4 with react-syntax-highlighter (Prism variant). Authentication is Clerk (`@clerk/clerk-react` 5 on frontend, `@clerk/express` 1 on backend — the older `@clerk/clerk-sdk-node` is deprecated). The backend is Node 20 LTS + Express 4 (not 5) with `@google/generative-ai` for Gemini (not `@google-cloud/vertexai`, which requires GCP service accounts) and `@tavily/core` for web search. Frontend-to-backend HTTP uses native `fetch` + `ReadableStream`; no axios needed.

**Core technologies:**
- React 18 + Vite 5 + TypeScript 5: UI framework — ecosystem maturity over React 19's cutting edge
- Zustand 4.5: client state (flat normalized thread + message maps) — minimal boilerplate, no Provider wrapping
- Framer Motion 11: animated slide transitions + AnimatePresence — v11 layout animation rewrite is significant; do not use v10
- `@clerk/clerk-react` 5 + `@clerk/express` 1: authentication — pre-built UI + JWT validation; pin both to same major version
- `@google/generative-ai` 0.21.x: Gemini SDK for backend — direct API key auth, supports `generateContentStream()`
- `@tavily/core`: web search — official Tavily JS client; do NOT use the unscoped `tavily` package
- react-markdown 9 + remark-gfm 4: markdown rendering — ESM-native, compatible with Vite
- Tailwind CSS 3.4: styling — utility-first, maps well to the gutter layout and depth-based color accents; avoid v4 alpha
- Vercel (frontend) + Render (backend): deployment — zero-config Vite on Vercel, always-on Express on Render

### Expected Features

The feature set breaks into three tiers. Universal AI chat table stakes (streaming, markdown, syntax highlighting, auth, error states) are prerequisite and low-complexity. DeepDive-specific branching table stakes are the core product hypothesis — without them the product has no differentiation. Inline annotation features (Find Sources, Simplify) are the research-assistant differentiators that complete the v0.2 release.

**Must have — universal table stakes:**
- Streaming AI responses (SSE) — every major chat UI streams; static feels broken
- Markdown rendering with syntax highlighting — AI outputs markdown; raw text is unusable
- Auth gate (Clerk) — required to protect API keys
- Loading indicator, error states with retry, stop generation — basic usability
- Dark/light theme — users spend hours in the UI

**Must have — DeepDive branching table stakes (these ARE the product):**
- Text selection detection on AI messages — the entire interaction model starts here
- Action bubble on selection — affordance for Go Deeper / Find Sources / Simplify
- "Go Deeper" child thread creation anchored to selected paragraph
- Animated slide transition (200ms ease-out) — without it, navigation is disorienting
- Breadcrumb navigation bar + left spine strip — always-visible spatial orientation
- Child lead gutter tags in 200px right column — shows where branches were created
- Thread accent color assignment (8-color palette) — visual memory cues
- Thread depth limit at depth 4 — enforced ceiling with explanatory messaging

**Should have — research differentiators:**
- Find Sources via Tavily (Gemini path) — citation credibility for research users
- Inline Simplify with 4 modes (ELI5, Shorter, Formal, Bullets) — makes dense AI prose actionable
- Toggle to original on all annotations — undo anxiety mitigation
- Child lead hover preview card — recall branch content without navigating into it

**Defer to v2+:**
- Session persistence / database — out of scope for experiment validation
- Thread export (Markdown, PDF, JSON) — design cost exceeds v1 value
- Mobile support — text selection UX is fundamentally different on touch; separate design effort
- Sharing / collaborative sessions — requires real-time sync, out of scope

### Architecture Approach

The recommended architecture is a stateless two-tier system: a React frontend manages all session state in an ephemeral Zustand store (no persistence), and a stateless Express backend acts as an authenticated proxy to AI and search providers. The critical architectural decisions are: flat normalized Zustand store (threads and messages as `Record<id, T>` maps, not nested trees), `fetch` + `ReadableStream` for authenticated SSE streaming (not `EventSource`), DOM pixel positions tracked in component-local refs with ResizeObserver (not in Zustand), and inline text mutation for annotations (not positioned overlay elements). The provider abstraction lives entirely on the backend as two concrete classes behind a feature-oriented interface.

**Major components:**
1. `useSessionStore` (Zustand, flat map) — thread tree state, active thread pointer, navigation, annotations; the single source of truth for all business state
2. `ThreadView` + `MessageRenderer` + `AnnotationLayer` — renders the active thread's message list with inline annotation mutations applied; paragraph refs registered here for gutter anchoring
3. `TextSelectionBubble` — detects `window.getSelection()` events on AI messages, identifies paragraph by `data-paragraph-id` attribute, positions bubble via `getBoundingClientRect()`
4. `GutterColumn` + `useParagraphPositions` — reads child lead data from store and DOM positions from a local ref (populated by ResizeObserver), renders `ChildLeadPill` elements anchored vertically to their source paragraphs
5. `ThreadTransition` (Framer Motion AnimatePresence) — wraps `ThreadView`, triggers 200ms x-axis slide on `activeThreadId` key change; scroll restoration fires in `onAnimationComplete` callback only
6. Backend `lib/aiProvider.js` + `lib/searchProvider.js` — thin provider facade; `GeminiProvider` + `TavilyProvider` are the v1 implementations; `OpenAIProvider` + `OpenAISearchProvider` are stubs that throw `NotImplementedError`

**Build order (layer dependencies):**
- Layer 1: Backend proxy shell (Express, Clerk middleware, Gemini streaming, Tavily)
- Layer 2: Frontend foundation (Vite scaffold, Clerk auth, Zustand store, SSE client)
- Layer 3: Core thread UI (ThreadView, InputBar, streaming, breadcrumb, spine)
- Layer 4: Branching (text selection, Go Deeper, gutter column, lead pills)
- Layer 5: Inline annotations (Simplify, Find Sources, annotation toggling)
- Layer 6: Polish (hover preview, accent colors, error states, dark mode, E2E tests)

### Critical Pitfalls

1. **Text selection destroyed by DOM mutation during streaming** — React replaces text nodes on re-render, detaching Selection API range references; the action bubble vanishes or renders at (0,0). Prevention: commit full paragraphs to the DOM only after streaming completes; disable `user-select` with CSS during active streaming; re-enable on SSE `done` event.

2. **ResizeObserver loop on gutter pill positioning** — reading `offsetTop` then writing CSS in the same observer callback triggers infinite re-observation, flooding console with "loop limit exceeded" warnings and causing visual jitter. Prevention: accumulate measurements into a ref in the observer callback, then schedule a React state update via `setTimeout(0)` to break the synchronous chain; never interleave DOM reads and writes.

3. **Framer Motion slide transition clobbers scroll restoration** — `scrollIntoView()` called in `useEffect` fires while the exiting thread is still in the DOM and Framer Motion transforms are active, producing incorrect layout measurements. Prevention: restore scroll position exclusively in the `onAnimationComplete` callback, after the entering thread has settled; use a ref to the target paragraph element, not a stored pixel offset.

4. **Zustand store nested tree mutations bypass React reactivity** — pushing into existing array references without creating new references causes subscribers to miss updates; streaming tokens appear in the store but not in the UI. Prevention: use `immer` middleware from day one; accumulate streaming tokens in a local ref and commit to Zustand with a complete string replacement, never in-place append.

5. **SSE streaming re-renders degrade to O(n²) as message grows** — every chunk triggers a re-render of the entire message list if components are not memoized and selectors are too broad. Prevention: `React.memo` on all `Message` components with stable `id` keys; separate `useStreamingMessage(threadId)` selector for the hot-path streaming content; throttle Zustand `set()` to max 30 calls/second; consider streaming directly to a DOM ref and committing to Zustand only on stream completion.

6. **Clerk JWT middleware not enforced on all routes** — new routes added to a different Express Router instance miss the auth middleware; unauthenticated requests consume AI quota. Prevention: single `authenticatedRouter` instance with Clerk middleware at the top; integration test asserting 401 on every endpoint without a valid JWT.

7. **Provider abstraction leaks provider-specific shapes** — designing the interface by wrapping the Gemini API produces an interface that cannot accommodate OpenAI Responses API's fundamentally different paradigm without call-site special-casing. Prevention: design the interface from UI feature needs (`chat()`, `findSources()`, `simplify()`); ship `OpenAIProvider` as a stub early to force the abstraction to be complete before the second provider is needed.

---

## Implications for Roadmap

Research strongly suggests a 6-phase build order that mirrors the architectural layer dependency graph. Each phase has a clear gate condition before the next begins. The ordering is driven by hard dependencies: the backend proxy must exist before the SSE client can be built; the SSE client must work before thread UI is meaningful; thread UI must be stable before the branching interaction is layered on top; branching must be stable before annotations are added (annotations change paragraph DOM structure, which invalidates naive positioning approaches).

### Phase 1: Backend Proxy Shell

**Rationale:** All frontend work depends on a working authenticated proxy. Building the backend first allows frontend developers to curl the endpoints and validate streaming before any UI exists. The provider abstraction interface must be designed here — retrofitting it after Gemini code is entangled with route handlers is a significant rewrite.

**Delivers:** Authenticated Express server on Render with SSE streaming (Gemini), single-shot endpoints (simplify, cite via Tavily), Clerk JWT validation on all routes, CORS configured for Vite dev server.

**Addresses:** Auth gate requirement, streaming infrastructure, provider abstraction design

**Avoids:** Pitfall 7 (routes missing auth middleware — build authenticated router first), Pitfall 8 (leaky abstraction — design interface from UI needs before any implementation)

**Research flag:** Standard patterns. No per-phase research needed; STACK.md and ARCHITECTURE.md cover this fully.

### Phase 2: Frontend Foundation

**Rationale:** Once the backend gate is passed (curl returns SSE chunks with a valid Clerk token), wire up the React scaffold with auth and the Zustand store. The store shape must be finalized here — the flat normalized map decision is load-bearing for all subsequent phases.

**Delivers:** Vite + React + TypeScript scaffold, Clerk auth gate with protected routes, Zustand session store with flat thread/message maps and all action signatures, `fetch` + `ReadableStream` SSE client utility.

**Addresses:** Auth gate (frontend), session state foundation

**Avoids:** Pitfall 4 (nested tree mutations — flat map from day one), Pitfall 5 (streaming re-renders — store split into session + streaming stores at initialization)

**Research flag:** Standard patterns. Zustand flat map and fetch-based SSE are well-documented; no additional research needed.

### Phase 3: Core Thread UI

**Rationale:** Before branching can be built, a single-thread conversation must work end-to-end with streaming. This phase validates the streaming pipeline, chunk batching, and navigation chrome. All branching UI (breadcrumb, spine) is built here in stub form (visible but non-functional beyond root thread).

**Delivers:** Working single-thread chat with streaming, `ThreadView`, `MessageRenderer`, `InputBar`, `BreadcrumbBar` (root-only), `SpineStrip` (hidden at depth 0), `ThreadTransition` wrapper, chunk batching on requestAnimationFrame.

**Addresses:** Streaming SSE, markdown rendering, syntax highlighting, loading indicator, stop generation, error states

**Avoids:** Pitfall 5 (O(n²) re-renders — validate with 1000-token response before phase complete), Pitfall 3 (Framer Motion scroll — ThreadTransition built here, scroll restoration pattern established)

**Research flag:** Standard patterns. No additional research needed.

### Phase 4: Branching

**Rationale:** The core product hypothesis. Text selection, child thread creation, animated navigation, and gutter pill positioning are all built here. This is the highest-complexity phase technically (DOM interaction, ResizeObserver, scroll restoration during animation) and the most critical for product validation.

**Delivers:** Text selection detection, action bubble (Go Deeper action only), child thread creation, animated slide transition, breadcrumb navigation (multi-level), spine strip (depth ≥ 1), `GutterColumn` + `useParagraphPositions` + `ChildLeadPill`, stable `data-paragraph-id` attributes on all paragraphs, thread depth limit enforcement, accent color assignment.

**Addresses:** All branching table-stakes features listed in FEATURES.md

**Avoids:** Pitfall 1 (selection destroyed during streaming — paragraphs finalized before selection enabled), Pitfall 2 (bubble position stale — computed on selectionchange, never stored), Pitfall 3 (scroll restoration — fires in onAnimationComplete only), Pitfall 9 (paragraph identity unstable — stable data-paragraph-id at parse time), Pitfall 10 (SSE not closed on navigation — useEffect cleanup enforced), Pitfall 11 (user-select bleeds to content column — scoped tightly to gutter element)

**Research flag:** This phase needs careful implementation validation. Consider a `/gsd:research-phase` specifically on ResizeObserver + React integration patterns and Framer Motion AnimatePresence scroll restoration before implementation begins.

### Phase 5: Inline Annotations

**Rationale:** Find Sources and Simplify complete the research-assistant differentiation. This phase depends on Phase 4 because annotations mutate paragraph DOM structure — those mutations must not break the paragraph identity and gutter positioning built in Phase 4. The provider abstraction designed in Phase 1 is exercised here.

**Delivers:** Find Sources (Tavily integration, citation block injection, source badge), Simplify with 4 modes (ELI5, Shorter, Formal, Bullets), toggle to original, re-selectable annotated text (data-paragraph-id survives annotation render), child lead hover preview card, action bubble extended with Find Sources and Simplify actions.

**Addresses:** All inline annotation features from FEATURES.md, hover preview card differentiator

**Avoids:** Pitfall 2 (bubble position stale after citation injection — MutationObserver recomputes on any DOM change in message container), Pitfall 8 (leaky abstraction — GeminiProvider.findSources() encapsulates Tavily call entirely), Pitfall 9 (paragraph identity — validated that data-paragraph-id survives annotation render before phase ships)

**Research flag:** Standard patterns for Tavily integration (`@tavily/core` API is straightforward). The annotation rendering pattern (inline text mutation in MessageRenderer) is novel enough that reviewing the interaction between AnnotationLayer and paragraph ref registration is worth a quick spike before full implementation.

### Phase 6: Polish and Deployment

**Rationale:** All core features are working. This phase makes the product deployable and trustworthy: dark/light theme, error handling completeness, breadcrumb overflow at depth 4, E2E test coverage, rate limiting on backend, and production deployment configuration.

**Delivers:** Dark/light theme with system preference default, breadcrumb overflow handling (active crumb flex-shrink:0, ancestors truncate first), accent color WCAG AA validation for both themes, rate limiting on all backend endpoints, empty state / onboarding prompts, Playwright E2E tests (auth, streaming, branching, annotation, navigation), production deployment (Vercel + Render).

**Addresses:** All v0.3 polish features from FEATURES.md MVP recommendation

**Avoids:** Pitfall 12 (breadcrumb overflow — active crumb is flex-shrink:0), Pitfall 13 (accent color accessibility — validate all 8 colors against both themes before finalizing)

**Research flag:** Standard patterns. Playwright E2E for SSE streaming has some nuance; verify EventSource/fetch streaming test patterns in Playwright docs if needed.

### Phase Ordering Rationale

- **Backend before frontend:** The provider abstraction interface is the most expensive mistake to make late. Designing it in Phase 1 before any frontend pressure exists ensures it reflects UI needs, not provider shapes.
- **Foundation before branching:** The flat Zustand store shape and streaming performance must be validated with a simple single-thread chat before the branching complexity is layered on. Retrofitting store shape mid-project is expensive.
- **Branching before annotations:** Annotations mutate paragraph DOM structure. Building gutter positioning on top of a DOM that already handles annotation mutations would compound complexity. Establish stable paragraph identity and ResizeObserver patterns first.
- **Polish last:** Dark mode, breadcrumb overflow, and E2E tests are genuinely last — they depend on all features being present.

### Research Flags

Phases likely needing deeper research or implementation spikes during planning:
- **Phase 4 (Branching):** ResizeObserver + React state update timing is the highest-risk interaction in the entire project. The "separate read phase and write phase" pattern is well-documented in spec language but less documented in React-specific implementation. A spike before full implementation is warranted.
- **Phase 5 (Inline Annotations):** The interaction between AnnotationLayer (mutating paragraph content) and the paragraph ref system (reading paragraph DOM positions for gutter anchoring) is the most complex inter-component dependency. A narrow spike confirming that data-paragraph-id survives annotation renders and that gutter positions remain correct after citation injection is worth doing before full implementation.

Phases with well-documented standard patterns (skip research-phase):
- **Phase 1 (Backend):** Express + Clerk + Gemini SDK patterns are fully documented in training data.
- **Phase 2 (Frontend Foundation):** Zustand flat map and fetch-based SSE are textbook patterns.
- **Phase 3 (Core Thread UI):** Standard React streaming + memoization patterns.
- **Phase 6 (Polish):** Standard deployment and theming patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology choices are well within training data (August 2025). Package name `@tavily/core` is MEDIUM — verify on npmjs.com before install. `eventsource-parser` likely not needed at all (Gemini SDK returns async iterable, not raw SSE text). |
| Features | HIGH (UX patterns) / MEDIUM (competitive landscape) | Feature requirements derived from project spec are HIGH. Competitive analysis (ChatGPT, Claude.ai, etc.) is MEDIUM — products evolve; verify current state before using competitively. |
| Architecture | HIGH | All architectural recommendations are derived from well-documented browser APIs (Selection, ResizeObserver, ReadableStream), Zustand documentation, and React performance patterns. The fetch+ReadableStream over EventSource limitation is a W3C spec fact. |
| Pitfalls | HIGH (browser spec behavior) / MEDIUM (multi-system interactions) | Pitfalls grounded in MDN spec behavior (Selection API, ResizeObserver loop detection) are HIGH. Pitfalls involving interaction of Framer Motion + scroll + DOM timing are MEDIUM — real-world project data would increase confidence. |

**Overall confidence:** HIGH for implementation decisions; MEDIUM for competitive positioning.

### Gaps to Address

- **`@tavily/core` package name:** Verify on npmjs.com before install. The unscoped `tavily` package is a third-party wrapper and must be avoided. The scoped `@tavily/core` is the official Tavily client.
- **Gemini SDK `generateContentStream()` API shape:** Verify the exact async iterable interface against current SDK docs before building the backend streaming module. The backend SSE pattern (write each chunk as `data: {...}\n\n`) is correct; the SDK call signature may have minor version differences.
- **ResizeObserver + React state timing:** No production reference implementation for this specific pattern in React was available in training data. The "accumulate in ref, schedule state update via setTimeout(0)" pattern is the recommended approach from spec knowledge, but should be validated in a spike before the gutter positioning feature ships.
- **Framer Motion `onAnimationComplete` + scroll restoration:** The exact interaction between AnimatePresence exit animation and scroll target DOM availability needs to be validated empirically. The pattern is correct in principle; the implementation timing may require adjustment.
- **Mobile is deliberately out of scope:** Text selection on touch devices is a fundamentally different problem. DeepDive v1 is desktop-only. No mobile research was done and none is needed for v1.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — authoritative project specification; all feature and constraint decisions derive from this document
- Training data (cutoff August 2025) — React 18, Zustand 4.5, Framer Motion 11, Clerk 5, Express 4, Gemini SDK 0.21 patterns
- MDN Selection API specification — Pitfall 1, 2, 11 (browser behavior facts)
- ResizeObserver W3C specification — Pitfall 3 (loop detection behavior is spec-defined)
- Zustand README and Redux normalized state style guide — flat map store shape recommendation

### Secondary (MEDIUM confidence)
- Clerk upgrade guide (https://clerk.com/docs/upgrade-guides) — `@clerk/express` vs deprecated `@clerk/clerk-sdk-node`
- Gemini SDK docs (https://ai.google.dev/api/generate-content) — `generateContentStream()` interface
- Framer Motion AnimatePresence documented behavior — Pitfall 6, 15
- Training data on competitive landscape (ChatGPT, Claude.ai, Perplexity as of August 2025)

### Tertiary (LOW confidence / verify before use)
- Tavily JS docs (https://docs.tavily.com) — `@tavily/core` package name; verify before install
- Feature complexity estimates — based on typical React + Zustand + DOM API patterns; actual complexity depends on edge cases discovered during implementation

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
