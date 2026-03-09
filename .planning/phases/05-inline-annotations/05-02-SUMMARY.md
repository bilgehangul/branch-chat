---
phase: 05-inline-annotations
plan: 02
subsystem: store, api, backend-providers
tags: [store-action, api-types, provider-interface, tdd]
dependency_graph:
  requires: [05-01]
  provides: [updateAnnotation-action, corrected-api-types, generateCitationNote-backend]
  affects: [frontend/src/store/sessionStore.ts, frontend/src/api/simplify.ts, frontend/src/api/search.ts, backend/src/providers/types.ts, backend/src/providers/gemini.ts, backend/src/routes/find-sources.ts]
tech_stack:
  added: []
  patterns: [tdd-red-green, immutable-zustand-map, provider-fallback-chain, non-fatal-ai-fallback]
key_files:
  created: []
  modified:
    - frontend/src/store/sessionStore.ts
    - frontend/src/api/simplify.ts
    - frontend/src/api/search.ts
    - frontend/src/tests/sessionStore.annotations.test.ts
    - backend/src/providers/types.ts
    - backend/src/providers/gemini.ts
    - backend/src/providers/openai.ts
    - backend/src/routes/find-sources.ts
decisions:
  - "OpenAIProvider stub implements generateCitationNote throwing NotImplementedError — satisfies interface contract without real implementation"
  - "Citation note failure in find-sources is non-fatal — empty string fallback preserves search results for UI"
  - "toSourceResult() exported from search.ts — ThreadView handler can convert backend SearchResult to frontend SourceResult when constructing Annotation"
metrics:
  duration: 4 min
  completed: 2026-03-09
  tasks: 2
  files_modified: 8
---

# Phase 5 Plan 02: API Shape Fixes and updateAnnotation Action Summary

Fix four API shape mismatches identified in research and add the missing `updateAnnotation` store action — using TDD for the store action; both TypeScript compilation targets end clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD) | Add updateAnnotation store action + fix API response types | 767a1ed | sessionStore.ts, simplify.ts, search.ts, sessionStore.annotations.test.ts |
| 2 | Extend backend find-sources route with Gemini-generated citation note | e22c529 | types.ts, gemini.ts, openai.ts, find-sources.ts |

## What Was Built

**Task 1 — TDD (RED → GREEN):**

- `updateAnnotation(messageId, annotationId, patch: Partial<Annotation>)` added to `SessionState` interface and `useSessionStore` implementation
- Immutable map pattern mirrors `updateMessage` exactly — `.map()` produces new object references
- `simplify.ts` response type corrected from `{ text: string }` to `{ rewritten: string }` — matches backend `/api/simplify` response
- `search.ts` response type corrected from `SearchResult[]` to `{ results: SearchResult[]; citationNote: string }` — matches extended backend response
- `toSourceResult(r: SearchResult): SourceResult` exported from `search.ts` — converts backend search shape to frontend annotation shape
- 4 tests written and passing: patch application, unchanged siblings, no-op for unknown id, immutable reference

**Task 2 — Backend extension:**

- `generateCitationNote(results: SearchResult[], originalText: string): Promise<string>` added to `AIProvider` interface in `types.ts`
- `GeminiProvider.generateCitationNote()` implemented with `FREE_TIER_MODELS` fallback chain — same pattern as `simplify()`
- `OpenAIProvider` stub updated to implement `generateCitationNote()` (throws `NotImplementedError`) — satisfies interface
- `find-sources.ts` imports `aiProvider` from `config.ts` and calls `generateCitationNote()` after search
- Citation note failure is non-fatal — empty string fallback, search results still returned
- Response envelope extended: `{ data: { results, citationNote }, error: null }`

## Success Criteria Verification

- `updateAnnotation` callable via `useSessionStore(s => s.updateAnnotation)` — YES (interface + implementation present)
- `simplify.ts` response type is `{ rewritten: string }` — YES
- `search.ts` response type is `{ results: SearchResult[]; citationNote: string }` — YES
- `toSourceResult()` exported from search.ts — YES
- Backend `/api/find-sources` returns `{ data: { results, citationNote }, error: null }` — YES
- Frontend TypeScript compiles clean — YES
- Backend TypeScript compiles clean — YES
- All 121 frontend tests pass — YES

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] OpenAIProvider missing generateCitationNote stub**
- **Found during:** Task 2, after adding method to AIProvider interface
- **Issue:** OpenAIProvider implements AIProvider but had no `generateCitationNote` method — TypeScript compilation would fail
- **Fix:** Added stub method that throws `NotImplementedError` (same pattern as `simplify` stub)
- **Files modified:** `backend/src/providers/openai.ts`
- **Commit:** e22c529

## Self-Check: PASSED

All modified files confirmed present. All commits (d7dc428, 767a1ed, e22c529) confirmed in git log.
