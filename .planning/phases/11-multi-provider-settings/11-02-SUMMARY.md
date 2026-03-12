---
phase: 11-multi-provider-settings
plan: 02
subsystem: api
tags: [anthropic, verify-key, byok, rate-limiting, security, typescript, tdd]

# Dependency graph
requires:
  - phase: 11-01
    provides: GeminiProvider, OpenAIProvider, config.ts factory, BYOK route pattern

provides:
  - AnthropicProvider implementing AIProvider (streamChat, simplify, generateCitationNote)
  - POST /api/verify-key endpoint with format validation + lightweight SDK test calls
  - byokRateLimiter middleware (30 req/min per userId)
  - OpenAISearchProvider replacing stub (Responses API + chat fallback)
  - CORS domain-restriction confirmed with startup warning

affects: [11-03-frontend-settings, 11-04-openai-search]

# Tech tracking
tech-stack:
  added: ['@anthropic-ai/sdk']
  patterns:
    - Anthropic system prompt as top-level 'system' param (not in messages array)
    - Anthropic role mapping: internal 'model' -> 'assistant'
    - Key format validation via regex before any SDK call (security gate)
    - Dynamic import for SDKs in verify-key.ts (lazy loading)
    - Error redaction: msg.replace(apiKey, '[REDACTED]') before sending to client
    - Per-user rate limiting via JWT sub with ipKeyGenerator fallback for IPv6 safety
    - OpenAI Responses API with web_search_preview tool for BYOK web search

key-files:
  created:
    - backend/src/providers/anthropic.ts
    - backend/src/routes/verify-key.ts
    - backend/src/middleware/byokRateLimiter.ts
    - backend/tests/verifyKey.test.ts
    - backend/tests/byokRateLimiter.test.ts
    - backend/tests/sanitizeBody.test.ts
  modified:
    - backend/src/config.ts
    - backend/src/routes/index.ts
    - backend/src/index.ts
    - backend/src/providers/openai-search.ts
    - backend/tests/providers.test.ts
    - backend/package.json

key-decisions:
  - "Anthropic systemPrompt passed as top-level 'system' param — Anthropic API does not accept system role in messages array"
  - "byokRateLimiter uses ipKeyGenerator helper for IPv6-safe IP fallback (ERR_ERL_KEY_GEN_IPV6 prevention)"
  - "OpenAISearchProvider uses Responses API with web_search_preview tool; falls back to chat completion if API fails"
  - "verify-key.ts uses dynamic import for SDKs — lazy loading avoids module-level initialization for unused providers"

requirements-completed: [BKND-06, BKND-07, BKND-08, BKND-09, BKND-10, BKND-11, BKND-12]

# Metrics
duration: ~8min
completed: 2026-03-12
---

# Phase 11 Plan 02: Multi-Provider Settings — Anthropic + Security Summary

**AnthropicProvider fully implemented, /api/verify-key endpoint with format validation + key redaction, BYOK rate limiter at 30 req/min per user, OpenAISearchProvider replacing stub with Responses API**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-12T16:53:16Z
- **Completed:** 2026-03-12T17:01:00Z
- **Tasks:** 3 of 3
- **Files created:** 6 | **Files modified:** 5

## Accomplishments

- AnthropicProvider created using `@anthropic-ai/sdk`: streamChat uses `messages.stream()` with `for await` on events, checking `content_block_delta` + `text_delta`; system prompt passed as top-level param; role 'model' mapped to 'assistant'
- `simplify` and `generateCitationNote` use non-streaming `messages.create()`, extracting `content[0].text` with type guard
- `config.ts` `createByokProvider` now handles all 3 providers: gemini, openai, anthropic
- `POST /api/verify-key` validates key format with regex (no SDK call for invalid formats), then makes lightweight test call per provider
- Key format patterns: gemini (`AIza[0-9A-Za-z-_]{35}`), openai (`sk-[A-Za-z0-9-_]{20,}`), anthropic (`sk-ant-[A-Za-z0-9-_]{32,}`)
- Error redaction: `msg.replace(apiKey, '[REDACTED]')` before any error response (BKND-09)
- `byokRateLimiter`: 30 req/min per userId (JWT sub), IPv6-safe IP fallback via `ipKeyGenerator`
- `backend/src/index.ts` CORS confirmed domain-restricted with `CLIENT_ORIGIN` startup warning (BKND-12)
- `OpenAISearchProvider` replaces stub: uses Responses API with `web_search_preview` tool, falls back to chat completion with structured JSON parsing
- 61 total tests pass (7 pre-existing todo), 29 new tests added across 3 new test files

