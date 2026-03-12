---
phase: 11-multi-provider-settings
plan: 01
subsystem: api
tags: [openai, gemini, providers, byok, factory-pattern, typescript]

# Dependency graph
requires:
  - phase: prior backend phases
    provides: AIProvider interface, GeminiProvider, config.ts singleton pattern

provides:
  - GeminiProvider with constructor(apiKey, model?) injection, FREE_TIER_MODELS narrowed to 2
  - Full OpenAIProvider implementation with streamChat, simplify, generateCitationNote
  - config.ts factory functions: getDefaultProvider(), createByokProvider(), getDefaultSearchProvider()
  - All three API routes accept optional byok body field for per-request provider creation

affects: [11-02-anthropic, 11-03-frontend-settings, 11-04-openai-search, future BYOK UI]

# Tech tracking
tech-stack:
  added: [openai npm SDK]
  patterns:
    - Factory pattern for provider instantiation (getDefaultProvider / createByokProvider)
    - Constructor injection for AI provider credentials (apiKey + model in constructor)
    - Per-request BYOK: extract rawApiKey, scrub from body, create provider, call method
    - Role mapping: internal 'model' role maps to 'assistant' for OpenAI API

key-files:
  created: []
  modified:
    - backend/src/providers/gemini.ts
    - backend/src/providers/openai.ts
    - backend/src/config.ts
    - backend/src/routes/chat.ts
    - backend/src/routes/simplify.ts
    - backend/src/routes/find-sources.ts
    - backend/tests/providers.test.ts

key-decisions:
  - "GeminiProvider FREE_TIER_MODELS narrowed to ['gemini-2.0-flash', 'gemini-2.0-flash-lite'] only"
  - "config.ts no longer reads AI_PROVIDER env var — factory functions replace env-based switching"
  - "BYOK apiKey extracted from body and deleted immediately before any downstream processing"
  - "Search provider always uses default in find-sources.ts (BYOK search deferred to plan 11-04)"
  - "SIMPLIFY_PROMPTS and FREE_TIER_MODELS exported from gemini.ts for OpenAIProvider reuse"

patterns-established:
  - "BYOK pattern: const rawApiKey = byok?.apiKey; delete byok.apiKey; const provider = rawApiKey ? createByokProvider(...) : getDefaultProvider();"
  - "OpenAI role mapping: m.role === 'model' ? 'assistant' : m.role"

requirements-completed: [BKND-01, BKND-02, BKND-03, BKND-04, BKND-05]

# Metrics
duration: 25min
completed: 2026-03-12
---

# Phase 11 Plan 01: Multi-Provider Settings Summary

**Backend refactored from singleton provider to factory pattern with full OpenAI SDK implementation, enabling per-request BYOK provider creation across all three AI routes**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-12T17:00:00Z
- **Completed:** 2026-03-12T17:25:00Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- GeminiProvider refactored to constructor injection (apiKey, model?) — no module-level GoogleGenAI instantiation
- FREE_TIER_MODELS narrowed from 6 to 2: `['gemini-2.0-flash', 'gemini-2.0-flash-lite']`
- Full OpenAIProvider implemented using openai npm SDK: streamChat with async iteration, simplify, generateCitationNote
- config.ts replaced singleton exports with `getDefaultProvider()`, `getDefaultSearchProvider()`, `createByokProvider()`
- All three routes (chat, simplify, find-sources) accept optional `byok` body field and create per-request providers
- API keys scrubbed from request body immediately after extraction (security requirement BKND-07/08)
- 15 provider tests added covering constructor injection, fallback behavior, OpenAI role mapping, factory functions

## Task Commits

1. **Task 1: Refactor GeminiProvider** - `cb3e0c90` (feat)
2. **Task 2: OpenAIProvider + config.ts factory** - `a42d1d93` (feat)
3. **Task 3: Update API routes to accept BYOK** - `bdb54173` (feat)

## Files Created/Modified

- `backend/src/providers/gemini.ts` - Constructor injection, exported FREE_TIER_MODELS and SIMPLIFY_PROMPTS
- `backend/src/providers/openai.ts` - Full implementation replacing stub (streamChat, simplify, generateCitationNote)
- `backend/src/config.ts` - Factory functions replacing singleton exports; removed AI_PROVIDER env var logic
- `backend/src/routes/chat.ts` - BYOK extraction, provider creation, key scrubbing
- `backend/src/routes/simplify.ts` - Same BYOK pattern
- `backend/src/routes/find-sources.ts` - BYOK for AI provider; search always uses default
- `backend/tests/providers.test.ts` - Complete rewrite: TDD tests for all new behaviors

## Decisions Made

- FREE_TIER_MODELS narrowed from 6 to 2 per prior user decision (preview/pro models hammer rate limits)
- config.ts no longer switches on AI_PROVIDER env var — factory pattern makes it obsolete
- Search provider always defaults in find-sources.ts; BYOK for search is deferred to plan 11-04
- SIMPLIFY_PROMPTS exported from gemini.ts and imported by openai.ts to avoid duplication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed mock interop for openai SDK in Jest/ts-jest**
- **Found during:** Task 1+2 TDD (GREEN phase)
- **Issue:** `jest.mock('openai', ...)` without `__esModule: true` caused `openai_1.default is not a constructor` error in ts-jest CommonJS compilation
- **Fix:** Added `__esModule: true` to both `@google/genai` and `openai` mocks; hoisted `mockChatCreate` to module scope
- **Files modified:** backend/tests/providers.test.ts
- **Verification:** All 15 provider tests pass
- **Committed in:** cb3e0c90 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Mock interop fix required for test infrastructure. No scope changes.

## Issues Encountered

- auth.test.ts failed after config.ts refactor (it imports chat.ts which imported old `aiProvider` singleton). Resolved by completing Task 3 (routes update) before final test run — correct sequence, no regression.

## Self-Check

## Self-Check: PASSED

All committed files verified present:
- backend/src/providers/gemini.ts — contains `constructor(apiKey: string, model?: string)`
- backend/src/providers/openai.ts — contains `chat.completions.create`
- backend/src/config.ts — exports `getDefaultProvider`, `createByokProvider`, `getDefaultSearchProvider`
- backend/src/routes/chat.ts — imports from `'../config.js'` using new factory functions
- backend/tests/providers.test.ts — 15 tests, all passing

Commits verified:
- cb3e0c90 — GeminiProvider refactor
- a42d1d93 — OpenAIProvider + config.ts
- bdb54173 — Routes BYOK

## Next Phase Readiness

- Backend is ready for plan 11-02: Anthropic/Claude provider implementation (createByokProvider already throws on 'anthropic' with placeholder comment)
- Frontend settings UI (plan 11-03) can wire up to the BYOK body field pattern established here
- All tests passing; TypeScript clean

---
*Phase: 11-multi-provider-settings*
*Completed: 2026-03-12*
