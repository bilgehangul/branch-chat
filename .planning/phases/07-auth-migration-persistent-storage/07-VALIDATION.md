---
phase: 7
slug: auth-migration-persistent-storage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | Jest 30 + ts-jest (CommonJS transform) |
| **Backend config file** | `backend/jest.config.ts` |
| **Backend quick run** | `cd backend && npm test` |
| **Frontend framework** | Vitest 4 + jsdom + @testing-library/react |
| **Frontend config file** | `frontend/vitest.config.ts` |
| **Frontend quick run** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~30 seconds (both suites) |

---

## Sampling Rate

- **After every task commit:** `cd backend && npm test && cd ../frontend && npx vitest run`
- **After every plan wave:** Same — both suites are fast enough for full runs
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 07-01 | 1 | AUTH-04 | integration | `cd backend && npm test -- --testPathPattern=auth` | ✅ (update) | ⬜ pending |
| 7-01-02 | 07-01 | 1 | AUTH-04 | integration | `cd backend && npm test -- --testPathPattern=auth` | ✅ (update) | ⬜ pending |
| 7-02-01 | 07-02 | 1 | AUTH-01, AUTH-03, AUTH-05 | unit | `cd frontend && npx vitest run src/tests/authContext.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 7-02-02 | 07-02 | 1 | AUTH-01, AUTH-02, AUTH-03 | unit | `cd frontend && npx vitest run src/tests/app.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 7-03-01 | 07-03 | 2 | AUTH-02 | unit | `cd backend && npm test -- --testPathPattern=sessions` | ❌ Wave 0 | ⬜ pending |
| 7-03-02 | 07-03 | 2 | AUTH-02 | unit | `cd backend && npm test -- --testPathPattern=sessions` | ❌ Wave 0 | ⬜ pending |
| 7-04-01 | 07-04 | 3 | AUTH-02, AUTH-04 | integration | `cd backend && npm test` | ✅ | ⬜ pending |
| 7-04-02 | 07-04 | 3 | AUTH-02, AUTH-05 | unit | `cd frontend && npx vitest run` | ❌ Wave 0 | ⬜ pending |
| 7-05-01 | 07-05 | 4 | AUTH-01, AUTH-03 | unit | `cd frontend && npx vitest run src/tests/authContext.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 7-05-02 | 07-05 | 4 | AUTH-02, AUTH-04, AUTH-05 | unit+manual | `cd frontend && npx vitest run && cd ../backend && npm test` | ❌ Wave 0 | ⬜ pending |
| 7-05-03 | 07-05 | 4 | ALL AUTH | manual | — (human verification checkpoint) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/authContext.test.tsx` — covers AUTH-01, AUTH-02, AUTH-05; tests AuthProvider signIn/signOut + localStorage (created in Plan 07-05 Task 1)
- [ ] `frontend/src/tests/app.test.tsx` — covers AUTH-03; tests guest path vs signed-in path rendering (created in Plan 07-05 Task 1)
- [ ] `backend/tests/sessions.test.ts` — covers session list + load endpoints with mocked Mongoose (created in Plan 07-03 Task 2)
- [ ] `backend/tests/auth.test.ts` — UPDATE: replace Clerk mock with google-auth-library mock; existing file needs modification in Plan 07-01

*Note: Wave 0 stubs are created in Plans 07-01 and 07-03. Auth tests are updated in 07-01. Frontend tests are written in 07-05.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth consent screen appears and login completes | AUTH-01 | Requires real Google account + browser | Click "Sign in with Google", complete OAuth flow, verify redirect to chat |
| Chat history persists after page refresh | AUTH-02 | Requires real MongoDB connection | Send a chat, refresh page, verify session appears in history |
| Session loads correctly from history list | AUTH-02 | Requires real MongoDB + rendered UI | Click a previous session in history, verify messages load |
| Sign out clears UI and returns to demo chat | AUTH-05 | Requires real browser flow | Click sign out, verify DemoChat shown, verify localStorage cleared |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
