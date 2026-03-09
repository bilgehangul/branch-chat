---
phase: 01-backend-proxy-shell
plan: 02
subsystem: api
tags: [typescript, jest, gemini, tavily, openai, provider-pattern, tdd]

# Dependency graph
requires:
  - phase: 01-backend-proxy-shell
    plan: 01
    provides: backend scaffold with ts-jest infrastructure and Wave 0 stub test files
provides:
  - AIProvider and SearchProvider TypeScript interfaces (streamChat, simplify, findSources)
  - GeminiProvider implements AIProvider via @google/genai v1.x streaming
  - TavilyProvider implements SearchProvider via @tavily/core with lazy client init
  - OpenAIProvider stub (throws "not yet implemented" on all methods)
  - OpenAISearchProvider stub (throws "not yet implemented" on findSources)
  - config.ts provider factory — only place that reads AI_PROVIDER env var
affects:
  - 01-backend-proxy-shell (Plan 03 imports aiProvider and searchProvider from config.ts)
  - 02-frontend-shell

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Provider abstraction pattern — interfaces designed from UI feature names (streamChat, simplify, findSources), not from SDK shape
    - Lazy client initialization in TavilyProvider to avoid throwing on missing API key during tests
    - jest.isolateModulesAsync() for testing module-level env var evaluation in config.ts
    - Factory singleton pattern in config.ts — single file reads AI_PROVIDER, exports typed singletons

key-files:
  created:
    - backend/src/providers/types.ts
    - backend/src/providers/gemini.ts
    - backend/src/providers/tavily.ts
    - backend/src/providers/openai.ts
    - backend/src/providers/openai-search.ts
    - backend/src/config.ts
  modified:
    - backend/tests/providers.test.ts
    - backend/tsconfig.json

key-decisions:
  - "TavilyProvider uses lazy client init (in findSources, not module level) — avoids throwing on missing TAVILY_API_KEY during tests"
  - "Factory tests use jest.isolateModulesAsync() + constructor.name check — avoids class identity mismatch when module cache is reset"
  - "config.ts is the ONLY file reading process.env.AI_PROVIDER — route handlers never branch on provider type"
  - "tsconfig.json rootDir changed from ./src to . — fix for pre-existing TS6059 errors when tests/ was included but outside rootDir"

patterns-established:
  - "Provider interface pattern: route handlers import { aiProvider, searchProvider } from config.ts — never import from provider files directly"
  - "Stub pattern: throw new Error('X not yet implemented') forces interface completeness before second real provider needed"

requirements-completed:
  - UI-04

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 01 Plan 02: Provider Abstraction Layer Summary

**AIProvider and SearchProvider TypeScript interfaces with GeminiProvider + TavilyProvider real implementations and OpenAI stubs, wired through a config.ts factory that switches providers via AI_PROVIDER env var**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T10:44:09Z
- **Completed:** 2026-03-09T10:48:19Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Five provider files (types.ts + 4 concrete classes) compile cleanly with zero TypeScript errors
- GeminiProvider streams via `ai.models.generateContentStream()` + `for await` loop with `chunk.text` null-guard
- TavilyProvider uses lazy `tavily()` client initialization to avoid test-environment failures
- config.ts factory pattern — route handlers never branch on AI_PROVIDER, just use the singleton
- All 6 provider tests pass: 3 OpenAI stub throw-checks + 3 factory instantiation checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Define provider interfaces and implement provider classes** - `bf903f1` (feat)
2. **Task 2: Create provider factory in config.ts and add factory tests** - `06bb250` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `backend/src/providers/types.ts` - AIProvider, SearchProvider, Message, SearchResult interfaces
- `backend/src/providers/gemini.ts` - GeminiProvider with streamChat and simplify via @google/genai
- `backend/src/providers/tavily.ts` - TavilyProvider with lazy client init via @tavily/core
- `backend/src/providers/openai.ts` - OpenAIProvider stub throwing "not yet implemented"
- `backend/src/providers/openai-search.ts` - OpenAISearchProvider stub throwing "not yet implemented"
- `backend/src/config.ts` - Provider factory; sole reader of AI_PROVIDER env var
- `backend/tests/providers.test.ts` - 6 tests: 3 stub throw-checks, 3 factory instanceof checks
- `backend/tsconfig.json` - Changed rootDir from ./src to . (pre-existing TS6059 fix)

## Decisions Made
- **Lazy TavilyProvider initialization:** The `@tavily/core` `tavily()` client throws on construction when `TAVILY_API_KEY` is missing. Moving initialization inside `findSources()` keeps tests clean without requiring env setup.
- **jest.isolateModulesAsync() for factory tests:** `jest.resetModules()` + `dynamic import` causes class identity mismatch (same name, different class object across module instances). Using `jest.isolateModulesAsync()` with `constructor.name` string check avoids this.
- **tsconfig.json rootDir fix:** Pre-existing TS6059 error — `tests/` was in `include` but `rootDir` was `./src`. Changed to `"."` so both `src/` and `tests/` are in scope for type checking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tsconfig.json rootDir conflict**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `rootDir: "./src"` but `include` had `tests/**/*` — TS6059 errors prevented clean compilation
- **Fix:** Changed `rootDir` from `"./src"` to `"."` so both `src/` and `tests/` are within rootDir scope
- **Files modified:** backend/tsconfig.json
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** bf903f1 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed TavilyProvider crashing on missing TAVILY_API_KEY in tests**
- **Found during:** Task 2 (factory tests running)
- **Issue:** Module-level `tavily({ apiKey: ... })` throws "No API key provided" when env var absent, causing test suite to fail entirely
- **Fix:** Moved `tavily()` client construction inside `findSources()` method (lazy init)
- **Files modified:** backend/src/providers/tavily.ts
- **Verification:** All 6 tests pass without TAVILY_API_KEY set
- **Committed in:** 06bb250 (Task 2 commit)

**3. [Rule 1 - Bug] Used jest.isolateModulesAsync() instead of jest.resetModules()**
- **Found during:** Task 2 (factory tests failing with class identity mismatch)
- **Issue:** `jest.resetModules()` + `await import()` creates fresh module instances for provider classes, breaking `toBeInstanceOf()` since GeminiProvider in test file !== GeminiProvider in freshly-loaded config module
- **Fix:** Switched to `jest.isolateModulesAsync()` + `constructor.name` string check
- **Files modified:** backend/tests/providers.test.ts
- **Verification:** All 6 tests pass including factory tests
- **Committed in:** 06bb250 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All fixes necessary for TypeScript correctness and test reliability. No scope creep.

## Issues Encountered
- The plan's suggested `jest.resetModules()` + `await import()` pattern for factory tests does not work reliably in ts-jest CommonJS mode due to module class identity mismatch. `jest.isolateModulesAsync()` with `constructor.name` checks is the correct approach for this pattern.

## User Setup Required
None - no external service configuration required at this stage. Environment variables (GEMINI_API_KEY, TAVILY_API_KEY) are needed at runtime but not for running tests.

## Next Phase Readiness
- Provider abstraction complete — Plan 03 can import `{ aiProvider, searchProvider }` from `config.ts` to build route handlers
- Interface contract is locked: `streamChat()`, `simplify()`, `findSources()` method names
- No blockers

---
*Phase: 01-backend-proxy-shell*
*Completed: 2026-03-09*
