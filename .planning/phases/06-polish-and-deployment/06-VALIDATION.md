---
phase: 6
slug: polish-and-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (unit) + Playwright ^1.58.x (E2E) |
| **Config file** | `frontend/vitest.config.ts` (unit) + `frontend/playwright.config.ts` (E2E — Wave 0 gap) |
| **Quick run command** | `cd frontend && npx vitest run` |
| **Full suite command** | `cd frontend && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 seconds (unit) + ~120 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run`
- **After every plan wave:** Run `cd frontend && npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-theme-01 | theme | 1 | UI-01 | E2E | `cd frontend && npx playwright test e2e/root-chat.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-theme-02 | theme | 1 | UI-02 | E2E | `cd frontend && npx playwright test e2e/root-chat.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-env-01 | deploy | 1 | DEPLOY-03 | smoke | `test -f .env.example` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-01 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/auth.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-02 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/root-chat.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-03 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/go-deeper.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-04 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/find-sources.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-05 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/simplify.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-e2e-06 | e2e | 1 | DEPLOY-04 | E2E | `cd frontend && npx playwright test e2e/navigation.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 6-deploy-01 | deploy | 2 | DEPLOY-01 | manual-only | N/A — verify via Vercel dashboard | ❌ manual | ⬜ pending |
| 6-deploy-02 | deploy | 2 | DEPLOY-02 | manual-only | `curl https://xxx.onrender.com/health` | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/playwright.config.ts` — Playwright config with webServer + chromium project
- [ ] `frontend/e2e/fixtures/chat-stream.txt` — SSE fixture for streaming tests
- [ ] `frontend/e2e/fixtures/find-sources.json` — JSON fixture for Find Sources tests
- [ ] `frontend/e2e/fixtures/simplify.json` — JSON fixture for Simplify tests
- [ ] `frontend/e2e/auth.spec.ts` — stub (guest view only, no Clerk network dependency)
- [ ] `frontend/e2e/root-chat.spec.ts` — streaming flow + theme toggle
- [ ] `frontend/e2e/go-deeper.spec.ts` — branch creation flow
- [ ] `frontend/e2e/find-sources.spec.ts` — annotation flow
- [ ] `frontend/e2e/simplify.spec.ts` — simplify flow
- [ ] `frontend/e2e/navigation.spec.ts` — breadcrumb + spine + depth limit
- [ ] `.github/workflows/e2e.yml` — CI workflow
- [ ] `.env.example` — at repo root documenting all required env vars
- [ ] Framework install: `cd frontend && npm install --save-dev @playwright/test && npx playwright install chromium`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frontend live on Vercel, auto-deploys from main | DEPLOY-01 | Requires live Vercel account + DNS | Visit Vercel dashboard, confirm deployment, push a test commit to main, verify auto-deploy triggers |
| Backend live on Render, auto-deploys from main | DEPLOY-02 | Requires live Render account | `curl https://<render-url>/health`, push test commit, verify auto-deploy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
