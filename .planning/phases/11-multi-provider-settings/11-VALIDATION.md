---
phase: 11
slug: multi-provider-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Frontend Config** | `frontend/vitest.config.ts` |
| **Frontend Quick Run** | `cd frontend && npx vitest run` |
| **Frontend Full Suite** | `cd frontend && npx vitest run --reporter=verbose` |
| **Backend Framework** | Jest ^30.2.0 + ts-jest |
| **Backend Config** | `backend/package.json` |
| **Backend Quick Run** | `cd backend && npm test` |
| **Backend Full Suite** | `cd backend && npm test -- --verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** `cd frontend && npx vitest run` and `cd backend && npm test`
- **After every plan wave:** Full suite across both frontend and backend
- **Before `/gsd:verify-work`:** Both test suites green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | BKND-01 | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | BKND-04 | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | BKND-05 | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | BKND-02, BKND-03 | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | BKND-06 | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | BKND-07, BKND-08, BKND-09 | unit | `cd backend && npm test -- --testPathPattern=sanitize` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 1 | BKND-10 | unit | `cd backend && npm test -- --testPathPattern=verify` | ❌ W0 | ⬜ pending |
| 11-02-04 | 02 | 1 | BKND-11 | unit | `cd backend && npm test -- --testPathPattern=byokRateLimit` | ❌ W0 | ⬜ pending |
| 11-02-05 | 02 | 1 | BKND-12 | unit | `cd backend && npm test` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 2 | PROV-01 | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | PROV-02, PROV-03, PROV-04, PROV-05 | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | PROV-06, PROV-07 | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-04 | 03 | 2 | PROV-08, PROV-09 | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-05 | 03 | 2 | PROV-12, XCUT-02 | unit | `cd frontend && npx vitest run src/tests/settingsContext.test.ts` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 2 | PROV-13 | unit | `cd frontend && npx vitest run src/tests/cryptoStorage.test.ts` | ❌ W0 | ⬜ pending |
| 11-04-02 | 04 | 2 | PROV-14 | unit | `cd frontend && npx vitest run src/tests/settingsContext.test.ts` | ❌ W0 | ⬜ pending |
| 11-04-03 | 04 | 2 | PROV-10, PROV-11, PROV-15 | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/settingsModal.test.tsx` — stubs for PROV-01, PROV-06, PROV-15, XCUT-02
- [ ] `frontend/src/tests/settingsContext.test.ts` — stubs for PROV-12, PROV-13, PROV-14
- [ ] `frontend/src/tests/cryptoStorage.test.ts` — stubs for PROV-13 (AES-GCM round-trip)
- [ ] `backend/tests/providers.test.ts` — UPDATE existing: remove stub tests, add factory + new provider tests
- [ ] `backend/tests/verifyKey.test.ts` — stubs for BKND-10 (key format validation)
- [ ] `backend/tests/byokRateLimiter.test.ts` — stubs for BKND-11
- [ ] `backend/tests/sanitizeBody.test.ts` — stubs for BKND-07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings modal opens/closes with backdrop | PROV-01 | Browser DOM interaction | Open gear icon, click backdrop, verify closes |
| Key show/hide toggle | PROV-05 | Visual interaction | Enter key, toggle eye icon, verify mask/unmask |
| Model badge clickable in ChatInput | PROV-10 | Visual + navigation | Click badge, verify Settings opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
