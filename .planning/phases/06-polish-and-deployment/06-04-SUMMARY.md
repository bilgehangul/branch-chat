---
phase: 06-polish-and-deployment
plan: "04"
subsystem: infra
tags: [vercel, render, github-actions, playwright, vite, deployment, ci]

# Dependency graph
requires:
  - phase: 02-frontend-foundation
    provides: frontend api modules (chat.ts, client.ts, search.ts, simplify.ts)
  - phase: 01-backend-proxy-shell
    provides: Express backend with /api routes on port 3001
provides:
  - .env.example with all 8 required env vars documented
  - render.yaml IaC for Render backend web service (deepdive-backend)
  - frontend/vercel.json with SPA rewrite rule for Vercel monorepo deployment
  - .github/workflows/e2e.yml CI workflow running Playwright on push/PR to main
  - VITE_API_BASE_URL prefix in all frontend API fetch calls for Vercel→Render routing
affects: [deployment, ci, frontend-api-routing]

# Tech tracking
tech-stack:
  added: [render.yaml, vercel.json, github-actions]
  patterns: [VITE_API_BASE_URL prefix pattern for cross-origin API calls in Vite monorepo]

key-files:
  created:
    - .env.example
    - render.yaml
    - frontend/vercel.json
    - .github/workflows/e2e.yml
  modified:
    - frontend/src/api/client.ts
    - frontend/src/api/chat.ts

key-decisions:
  - "frontend/vercel.json placed inside frontend/ subdir — Vercel Root Directory set to frontend/ in dashboard, vercel.json applies relative to that"
  - "VITE_API_BASE_URL defaults to empty string in dev — Vite proxy handles /api→localhost:3001 transparently"
  - "render.yaml CLIENT_ORIGIN uses sync:false — value must be set in Render dashboard after first Vercel deploy (URL not known in advance)"
  - "GitHub Actions CI uses empty VITE_API_BASE_URL — Playwright mocks all API routes via page.route(), no real backend needed"

patterns-established:
  - "API_BASE prefix pattern: const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''; used at module level in each API file"
  - "apiRequest in client.ts is the single chokepoint for all non-streaming API calls — base URL prefix applied once there"
  - "streamChat in chat.ts bypasses apiRequest — requires its own API_BASE prefix"

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 6 Plan 04: Deployment Config Summary

**Vercel + Render deployment IaC with .env.example, render.yaml, vercel.json, GitHub Actions E2E CI, and VITE_API_BASE_URL prefix across all frontend API fetch calls**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-09T21:07:26Z
- **Completed:** 2026-03-09T21:11:30Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments

- Created all four deployment config artifacts: `.env.example`, `render.yaml`, `frontend/vercel.json`, `.github/workflows/e2e.yml`
- Fixed all frontend API fetch calls to prefix with `VITE_API_BASE_URL` — Vercel production deployments now correctly route to Render backend
- Preserved existing 401 auth-expired dispatch in `client.ts` (added by plan 06-03) while adding base URL prefix
- CI workflow installs only Chromium, uses mocked API routes, and uploads playwright-report artifact

## Task Commits

1. **Task 1: .env.example, render.yaml, vercel.json, GitHub Actions workflow** - `a0f6e9cd` (chore)
2. **Task 2: Add VITE_API_BASE_URL prefix to all frontend API fetch calls** - `462fac44` (feat)

## Files Created/Modified

- `.env.example` - Documents all 8 backend+frontend env vars with descriptions and placeholder values
- `render.yaml` - Render IaC for deepdive-backend web service; rootDir: backend, sync:false secrets
- `frontend/vercel.json` - Vite SPA config with catch-all rewrite rule for React Router
- `.github/workflows/e2e.yml` - GitHub Actions CI running Playwright Chromium on push/PR to main
- `frontend/src/api/client.ts` - Added API_BASE constant and `${API_BASE}${path}` fetch prefix
- `frontend/src/api/chat.ts` - Added API_BASE constant and `${API_BASE}/api/chat` fetch prefix

## Decisions Made

- `frontend/vercel.json` placed inside `frontend/` (not repo root) because Vercel's Root Directory is set to `frontend/` in the dashboard — vercel.json is relative to that root
- `VITE_API_BASE_URL` left empty in dev and CI — Vite proxy handles `/api/*` transparently in dev; Playwright mocks routes in CI
- `render.yaml` marks `CLIENT_ORIGIN` as `sync: false` since the Vercel URL is not known until after first frontend deploy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `client.ts` already had the 401 dispatch from plan 06-03 — merged cleanly, only `API_BASE` constant and fetch prefix were new additions
- Vitest picks up `e2e/*.spec.ts` Playwright files causing 6 pre-existing "failures" — these are out of scope (Playwright tests run via `npx playwright test`, not `npx vitest run`); all 152 unit tests pass

## User Setup Required

External services require manual configuration before deploying:

**Render (backend):**
1. Create a new Web Service in Render, connect repo, set Root Directory to `backend/`
2. Or use "Blueprint" to auto-detect `render.yaml`
3. Set secret env vars in Render dashboard: `CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `CLIENT_ORIGIN` (Vercel URL)

**Vercel (frontend):**
1. Import repo in Vercel, set Root Directory to `frontend/`
2. Set env vars: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL` (Render service URL)

**GitHub Actions:**
1. Add secret `VITE_CLERK_PUBLISHABLE_KEY` in repo Settings > Secrets

## Next Phase Readiness

- All deployment infrastructure configured — ready for plan 06-05 (E2E test implementation)
- VITE_API_BASE_URL plumbing in place — production routing will work once env vars are set in Vercel dashboard
- No blockers for phase completion

---
*Phase: 06-polish-and-deployment*
*Completed: 2026-03-09*
