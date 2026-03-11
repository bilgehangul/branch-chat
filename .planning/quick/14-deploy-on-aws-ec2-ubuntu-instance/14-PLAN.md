---
phase: quick
plan: 14
type: execute
wave: 1
depends_on: []
files_modified:
  - deploy/setup-ec2.sh
  - deploy/redeploy.sh
  - deploy/nginx.conf
  - ecosystem.config.cjs
  - .env.example
autonomous: false
requirements: []
must_haves:
  truths:
    - "setup-ec2.sh provisions a fresh Ubuntu EC2 instance with Node 20, nginx, PM2, and all app dependencies"
    - "redeploy.sh pulls latest code, rebuilds, and restarts PM2 without downtime gaps"
    - "nginx proxies /api to Node backend with SSE streaming support and serves frontend SPA"
    - "All env templates reference Google OAuth (not Clerk) and MongoDB Atlas"
    - "PM2 ecosystem config paths and app name are consistent across all scripts"
  artifacts:
    - path: deploy/setup-ec2.sh
      provides: "First-time EC2 provisioning script"
    - path: deploy/redeploy.sh
      provides: "Zero-downtime redeploy script"
    - path: deploy/nginx.conf
      provides: "Nginx reverse proxy config with SSE support"
    - path: ecosystem.config.cjs
      provides: "PM2 process manager config"
  key_links:
    - from: deploy/setup-ec2.sh
      to: ecosystem.config.cjs
      via: "pm2 start ecosystem.config.cjs"
    - from: deploy/nginx.conf
      to: "localhost:3001"
      via: "proxy_pass for /api/"
---

<objective>
Update all deployment scripts and configs for AWS EC2 Ubuntu to reflect the current project state: Google OAuth (not Clerk), MongoDB Atlas, correct directory paths, and consistent PM2 naming.

Purpose: The existing deploy/ scripts are stale — they reference Clerk auth, use wrong APP_DIR paths vs ecosystem.config.cjs paths, and the PM2 app name differs between setup-ec2.sh ("branch-chat-backend") and ecosystem.config.cjs ("deepdive-backend"). This plan brings everything into alignment so a fresh EC2 deploy works end-to-end.

Output: Updated deploy/setup-ec2.sh, deploy/redeploy.sh, deploy/nginx.conf, ecosystem.config.cjs, .env.example
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Current auth: Google OAuth via @react-oauth/google (frontend) and google-auth-library (backend). NOT Clerk.
Database: MongoDB via mongoose (backend/.env needs MONGODB_URI).
Backend env vars needed: GEMINI_API_KEY, TAVILY_API_KEY, GOOGLE_CLIENT_ID, AI_PROVIDER, PORT, CLIENT_ORIGIN, MONGODB_URI, NODE_ENV
Frontend env vars needed: VITE_GOOGLE_CLIENT_ID, VITE_API_BASE_URL

Key inconsistencies to fix:
1. setup-ec2.sh references CLERK_SECRET_KEY and VITE_CLERK_PUBLISHABLE_KEY (should be GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID)
2. setup-ec2.sh uses APP_DIR="/var/www/branch-chat" but ecosystem.config.cjs uses cwd="/home/ubuntu/child_chats_v1"
3. setup-ec2.sh starts PM2 with name "branch-chat-backend" but ecosystem.config.cjs uses "deepdive-backend"
4. setup-ec2.sh starts PM2 via `pm2 start dist/index.js` instead of using ecosystem.config.cjs
5. .env.example still references Clerk and Render/Vercel deployment
6. nginx.conf root path "/var/www/branch-chat/frontend/dist" must match chosen APP_DIR
7. redeploy.sh checks for .env.local with Clerk key reference
8. Missing MONGODB_URI from setup-ec2.sh env template
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update all deploy scripts and configs with correct auth, paths, and PM2 naming</name>
  <files>deploy/setup-ec2.sh, deploy/redeploy.sh, deploy/nginx.conf, ecosystem.config.cjs, .env.example</files>
  <action>
Standardize on APP_DIR="/home/ubuntu/deepdive-chat" across ALL files (setup-ec2.sh, redeploy.sh, nginx.conf, ecosystem.config.cjs). Use PM2 app name "deepdive-backend" everywhere.

**deploy/setup-ec2.sh:**
- Change APP_DIR to "/home/ubuntu/deepdive-chat"
- Update REPO to current GitHub repo URL (keep bilgehangul username, use repo name "deepdive-chat" or keep "branch-chat" — check git remote)
- Replace backend .env template: remove CLERK_SECRET_KEY, add GOOGLE_CLIENT_ID, add MONGODB_URI, keep GEMINI_API_KEY, TAVILY_API_KEY, AI_PROVIDER, PORT, CLIENT_ORIGIN, NODE_ENV
- Replace frontend .env.local template: remove VITE_CLERK_PUBLISHABLE_KEY, add VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID, set VITE_API_BASE_URL= (empty, nginx proxies)
- Change PM2 start command to: `pm2 start "$APP_DIR/ecosystem.config.cjs"` (use the ecosystem file, not direct script)
- Add `mkdir -p "$APP_DIR/logs"` before PM2 start (ecosystem.config.cjs references ./logs/)

