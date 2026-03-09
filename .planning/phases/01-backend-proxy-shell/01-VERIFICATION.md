---
phase: 01-backend-proxy-shell
verified: 2026-03-09T00:00:00Z
status: human_needed
score: 4/4 success criteria verified
re_verification: false
human_verification:
  - test: "curl POST /api/chat with a valid Clerk JWT and observe SSE chunks arriving progressively"
    expected: "Multiple data: {\"type\":\"chunk\",\"text\":\"...\"} lines arriving over the connection, ending with data: {\"type\":\"done\"}"
    why_human: "Live SSE streaming behavior requires a real Clerk JWT and a running server; cannot be verified by static code analysis alone. The code path is correct but the end-to-end streaming contract can only be confirmed at runtime."
  - test: "Set AI_PROVIDER=openai, start the server, hit /api/chat with a valid JWT"
    expected: "Server starts without crashing; response body contains an error from the OpenAI stub, not a startup crash"
    why_human: "Provider switch behavior at startup requires running the process. Static analysis confirms the stub throws, but startup crash vs. runtime error distinction is a runtime property."
---

# Phase 1: Backend Proxy Shell Verification Report

**Phase Goal:** Build a deployable Node/TypeScript Express backend that proxies AI provider calls (Gemini, OpenAI, Tavily) behind Clerk JWT authentication and per-user rate limiting, with three API routes (/chat SSE, /simplify, /find-sources) and a shared type contract with the frontend.
**Verified:** 2026-03-09
**Status:** human_needed (all automated checks passed; 2 items require live server confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A curl request with a valid Clerk JWT to `/chat` returns SSE chunks from Gemini progressively | ? HUMAN | Code path verified: SSE headers set, `flushHeaders()` called, `streamChat()` wired — live runtime confirmation needed |
| 2 | A curl request without a JWT receives a 401 response on every API route | VERIFIED | `requireApiAuth` returns `{data:null,error:{code:'UNAUTHORIZED'}}` on `!userId`; `apiRouter.use(requireApiAuth)` guards all three routes; 4 supertest integration tests confirm this |
| 3 | A curl request to `/simplify` and `/find-sources` returns non-streamed JSON responses | VERIFIED | Both routes call `aiProvider.simplify()` / `searchProvider.findSources()` and return `res.json({data:...,error:null})`; no SSE headers set on these routes |
| 4 | Switching `AI_PROVIDER` env var is the only change required to point the server at a different provider | VERIFIED | `config.ts` is the sole reader of `process.env.AI_PROVIDER`; all route handlers import only `{aiProvider, searchProvider}` from config — no provider-specific imports in routes; 3 factory tests confirm env-var-driven provider selection |

**Score:** 3/4 truths fully automated-verified; Truth 1 requires human (SSE streaming is runtime behavior)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/package.json` | npm manifest with all runtime and dev deps | VERIFIED | Present; contains `@google/genai ^1.44.0`, all expected runtime and dev dependencies present |
| `backend/tsconfig.json` | TypeScript config with module:NodeNext, esModuleInterop, strict | VERIFIED | Present; rootDir changed to `.` (correct fix for TS6059) |
| `backend/.env.example` | Documents all required env vars | VERIFIED | Present; documents all 6 vars: GEMINI_API_KEY, TAVILY_API_KEY, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, AI_PROVIDER, PORT, CLIENT_ORIGIN |
| `backend/jest.config.ts` | Jest + ts-jest configuration | VERIFIED | Present; declared in package.json scripts |
| `backend/tests/auth.test.ts` | 401 integration tests | VERIFIED | Present; 4 real supertest assertions (replaced todos from Plan 01) |
| `backend/tests/providers.test.ts` | Provider factory and OpenAI stub tests | VERIFIED | Present; 6 real tests (3 stub throws + 3 factory instanceof checks) |
| `backend/tests/rateLimiter.test.ts` | keyGenerator behavior tests | VERIFIED | Present; 4 real tests |
| `shared/types.ts` | Canonical Message, ApiResponse, ApiError, SseEvent types | VERIFIED | Present at repo root; exports Role, Message, SearchResult, ApiError, ApiResponse, SseChunkEvent, SseDoneEvent, SseErrorEvent, SseEvent |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/providers/types.ts` | AIProvider and SearchProvider interfaces | VERIFIED | Present; exports AIProvider, SearchProvider, Message, SearchResult |
| `backend/src/providers/gemini.ts` | GeminiProvider implements AIProvider | VERIFIED | Present; uses `@google/genai` GoogleGenAI, `ai.models.generateContentStream()`, `for await` loop, `chunk.text` null-guard, implements both `streamChat()` and `simplify()` |
| `backend/src/providers/tavily.ts` | TavilyProvider implements SearchProvider | VERIFIED | Present; lazy client initialization inside `findSources()`, calls `client.search()` with `maxResults` default 3 |
| `backend/src/providers/openai.ts` | OpenAIProvider stub | VERIFIED | Present; throws `'OpenAIProvider not yet implemented. Set AI_PROVIDER=gemini.'` on both methods |
| `backend/src/providers/openai-search.ts` | OpenAISearchProvider stub | VERIFIED | Present; throws `'OpenAISearchProvider not yet implemented...'` |
| `backend/src/config.ts` | Provider factory exporting aiProvider and searchProvider | VERIFIED | Present; sole reader of `process.env.AI_PROVIDER`; exports typed singletons |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/middleware/auth.ts` | requireApiAuth — 401 JSON if no userId | VERIFIED | Present; calls `getAuth(req)`, returns 401 `{data:null,error:{code:'UNAUTHORIZED',...}}`, calls `next()` when userId present |
| `backend/src/middleware/rateLimiter.ts` | apiRateLimiter — per-user rate limiting | VERIFIED | Present; keyGenerator uses Clerk userId, falls back to `ipKeyGenerator(ip)`, then `'anonymous'` |
| `backend/src/routes/chat.ts` | POST /api/chat SSE streaming | VERIFIED | Present; sets SSE headers, calls `flushHeaders()`, wires `aiProvider.streamChat()` with AbortController on `req.on('close')` |
| `backend/src/routes/simplify.ts` | POST /api/simplify JSON | VERIFIED | Present; validates text + mode, calls `aiProvider.simplify()`, returns `{data:{rewritten},error:null}` |
| `backend/src/routes/find-sources.ts` | POST /api/find-sources JSON | VERIFIED | Present; validates query, calls `searchProvider.findSources(query,3)`, returns `{data:{results},error:null}` |
| `backend/src/routes/index.ts` | apiRouter with requireApiAuth on all routes | VERIFIED | Present; `apiRouter.use(requireApiAuth)` before all three route mounts |
| `backend/src/index.ts` | Express entry point — correct middleware order | VERIFIED | Present; order: (1) `clerkMiddleware()`, (2) `cors()`, (3) `express.json()`, (4) `apiRateLimiter`, (5) `apiRouter` at `/api` |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/tests/auth.test.ts` | `backend/src/index.ts` | `import('../src/index.js')` in `beforeAll` | VERIFIED | `const mod = await import('../src/index.js'); app = mod.app;` — real import, not stub |
| `backend/tests/providers.test.ts` | `backend/src/config.js` | `import('../src/config.js')` inside `jest.isolateModulesAsync` | VERIFIED | Present in all three factory tests |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/src/config.ts` | `backend/src/providers/gemini.ts` | `new GeminiProvider()` in gemini branch | VERIFIED | `PROVIDER === 'openai' ? new OpenAIProvider() : new GeminiProvider()` |
| `backend/src/config.ts` | `backend/src/providers/openai.ts` | `new OpenAIProvider()` in openai branch | VERIFIED | Present in `aiProvider` assignment |
| `backend/src/providers/gemini.ts` | `@google/genai` | `import { GoogleGenAI }` | VERIFIED | `import { GoogleGenAI } from '@google/genai'`; `@google/generative-ai` (deprecated) confirmed ABSENT from node_modules |

### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/src/index.ts` | `backend/src/middleware/auth.ts` | `clerkMiddleware()` first, then `requireApiAuth` on apiRouter | VERIFIED | `app.use(clerkMiddleware())` is first; `apiRouter.use(requireApiAuth)` in routes/index.ts |
| `backend/src/routes/chat.ts` | `backend/src/config.ts` | `import { aiProvider } from '../config.js'` | VERIFIED | Import present; `aiProvider.streamChat()` called directly |
| `backend/src/routes/find-sources.ts` | `backend/src/config.ts` | `import { searchProvider } from '../config.js'` | VERIFIED | Import present; `searchProvider.findSources()` called directly |
| `backend/src/index.ts` | `backend/src/routes/index.ts` | `app.use('/api', apiRouter)` | VERIFIED | `app.use('/api', apiRouter)` present at line 33 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| UI-04 | 01-01, 01-02 | AI provider abstracted behind interface; switching providers requires only env var change | SATISFIED | `config.ts` is sole reader of `AI_PROVIDER`; routes import only `aiProvider`/`searchProvider` singletons; all four provider classes compile; 3 factory tests verify env-var-driven switching |
| AUTH-04 | 01-01, 01-03 | Every backend API call validates the Clerk JWT before processing | SATISFIED | `requireApiAuth` middleware on `apiRouter` guards all three routes; `getAuth(req).userId` check returns 401 when absent; 4 integration tests confirm 401 on all routes without JWT |
| UI-03 | 01-01, 01-03 | Backend enforces per-user (or per-IP) rate limiting on all API routes | SATISFIED | `apiRateLimiter` mounted at `app.use('/api', apiRateLimiter)` before `apiRouter`; keyGenerator uses Clerk userId for authenticated requests and `ipKeyGenerator(ip)` / `'anonymous'` for unauthenticated; 4 keyGenerator unit tests confirm logic |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps only UI-04, AUTH-04, UI-03 to Phase 1. No orphaned requirements found.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None detected | — | — | — | — |

Scanned all `backend/src/` files for: TODO/FIXME/PLACEHOLDER comments, empty return stubs (`return null`, `return {}`, `return []`), console.log-only implementations. No issues found.

One comment in `backend/src/providers/gemini.ts` references `NOT deprecated @google/generative-ai` — this is a guard comment, not a TODO. Confirmed: `@google/generative-ai` is absent from node_modules; only `@google/genai` is installed.

---

## Human Verification Required

### 1. SSE Streaming with Valid Clerk JWT

**Test:** Start the server (`cd backend && npx tsx src/index.ts`) with a real `.env` file, then run:
```
curl -N -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VALID_CLERK_JWT>" \
  -d '{"messages":[{"role":"user","content":"Say hello in 3 words"}],"systemPrompt":""}'
```
**Expected:** Multiple `data: {"type":"chunk","text":"..."}` lines arrive over time, ending with `data: {"type":"done"}`. HTTP status is 200 with `Content-Type: text/event-stream`.
**Why human:** Live SSE streaming requires a real Clerk JWT and a running Gemini API connection. The code path is correct (headers set, `flushHeaders()` called, `streamChat()` wired), but progressive token delivery is a runtime property that cannot be confirmed statically.

*Note: Per 01-03-SUMMARY.md, this was approved at the human-verify checkpoint during development. This item is a regression-safety check.*

### 2. AI_PROVIDER=openai Server Switch

**Test:** Set `AI_PROVIDER=openai` in `backend/.env`, restart the server, then hit any endpoint with a valid JWT.
**Expected:** Server starts without crashing. The endpoint returns an error response (stub throws), but the process does not crash on startup or at request time with an unhandled exception.
**Why human:** The distinction between a graceful stub error response and a startup/runtime crash is a runtime property. Static analysis confirms the OpenAIProvider throws a known error message, but cannot confirm Express handles the thrown error without crashing the process.

*Note: Per 01-03-SUMMARY.md, this was confirmed passing at the checkpoint.*

---

## Gaps Summary

No gaps found. All automated checks passed:

- All 15 source files exist across `backend/src/` and `shared/`
- No files are stubs — all implementations are substantive with real business logic
- All key links are wired: routes import from config singletons, middleware is mounted in correct order, tests import real app modules
- `@google/genai` v1.x installed; deprecated `@google/generative-ai` confirmed absent
- No TODO/FIXME anti-patterns in source files
- All 3 phase requirements (UI-04, AUTH-04, UI-03) are satisfied with code evidence
- 7 commits confirmed in git log matching the 3 plans' documented task commits

The 2 human verification items are confirmation checks for live runtime behavior that was already approved at the Plan 03 human-verify checkpoint. They are not blocking gaps.

---

_Verified: 2026-03-09_
_Verifier: Claude (gsd-verifier)_
