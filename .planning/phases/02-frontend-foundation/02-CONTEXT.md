# Phase 2: Frontend Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the React/Vite frontend from scratch: project scaffold, Clerk auth integration (email/password + Google OAuth), a read-only demo chat for unauthenticated guests, a fully typed and fully implemented Zustand store with the flat normalized shape all future phases depend on, and the SSE API client module. No chat UI rendering — that's Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Auth entry experience
- Unauthenticated visitors land on a hardcoded **static demo chat** — no API calls, content baked into code
- Demo chat is **read-only**: chat input bar is visible but disabled, with an inline "Sign in to start your own conversation" message and sign-in button
- Guests cannot create real chat sessions — demo view only
- Sign-in button lives in the **top-right header** at all times
- **AUTH-03 is revised**: the original requirement said guests could use the full chat; the actual design is guests can view a demo but must sign in to interact

### Clerk sign-in UI
- Sign-in happens in a **modal overlay** on top of the demo chat using Clerk's embedded `<SignIn>` component
- No `/sign-in` route needed — auth is in-place
- Google OAuth redirect returns to the same page; modal closes after successful auth

### Post-login state
- After signing in: modal closes, demo disappears, user sees a **blank chat interface** ready for their first message (fresh empty Zustand store)
- On logout (AUTH-05): all in-memory state cleared, user returns to demo chat view

### Zustand store completeness
- **Fully implemented actions** — not stubs. All actions from the data model are working:
  - `createSession`, `clearSession`
  - `createThread`, `setActiveThread`
  - `addMessage`, `updateMessage` (for streaming token appends), `setMessageStreaming`
  - `addChildLead`, `addAnnotation`, `setScrollPosition`
  - Selectors: `currentThread`, `threadAncestry`, `isAtMaxDepth`
- Flat `Record<id, Thread>` and `Record<id, Message>` shape (locked — no nested tree mutations)
- No localStorage persistence in v1

### SSE client scope
- Phase 2 builds `frontend/src/api/chat.ts` with `fetch` + `ReadableStream` streaming logic that connects to the backend `/api/chat`
- The `useStreamingChat` React hook that wires the API module to Zustand state lives in Phase 3
- Also build `frontend/src/api/client.ts` (base fetch wrapper with Clerk JWT auth headers), `simplify.ts`, and `search.ts` stubs

### Claude's Discretion
- ESLint config, Prettier, path aliases (@/ imports), Vite plugins — standard sensible defaults
- Tailwind dark mode strategy (class vs media)
- Vite proxy config for dev (to avoid CORS hitting the backend at localhost:3000)

</decisions>

<specifics>
## Specific Ideas

- PROJECT.md Section 7 has the full data model (Thread, Message, Annotation, ChildLead, SourceResult) — store types should align with these exactly
- `shared/types.ts` at repo root already contains base types from Phase 1; frontend imports from `../../shared/types.ts`
- The demo chat content should feel representative of the app's actual use case — a research-style Q&A showing what a thread looks like with a couple of messages
- PROJECT.md font spec: Inter (body), JetBrains Mono (code), Inter via Google Fonts CDN or npm package

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shared/types.ts`: Role, Message, SearchResult, ApiError, ApiResponse, SseEvent — frontend imports these directly, no duplication
- `backend/src/routes/`: chat, simplify, find-sources — defines the API contract the frontend api/ modules must match
- `backend/.env.example`: documents existing backend env vars; frontend will add VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL

### Established Patterns
- Backend uses `{ data, error }` JSON envelope on all routes — frontend API client should expect and handle this shape
- Backend SSE: streams chunks, ends with `data: [DONE]\n\n` — frontend ReadableStream must handle both token chunks and the DONE sentinel
- TypeScript strict mode everywhere — `strict: true` must be set in frontend tsconfig too

### Integration Points
- Frontend `api/client.ts` attaches Clerk JWT via `Authorization: Bearer <token>` — matches `requireApiAuth` middleware in backend
- Frontend Vite dev server needs proxy rule: `/api` → `http://localhost:3001` (or whatever port backend runs on) to avoid CORS in local dev

</code_context>

<deferred>
## Deferred Ideas

- **About page** (user bio + project description) — new capability not in current roadmap. Add to backlog. Could be a Phase 2.1 insert or folded into Phase 6.
- **AUTH-03 requirement update needed**: REQUIREMENTS.md says "Login is optional — unauthenticated users can access and use the full chat interface." This should be updated to reflect the demo-only guest experience decided here.

</deferred>

---

*Phase: 02-frontend-foundation*
*Context gathered: 2026-03-09*
