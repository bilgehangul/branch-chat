---
phase: 2
slug: frontend-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.x + @testing-library/react |
| **Config file** | `frontend/vitest.config.ts` (or inline in vite.config.ts under `test:`) |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | scaffold | build | `cd frontend && npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 2-01-02 | 01 | 1 | AUTH-01/02 | component | `vitest run tests/unit/App.test.tsx` | Wave 0 | ⬜ pending |
| 2-01-03 | 01 | 1 | AUTH-03 | component | `vitest run tests/unit/DemoChat.test.tsx` | Wave 0 | ⬜ pending |
| 2-02-01 | 02 | 1 | store | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 | ⬜ pending |
| 2-02-02 | 02 | 1 | store | unit | `vitest run tests/unit/selectors.test.ts` | Wave 0 | ⬜ pending |
| 2-02-03 | 02 | 1 | AUTH-05 | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 | ⬜ pending |
| 2-03-01 | 03 | 2 | SSE client | unit | `vitest run tests/unit/api.chat.test.ts` | Wave 0 | ⬜ pending |
| 2-03-02 | 03 | 2 | AUTH-01/02 | manual | See manual verifications table | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/vitest.config.ts` — test environment `jsdom`, `globals: true`, `setupFiles: ['./src/tests/setup.ts']`
- [ ] `frontend/src/tests/setup.ts` — imports `@testing-library/jest-dom`, defines Clerk mock via `vi.mock('@clerk/clerk-react')`
- [ ] `frontend/tests/unit/sessionStore.test.ts` — stubs for all store action tests + reset pattern
- [ ] `frontend/tests/unit/selectors.test.ts` — stubs for `currentThread`, `selectThreadAncestry`, `isAtMaxDepth`
- [ ] `frontend/tests/unit/App.test.tsx` — stubs for `SignedIn`/`SignedOut` conditional rendering
- [ ] `frontend/tests/unit/DemoChat.test.tsx` — stubs for disabled input, CTA text, no-fetch assertion
- [ ] `frontend/tests/unit/api.chat.test.ts` — stubs for SSE chunk parsing, buffering, DONE sentinel

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth sign-in redirects correctly and returns to app | AUTH-02 | Requires a real Google account + Clerk Dashboard config | Open app, click Sign In, choose Google, complete OAuth flow, verify landing on blank chat |
| Clerk modal opens/closes without navigation side effects | AUTH-01 | Requires browser interaction to verify URL does not change | Click Sign In button, verify URL stays on `/`, verify modal dismisses on backdrop click |
| Dark mode class applied correctly on initial load | scaffold | Requires visual inspection in browser | Load app in browser, inspect `<html>` or `<body>` for `.dark` class |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
