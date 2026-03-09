# Roadmap: DeepDive Chat

## Overview

DeepDive Chat is built in six phases ordered by hard architectural dependencies. The backend proxy and provider abstraction must exist before any frontend work begins. The flat Zustand store shape must be locked before branching complexity is layered on. Gutter pill positioning and paragraph identity must be stable before inline annotations mutate paragraph DOM structure. Polish and deployment come last because they depend on all features being present and stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Proxy Shell** - Authenticated Express proxy with Gemini streaming, Tavily, and provider abstraction (completed 2026-03-09)
- [x] **Phase 2: Frontend Foundation** - React scaffold, Clerk auth gate, flat Zustand store, SSE client (completed 2026-03-09)
- [ ] **Phase 3: Core Thread UI** - Working single-thread chat with streaming, navigation chrome, and Markdown rendering
- [ ] **Phase 4: Branching** - Text selection, Go Deeper, gutter lead pills, animated navigation, depth limit
- [ ] **Phase 5: Inline Annotations** - Find Sources (Tavily), Simplify (4 modes), toggle to original, re-selectable annotated text
- [ ] **Phase 6: Polish and Deployment** - Dark/light theme, error states, breadcrumb overflow, rate limiting, E2E tests, Vercel + Render

## Phase Details

### Phase 1: Backend Proxy Shell
**Goal**: Developers can curl the backend and receive authenticated SSE streaming responses; the provider abstraction is locked before any frontend pressure exists
**Depends on**: Nothing (first phase)
**Requirements**: UI-04, AUTH-04, UI-03
**Success Criteria** (what must be TRUE):
  1. A curl request with a valid Clerk JWT to the `/chat` endpoint returns SSE chunks from Gemini with tokens arriving progressively
  2. A curl request without a JWT receives a 401 response on every API route
  3. A curl request to `/simplify` and `/find-sources` returns non-streamed JSON responses
  4. Switching the `AI_PROVIDER` environment variable is the only change required to point the server at a different provider
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, test infrastructure, Wave 0 stubs, shared/types.ts
- [x] 01-02-PLAN.md — Provider abstraction: interfaces, GeminiProvider, TavilyProvider, OpenAI stubs, config factory
- [x] 01-03-PLAN.md — Server wiring: auth middleware, rate limiter, 3 API routes, Express entry point

### Phase 2: Frontend Foundation
**Goal**: An authenticated user lands on the app, a guest user bypasses auth, and the Zustand store is fully typed and initialized with the flat normalized structure that all future phases depend on
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and be redirected to the chat interface
  2. User can sign in with Google OAuth and be redirected to the chat interface
  3. Unauthenticated user sees a read-only demo chat; must sign in to interact (AUTH-03 revised per 02-CONTEXT.md)
  4. Logging out clears all in-memory state (thread tree, messages, annotations) and returns to the demo chat view
  5. The Zustand store exposes a flat `Record<id, Thread>` and `Record<id, Message>` shape with all actions fully implemented (not stubs)
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Vite scaffold, Tailwind v4, Clerk modal auth, DemoChat guest view, AppShell skeleton, Wave 0 test stubs
- [ ] 02-02-PLAN.md — Zustand store (all 9 actions), frontend types, selectors (currentThread, threadAncestry, isAtMaxDepth)
- [ ] 02-03-PLAN.md — SSE client (fetch+ReadableStream+remainder buffer), API client wrapper, simplify/search stubs, human-verify checkpoint

### Phase 3: Core Thread UI
**Goal**: Users can have a complete multi-turn conversation in the root thread with streaming AI responses, and all navigation chrome is present (even if non-functional beyond root)
**Depends on**: Phase 2
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07
**Success Criteria** (what must be TRUE):
  1. User can type a message and watch Gemini's response appear token-by-token with full GFM Markdown rendering including syntax-highlighted code blocks
  2. User can send follow-up messages in the root thread and maintain a coherent multi-turn conversation
  3. Text selection is disabled on a message while it is streaming and automatically re-enabled when the stream completes
  4. The breadcrumb bar is visible at the top of the screen showing the current thread path; clicking an ancestor navigates there with a slide-left transition
  5. The left spine strip appears when thread depth is 1 or greater and clicking it navigates to the parent thread
**Plans**: TBD

### Phase 4: Branching
**Goal**: Users can branch off any completed AI paragraph into a child thread, navigate the resulting thread tree, and see gutter lead pills showing where branches originated
**Depends on**: Phase 3
**Requirements**: BRANCH-01, BRANCH-02, BRANCH-03, BRANCH-04, BRANCH-05, BRANCH-06, BRANCH-07, BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11, BRANCH-12
**Success Criteria** (what must be TRUE):
  1. User can click and drag to select a paragraph of AI response text and see the action bubble appear within 100ms of releasing the mouse
  2. User can click "Go Deeper" and the child thread opens with a slide-right transition; a colored underline persists on the anchor paragraph in the parent thread
  3. Child lead pills appear in the right gutter at the vertical position of the anchor paragraph, showing the thread title, message count, and accent color pip
  4. Clicking a child lead pill navigates into that thread; clicking a breadcrumb or the spine navigates back, with scroll position restored to where the user left off
  5. "Go Deeper" is disabled at depth 4 and shows an explanatory tooltip; branching is impossible beyond that level
**Plans**: TBD

### Phase 5: Inline Annotations
**Goal**: Users can find sources for any selected paragraph and simplify it in four modes; annotations persist in place, remain re-selectable, and do not break gutter pill positioning
**Depends on**: Phase 4
**Requirements**: INLINE-01, INLINE-02, INLINE-03, INLINE-04, INLINE-05, INLINE-06, INLINE-07, INLINE-08
**Success Criteria** (what must be TRUE):
  1. User can click "Find Sources" and see a citation block injected below the paragraph with top 3 Tavily results (title, domain, link) and a Gemini-generated note; the block is collapsible
  2. User can click "Simplify", choose one of four modes, and see the paragraph text replaced inline with the rewritten version
  3. A toggle persists beside simplified text allowing the user to switch between the rewritten version and the original at any time
  4. If Tavily returns no results or fails, an inline error message with a retry option appears below the paragraph
  5. Text that has been annotated (simplified or sourced) is fully re-selectable and the action bubble offers all three actions (Go Deeper, Find Sources, Simplify)
**Plans**: TBD

### Phase 6: Polish and Deployment
**Goal**: The app is production-deployed, visually polished in both themes, protected by rate limiting, and covered by an E2E test suite
**Depends on**: Phase 5
**Requirements**: UI-01, UI-02, DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. The app renders in dark mode on first load; toggling to light theme persists across page refreshes via localStorage
  2. The frontend is live on Vercel and the backend is live on Render; both deploy automatically from the main branch
  3. The Playwright E2E suite passes for all 6 core flows: auth, root chat with streaming, Go Deeper branching, Find Sources, Simplify, and multi-level navigation
  4. A `.env.example` file documents every required environment variable with a description
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Proxy Shell | 3/3 | Complete   | 2026-03-09 |
| 2. Frontend Foundation | 3/3 | Complete    | 2026-03-09 |
| 3. Core Thread UI | 0/TBD | Not started | - |
| 4. Branching | 0/TBD | Not started | - |
| 5. Inline Annotations | 0/TBD | Not started | - |
| 6. Polish and Deployment | 0/TBD | Not started | - |