**deploy/redeploy.sh:**
- Change APP_DIR to "/home/ubuntu/deepdive-chat"
- Update env file check: check for backend/.env (not frontend/.env.local with Clerk reference)
- Change pm2 restart to use "deepdive-backend" (matching ecosystem.config.cjs)

**deploy/nginx.conf:**
- Update root path to /home/ubuntu/deepdive-chat/frontend/dist
- Keep SSE streaming config (proxy_buffering off, proxy_read_timeout 300s) — it is correct
- Add separate location block for /api/chat with `proxy_set_header Connection '';` for SSE (per Phase 06-06 decision)

**ecosystem.config.cjs:**
- Update cwd to '/home/ubuntu/deepdive-chat'
- Keep name as 'deepdive-backend' (already correct)
- Keep script as './backend/dist/index.js' (relative to cwd)
- Update log paths to './logs/pm2-error.log' and './logs/pm2-out.log' (already correct)

**.env.example:**
- Update backend section: remove CLERK_SECRET_KEY, add GOOGLE_CLIENT_ID, add MONGODB_URI
- Update frontend section: remove VITE_CLERK_PUBLISHABLE_KEY, add VITE_GOOGLE_CLIENT_ID
- Update production comments to reference AWS EC2 (not Vercel/Render)
- Keep development defaults intact

Verify git remote to get correct repo URL:
```bash
git remote get-url origin
```
Use that URL in setup-ec2.sh REPO variable.
  </action>
  <verify>
    <automated>grep -c "CLERK" deploy/setup-ec2.sh deploy/redeploy.sh .env.example 2>/dev/null | grep -v ":0$" | wc -l</automated>
    Zero lines means no Clerk references remain. Also verify:
    - grep "deepdive-chat" deploy/setup-ec2.sh deploy/redeploy.sh deploy/nginx.conf ecosystem.config.cjs (all use same path)
    - grep "deepdive-backend" deploy/setup-ec2.sh deploy/redeploy.sh ecosystem.config.cjs (all use same PM2 name)
    - grep "GOOGLE_CLIENT_ID" deploy/setup-ec2.sh .env.example (present in both)
    - grep "MONGODB_URI" deploy/setup-ec2.sh .env.example (present in both)
    - grep "ecosystem.config.cjs" deploy/setup-ec2.sh (setup uses ecosystem file)
  </verify>
  <done>
    All deploy scripts and configs use consistent paths (/home/ubuntu/deepdive-chat), consistent PM2 name (deepdive-backend), reference Google OAuth (not Clerk), include MONGODB_URI, and setup-ec2.sh uses ecosystem.config.cjs for PM2 start.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Updated all EC2 deployment scripts and configs to reflect current auth (Google OAuth), database (MongoDB Atlas), consistent paths and PM2 naming.</what-built>
  <how-to-verify>
    1. Review deploy/setup-ec2.sh — confirm env var template looks correct for your setup
    2. Review deploy/nginx.conf — confirm paths match your intended EC2 directory
    3. Review ecosystem.config.cjs — confirm cwd path
    4. If you have an EC2 instance ready, SSH in and run: `bash deploy/setup-ec2.sh`
    5. After editing .env files with real values, confirm the app starts and is reachable at http://YOUR_EC2_IP
  </how-to-verify>
  <resume-signal>Type "approved" or describe any path/config changes needed</resume-signal>
</task>

</tasks>

<verification>
- Zero Clerk references in deploy/ directory and .env.example
- All 5 files use "/home/ubuntu/deepdive-chat" as app directory
- PM2 app name "deepdive-backend" consistent across setup, redeploy, and ecosystem config
- setup-ec2.sh uses `pm2 start ecosystem.config.cjs` (not direct script path)
- nginx.conf has separate /api/chat SSE block with Connection '' header
- GOOGLE_CLIENT_ID and MONGODB_URI present in env templates
</verification>

<success_criteria>
A developer can clone the repo, SSH into a fresh Ubuntu EC2 instance, run `bash deploy/setup-ec2.sh`, fill in env vars, and have the full app running behind nginx with PM2 auto-restart.
</success_criteria>

<output>
After completion, create `.planning/quick/14-deploy-on-aws-ec2-ubuntu-instance/14-SUMMARY.md`
</output>