## Task Commits

1. **Task 1: AnthropicProvider + config.ts** — `7facf032` (feat)
2. **Task 2: verify-key + byokRateLimiter + CORS** — `f94461ac` (feat)
3. **Task 3: OpenAISearchProvider real implementation** — `dacb86b3` (feat)

## Files Created

- `backend/src/providers/anthropic.ts` — Full AIProvider implementation using @anthropic-ai/sdk
- `backend/src/routes/verify-key.ts` — POST /api/verify-key with format validation + test calls + error redaction
- `backend/src/middleware/byokRateLimiter.ts` — Per-user 30 req/min rate limiter with IPv6-safe key gen
- `backend/tests/verifyKey.test.ts` — 16 tests: format validation, API calls, error redaction, KEY_PATTERNS
- `backend/tests/byokRateLimiter.test.ts` — 6 tests: config values, keyGenerator behavior
- `backend/tests/sanitizeBody.test.ts` — 3 tests: BYOK key extraction and body scrubbing pattern

## Files Modified

- `backend/src/config.ts` — Added AnthropicProvider import + `if (provider === 'anthropic')` branch
- `backend/src/routes/index.ts` — Registered `/api/verify-key` route after requireApiAuth
- `backend/src/index.ts` — CORS comment (BKND-12) + CLIENT_ORIGIN startup warning
- `backend/src/providers/openai-search.ts` — Full implementation replacing stub
- `backend/tests/providers.test.ts` — Added AnthropicProvider mock + 6 new tests, updated factory test + OpenAISearchProvider tests

## Decisions Made

- Anthropic system prompt must be top-level `system` param — not in messages array (Anthropic API requirement)
- `ipKeyGenerator` used for IP-based fallback in byokRateLimiter to prevent IPv6 bypass (matches pattern in existing rateLimiter.ts)
- `verify-key.ts` uses `await import(...)` dynamic imports to avoid loading all 3 SDKs at module startup
- OpenAISearchProvider Responses API approach chosen over pure chat fallback; chat fallback still present if Responses API fails

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed IPv6 bypass vulnerability in byokRateLimiter**
- **Found during:** Task 2 (during test run — express-rate-limit validation warning)
- **Issue:** Using raw `req.ip` as rate limit key without `ipKeyGenerator` allows IPv6 users to bypass limits (ERR_ERL_KEY_GEN_IPV6)
- **Fix:** Import and use `ipKeyGenerator` from express-rate-limit for the IP fallback path (same fix already applied in rateLimiter.ts)
- **Files modified:** backend/src/middleware/byokRateLimiter.ts
- **Verification:** No more console.error during test run, all 24 tests pass

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor security fix. No scope changes.

## Self-Check

## Self-Check: PASSED

All created files verified:
- backend/src/providers/anthropic.ts — contains `class AnthropicProvider`
- backend/src/routes/verify-key.ts — exports `verifyKeyRouter` and `KEY_PATTERNS`
- backend/src/middleware/byokRateLimiter.ts — exports `byokRateLimiter` and `BYOK_RATE_LIMIT_CONFIG`
- backend/tests/verifyKey.test.ts — 16 tests
- backend/tests/byokRateLimiter.test.ts — 6 tests
- backend/tests/sanitizeBody.test.ts — 3 tests

Commits verified:
- 7facf032 — AnthropicProvider + config.ts
- f94461ac — verify-key + byokRateLimiter + CORS
- dacb86b3 — OpenAISearchProvider real implementation

All tests: 61 pass, 0 fail, 7 todo (pre-existing)
TypeScript: clean (npx tsc --noEmit exits 0)

## Next Phase Readiness

- Frontend settings UI (plan 11-03) can now call POST /api/verify-key to validate user-entered BYOK keys
- All 3 providers instantiatable via createByokProvider — frontend can pass provider+model+apiKey in byok body
- OpenAI BYOK search available in 11-04 via OpenAISearchProvider (key from BYOK settings)

---
*Phase: 11-multi-provider-settings*
*Completed: 2026-03-12*
