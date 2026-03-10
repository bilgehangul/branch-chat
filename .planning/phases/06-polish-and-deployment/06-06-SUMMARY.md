---
phase: 06-polish-and-deployment
plan: "06"
subsystem: infra
tags: [nginx, pm2, ec2, ubuntu, certbot, ssl, deployment]

# Dependency graph
requires:
  - phase: 06-04
    provides: frontend Vercel config and backend Render config (now superseded by EC2 approach)
  - phase: 06-05
    provides: Playwright E2E suite to verify app correctness before deploy
provides:
  - nginx site config (deepdive.conf) serving React dist/ on port 80/443 with /api proxy to port 3001
  - PM2 ecosystem config (ecosystem.config.cjs) running Express backend as managed process
  - Deployment runbook for SSH-based EC2 setup (Node 20, PM2, nginx, Certbot SSL)
affects: []

# Tech tracking
tech-stack:
  added: [nginx, pm2, certbot, let's-encrypt]
  patterns:
    - nginx reverse proxy with SSE-aware buffering disabled on /api/chat
    - PM2 process definition with autorestart and log rotation
    - nginx SPA fallback: try_files $uri $uri/ /index.html

key-files:
  created:
    - nginx/deepdive.conf
    - ecosystem.config.cjs
  modified: []

key-decisions:
  - "nginx /api/chat gets separate location block with Connection '' header to keep SSE alive through proxy"
  - "proxy_buffering off on all /api/ routes so SSE tokens stream in real-time instead of buffering until response complete"
  - "PM2 cwd set to /home/ubuntu/child_chats_v1 so logs/ dir resolves relative to repo root"
  - "ecosystem.config.cjs (CommonJS) not ecosystem.config.js (ESM) — PM2 requires .cjs for module.exports syntax"
  - "server_name _ wildcard — config works with bare EC2 IP; replace _ with domain if Certbot adds SSL"

patterns-established:
  - "Pattern: SSE proxy config — separate location block with proxy_buffering off and Connection '' header for long-lived streams"
  - "Pattern: SPA nginx config — root points at dist/, try_files falls back to index.html for client-side routing"

requirements-completed: [DEPLOY-01, DEPLOY-02]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 6 Plan 06: AWS EC2 Deployment Config Summary

**nginx site config + PM2 ecosystem file for single-EC2 deployment serving React frontend (port 80/443) and proxying /api to Express on port 3001 with SSE-aware buffering disabled**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T16:21:12Z
- **Completed:** 2026-03-10T16:26:00Z
- **Tasks:** 1 automated (Task 1 completed in quick-6) + 2 human-action checkpoints
- **Files modified:** 2

## Accomplishments
- Generated `nginx/deepdive.conf` — serves React SPA from `/var/www/deepdive/dist`, reverse-proxies all `/api/*` to `localhost:3001`, has SSE-aware buffering config on `/api/chat` to keep token stream alive through the proxy
- Generated `ecosystem.config.cjs` — PM2 process definition with autorestart, memory cap (500M), log files in `./logs/`, and production NODE_ENV
- Provided complete EC2 deployment runbook in Checkpoint 1 (Node 20 via NodeSource, PM2 global install, nginx, Certbot SSL)
- Provided SSL setup instructions in Checkpoint 2 (Certbot --nginx, CLIENT_ORIGIN update, Google OAuth authorized origins)

## Task Commits

1. **Task 1: Generate nginx config and PM2 ecosystem file** - `5e7aa184` (chore — created as part of quick-6 planning update)

**Plan metadata:** (docs commit — see state updates)

## Files Created/Modified
- `nginx/deepdive.conf` - nginx site config: SPA serving from `/var/www/deepdive/dist`, `/api/` proxy to port 3001 with SSE buffering off, dedicated `/api/chat` block with `Connection ''` for long-lived streams
- `ecosystem.config.cjs` - PM2 process definition: `deepdive-backend`, script `./backend/dist/index.js`, cwd `/home/ubuntu/child_chats_v1`, PORT 3001, autorestart true, 500M memory cap

## Decisions Made
- nginx `/api/chat` gets its own location block with `proxy_set_header Connection ''` (empty string, not `upgrade`) to keep SSE connection persistent — the general `/api/` block uses `Connection 'upgrade'` for WebSocket compatibility
- `proxy_buffering off` on both `/api/` and `/api/chat` — essential for SSE tokens to appear progressively rather than buffering until stream end
- PM2 `.cjs` extension required because `module.exports` syntax (CommonJS) is used — PM2 treats `.js` as ESM if `package.json` has `"type": "module"`
- `server_name _;` wildcard catches any hostname — works with bare IP; Certbot replaces this automatically when SSL is provisioned

## Deviations from Plan

None — Task 1 was already completed in quick task 6 (commit 5e7aa184) as part of the EC2 deployment planning update. Files match the plan specification exactly.

## User Setup Required

**Human action required — two SSH deployment checkpoints pending.** See Checkpoint 1 and Checkpoint 2 instructions in the plan file:

**Checkpoint 1 — Initial EC2 setup (blocking):**
1. SSH into EC2 Ubuntu instance
2. Install Node 20 (NodeSource), PM2 globally, nginx, Certbot
3. Clone/pull repo, `npm install && npm run build` in both `backend/` and `frontend/`
4. Copy `frontend/dist/*` to `/var/www/deepdive/dist/`
5. Install nginx config: `sudo cp nginx/deepdive.conf /etc/nginx/sites-available/deepdive` + enable + test
6. Create `backend/.env` with `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_CLIENT_ID`, `CLIENT_ORIGIN`, `MONGODB_URI`, `NODE_ENV=production`, `PORT=3001`
7. `mkdir -p logs && pm2 start ecosystem.config.cjs && pm2 startup && pm2 save`
8. Verify: `curl http://localhost:3001/health` and `curl http://localhost/api/health`

**Checkpoint 2 — SSL + full stack verification (optional but recommended):**
1. If domain available: `sudo certbot --nginx -d yourdomain.com`
2. Update `CLIENT_ORIGIN` in `.env` to `https://yourdomain.com`, restart PM2
3. Add EC2 IP or domain to Google Cloud Console → OAuth 2.0 Client IDs → Authorized JavaScript origins
4. Verify all 5 checklist items: health endpoint 200, React app loads, Google OAuth works, streaming chat works, no CORS errors

## Next Phase Readiness
- Both deployment config files are committed and ready to use on EC2
- Human deployment (Checkpoints 1 and 2) is the remaining work before DEPLOY-01 and DEPLOY-02 are satisfied in production
- Once deployed, run `curl https://[EC2-IP-or-domain]/api/health` to confirm end-to-end

---
*Phase: 06-polish-and-deployment*
*Completed: 2026-03-10*
