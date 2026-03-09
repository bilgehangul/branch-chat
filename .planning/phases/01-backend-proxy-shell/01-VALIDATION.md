---
phase: 1
slug: backend-proxy-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest + Supertest (Wave 0 installs) |
| **Config file** | `backend/jest.config.ts` — Wave 0 creates |
| **Quick run command** | `cd backend && npx jest tests/auth.test.ts --passWithNoTests` |
| **Full suite command** | `cd backend && npx jest` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest tests/auth.test.ts --passWithNoTests`
- **After every plan wave:** Run `cd backend && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green + manual curl test against local server confirms SSE streaming
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | UI-04 | unit | `cd backend && npx jest tests/providers.test.ts -t "provider factory"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | UI-04 | unit | `cd backend && npx jest tests/providers.test.ts -t "openai stub"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 2 | AUTH-04 | integration | `cd backend && npx jest tests/auth.test.ts -t "returns 401"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 2 | AUTH-04 | integration | `cd backend && npx jest tests/auth.test.ts -t "simplify 401"` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | AUTH-04 | integration | `cd backend && npx jest tests/auth.test.ts -t "find-sources 401"` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 3 | UI-03 | unit | `cd backend && npx jest tests/rateLimiter.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | UI-04 | manual | curl SSE against local server | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/jest.config.ts` — Jest + ts-jest config
- [ ] `backend/tests/auth.test.ts` — 401 stubs for all three routes (chat, simplify, find-sources)
- [ ] `backend/tests/providers.test.ts` — provider factory + OpenAI stub behavior
- [ ] `backend/tests/rateLimiter.test.ts` — keyGenerator unit test (userId for auth, IP for guest)
- [ ] Install: `npm install -D jest @types/jest ts-jest supertest @types/supertest` in backend/

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSE chunks arrive progressively from Gemini | UI-04 | Streaming behavior requires live process | `curl -N -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}],"depth":0}' http://localhost:3001/api/chat` — verify tokens arrive progressively |
| AI_PROVIDER switch works end-to-end | UI-04 | Requires env var change + server restart | Set `AI_PROVIDER=openai`, restart server, hit `/api/chat`, confirm stub error (not a crash) |
| Render SSE proxy passes streaming through | UI-04 | Cloud deployment behavior | Post-deploy curl against Render URL with same command |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
