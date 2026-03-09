---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Completed 03-06-PLAN.md — Phase 3 checkpoint, awaiting human browser verification
last_updated: "2026-03-09T14:45:50.616Z"
last_activity: 2026-03-09 — Plans 02-01 and 02-02 complete (parallel Wave 1)
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 12
  completed_plans: 12
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Phase 02 Wave 1 complete — 02-01 (scaffold+auth) and 02-02 (Zustand store) done, 02-03 (API client) pending
last_updated: "2026-03-09T13:00:00.000Z"
last_activity: 2026-03-09 — Plan 02-02 complete (Zustand store, selectors, 16 tests pass)
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 6
  completed_plans: 4
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-08)

**Core value:** A user must be able to branch off any paragraph into a focused child conversation and return to the exact spot in the parent — with a visible lead marker showing where they went and what they found.
**Current focus:** Phase 2 — Frontend Foundation (02-03 pending)

## Current Position

Phase: 2 of 6 (Frontend Foundation) — IN PROGRESS
Plan: 2 of 3 in current phase — 02-03 pending
Status: Wave 1 complete — executing Wave 2 (API client)
Last activity: 2026-03-09 — Plans 02-01 and 02-02 complete (parallel Wave 1)

Progress: [███░░░░░░░] ~33% (Phase 02 in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 5 min
- Total execution time: 0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-backend-proxy-shell | 3 | 9 min | 3 min |
| 02-frontend-foundation | 2/3 | 14 min | 7 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (4 min), 01-03 (3 min), 02-01 (6 min), 02-02 (8 min)
- Trend: slightly increasing (larger plans)

*Updated after each plan completion*
| Phase 01-backend-proxy-shell P02 | 4 min | 2 tasks | 8 files |
| Phase 01-backend-proxy-shell P03 | 3 min | 2 tasks | 10 files |
| Phase 02-frontend-foundation P01 | 6 min | 2 tasks | 15 files |
| Phase 02-frontend-foundation P02 | 8 min | 2 tasks | 7 files |
| Phase 02-frontend-foundation P03 | 45 | 2 tasks | 6 files |
| Phase 03-core-thread-ui P01 | 4 | 2 tasks | 7 files |
| Phase 03-core-thread-ui P02 | 6 | 2 tasks | 7 files |
| Phase 03-core-thread-ui P03 | 8 | 2 tasks | 8 files |
| Phase 03-core-thread-ui P04 | 3 | 2 tasks | 7 files |
| Phase 03-core-thread-ui P05 | 3 | 2 tasks | 4 files |
| Phase 03-core-thread-ui P06 | 8 | 1 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Provider abstraction interface must be designed in Phase 1 before any frontend pressure — design from UI feature needs (`chat()`, `findSources()`, `simplify()`), not from Gemini API shape
- [Init]: Flat normalized Zustand store (`Record<id, Thread>`, `Record<id, Message>`) must be locked in Phase 2 — no nested tree mutations
- [Init]: SSE streaming via `fetch` + `ReadableStream` only — `EventSource` cannot send auth headers
- [Init]: DOM pixel positions (gutter pill anchors) must never enter Zustand — track in component-local refs via ResizeObserver
- [01-01]: No type:module in backend/package.json — ts-jest uses CommonJS transform to avoid ESM/CJS conflicts
- [01-01]: @google/genai v1.x used (not @google/generative-ai which EOL'd Nov 2025)
- [01-01]: shared/types.ts at repo root so both backend and frontend can import without package boundary issues
- [Phase 01-02]: TavilyProvider uses lazy client init — avoids throwing on missing TAVILY_API_KEY during tests
- [Phase 01-02]: Factory tests use jest.isolateModulesAsync() + constructor.name — avoids class identity mismatch after module cache reset
- [Phase 01-02]: config.ts is the ONLY file reading AI_PROVIDER — route handlers import aiProvider/searchProvider singletons, never branch on provider type
- [Phase 01-02]: tsconfig.json rootDir changed from ./src to . — fix for pre-existing TS6059 errors when tests/ included but outside rootDir
- [Phase 01-03]: apiRouter.use(requireApiAuth) in routes/index.ts protects all sub-routes automatically — no per-route decoration needed
- [Phase 01-03]: SSE flushHeaders() called before aiProvider.streamChat() — streaming headers must reach client before async work begins
- [Phase 01-03]: @types/cors added as devDependency — cors package had no bundled types (Rule 3 auto-fix)
- [Phase 01-03]: ipKeyGenerator(ip: string) accepts IP string not Request object — pass req.ip, not req (Rule 1 bug fix post-checkpoint)
- [Phase 02-01]: Clerk modal auth with routing=hash — no /sign-in route; URL stays unchanged on modal open
- [Phase 02-01]: Global Clerk mock uses React.createElement in .ts setup file (not JSX) to avoid esbuild parse error
- [Phase 02-01]: tsconfig.app.json rootDir=../.. so shared/types.ts resolves across frontend/backend boundary
- [Phase 02-02]: Messages locked flat in Record<string,Message> at store root — Thread.messageIds holds string[] references only (Zustand store shape, locked in 02-02)
- [Phase 02-02]: Zustand v5 curried create<SessionState>()() pattern used — enables TypeScript generic inference without explicit type annotation on useStore call
- [Phase 02-02]: Selector functions are pure (no store import) — accept data as parameters, usable outside React components
- [Phase 02-03]: streamChat uses fetch+ReadableStream with remainder buffer — EventSource cannot send Authorization headers
- [Phase 02-03]: getToken passed as function parameter into all api/ modules — no React hooks inside api layer
- [Phase 02-03]: search.ts uses /api/find-sources route (not /api/search) — matches Phase 1 backend router
- [Phase 02-03]: Clerk sign-out uses SignOutButton component + Zustand cleared reactively on isSignedIn change — avoids async signOut race condition
- [Phase 03-core-thread-ui]: test.todo() chosen over test.skip() — avoids any import of non-existent modules while keeping stubs import-error-free
- [Phase 03-core-thread-ui]: AbortError detection uses dual check (err.name==='AbortError' OR DOMException code 20) — jsdom DOMException is not instanceof Error in all environments
- [Phase 03-core-thread-ui]: useStreamingChat snapshots messageIds BEFORE addMessage calls — prevents history double-counting in synchronous mock contexts
- [Phase 03-core-thread-ui]: vi.mock hoisting in Vitest requires test file separation: AbortSignal tests in api.chat.test.ts, setThreadTitle in sessionStore.test.ts — cannot mix real+mocked imports for same module
- [Phase 03-core-thread-ui]: react-markdown v10 dropped className prop on ReactMarkdown element — wrap in div for prose classes
- [Phase 03-core-thread-ui]: react-syntax-highlighter prism-light uses default export (not named Prism) — use default import
- [Phase 03-core-thread-ui]: MessageBlock streaming classes are Tailwind utility strings for testability; StreamingCursor uses inline style tag for keyframes
- [Phase 03-04]: Zustand selectors must be separate calls (not object spread) to avoid getSnapshot infinite loop in React concurrent mode
- [Phase 03-04]: scrollIntoView guarded with typeof check for jsdom test environment compatibility
- [Phase 03-05]: ResizeObserver guarded with typeof check — jsdom does not define ResizeObserver, avoiding ReferenceError in tests
- [Phase 03-05]: BreadcrumbBar collapse is data-length-based (ancestry.length > 3), deterministic and testable without layout engine
- [Phase 03-05]: SpineStrip only calls setActiveThread — ThreadView cleanup useEffect handles scroll save, no scrollRef prop threading needed
- [Phase 03-06]: tsconfig.app.json types array blocks @types/* autodiscovery — must explicitly add react-syntax-highlighter when using deep ESM sub-path imports
- [Phase 03-06]: react-markdown v10 code component prop: use HTMLAttributes<HTMLElement> with optional node, not custom CodeProps with index signature

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 4]: ResizeObserver + React state update timing is highest-risk interaction — spike warranted before gutter positioning ships
- [Phase 5]: Annotation rendering must not break `data-paragraph-id` stability — validate before Phase 5 plans are finalized

## Session Continuity

Last session: 2026-03-09T14:45:50.613Z
Stopped at: Completed 03-06-PLAN.md — Phase 3 checkpoint, awaiting human browser verification
Resume file: None
