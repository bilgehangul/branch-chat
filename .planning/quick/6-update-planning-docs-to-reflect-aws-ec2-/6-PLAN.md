---
phase: quick-6
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/PROJECT.md
  - .planning/research/STACK.md
  - .planning/phases/06-polish-and-deployment/06-06-PLAN.md
autonomous: false
requirements: []

must_haves:
  truths:
    - "REQUIREMENTS.md reflects Google OAuth (not Clerk) and AWS EC2 (not Vercel+Render), PERSIST-01/02 moved to v1"
    - "ROADMAP.md Phase 6 goal and success criteria reference AWS EC2; no Clerk leakage in Phase 2 or Phase 7"
    - "PROJECT.md Active requirements list Google OAuth + AWS EC2; Session persistence removed from Out of Scope"
    - "STACK.md Auth section has google-auth-library + @react-oauth/google; Deployment section has AWS EC2/nginx/PM2; Database section has MongoDB Atlas/Mongoose"
    - "06-06-PLAN.md is fully rewritten for AWS EC2 deployment with human SSH checkpoints"
  artifacts:
    - path: ".planning/REQUIREMENTS.md"
      provides: "Updated auth + deployment requirements, PERSIST-01/02 in v1 section"
    - path: ".planning/ROADMAP.md"
      provides: "Phase 6/7 descriptions accurate to actual stack"
    - path: ".planning/PROJECT.md"
      provides: "Active requirements and constraints reflect current implementation"
    - path: ".planning/research/STACK.md"
      provides: "Auth + Deployment + Database sections reflect actual stack"
    - path: ".planning/phases/06-polish-and-deployment/06-06-PLAN.md"
      provides: "Actionable AWS EC2 deployment plan replacing Vercel+Render plan"
  key_links: []
---

<objective>
Update five planning documents to match the actual implemented stack: Google OAuth instead of Clerk, AWS EC2 (nginx + PM2) instead of Vercel + Render, and MongoDB Atlas as v1 persistence (already shipped in Phase 7). The code already reflects these choices — the docs just haven't caught up.

Purpose: Planning docs should describe what was actually built, not what was originally planned.
Output: Five updated files, with 06-06-PLAN.md fully rewritten as an executable AWS EC2 deployment guide.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/PROJECT.md
@.planning/research/STACK.md
@.planning/phases/06-polish-and-deployment/06-06-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update REQUIREMENTS.md, ROADMAP.md, and PROJECT.md</name>
  <files>
    .planning/REQUIREMENTS.md
    .planning/ROADMAP.md
    .planning/PROJECT.md
  </files>
  <action>
Make the following targeted edits to each file. Read each file first, then write the full updated content.

**REQUIREMENTS.md changes:**

In the `### Authentication` section:
- AUTH-01: Change "User can sign up and sign in with email/password via Clerk" → "User can sign in with Google OAuth (no email/password option)"
- AUTH-02: Change "User can sign in with Google OAuth via Clerk" → "User can sign in with Google OAuth (google-auth-library on backend, GoogleLogin button on frontend)"
- AUTH-04: Change "validates the Clerk JWT" → "validates the Google ID token using google-auth-library"

In the `### Deployment` section:
- DEPLOY-01: Change "Frontend is deployed to Vercel with auto-deploy from the main branch" → "Frontend is deployed to AWS EC2 Ubuntu — nginx serves the built React static files (dist/)"
- DEPLOY-02: Change "Backend is deployed to Render (Node.js/Express proxy)" → "Backend is deployed to AWS EC2 Ubuntu — PM2 manages the Node.js process (port 3001); nginx reverse-proxies /api to port 3001"

In the `## v2 Requirements` section, under `### Persistence`:
- Move PERSIST-01 and PERSIST-02 UP to `## v1 Requirements` under a new `### Persistence` subsection (place it after `### Deployment`). Mark both with `[x]` (complete). Keep PERSIST-03 in v2.
- PERSIST-01 text: "User sessions are saved to MongoDB Atlas and restored on page refresh"
- PERSIST-02 text: "User can view a history of past sessions in the SessionHistory sidebar"

In the `## Out of Scope` table:
- Remove the row "Session persistence in v1 | Requires database architecture; intentional experiment-phase constraint"

In the `## Traceability` table:
- Add two rows after the DEPLOY-04 row:
  - `| PERSIST-01 | Phase 7 | Complete |`
  - `| PERSIST-02 | Phase 7 | Complete |`
- Update the Coverage line: "v1 requirements: 48 total" (was 46, adding PERSIST-01 and PERSIST-02)
- Update "Mapped to phases: 48"

Update the `*Last updated:` line at the bottom to reflect today's date and the changes made.

---

**ROADMAP.md changes:**

In `### Phase 2: Frontend Foundation` plan list:
- 02-01-PLAN.md description: Change "Vite scaffold, Tailwind v4, Clerk modal auth, DemoChat guest view..." → "Vite scaffold, Tailwind v4, Google OAuth auth (AuthContext + GoogleLogin button), DemoChat guest view, AppShell skeleton, Wave 0 test stubs"

In `### Phase 6: Polish and Deployment`:
- **Goal** line: Change "Vercel + Render" → "AWS EC2 (Ubuntu, nginx + PM2)"
- **Success Criteria #2**: Change "The frontend is live on Vercel and the backend is live on Render; both deploy automatically from the main branch" → "The frontend and backend are live on a single AWS EC2 Ubuntu instance — nginx serves the built React static files and reverse-proxies /api to the Express backend on port 3001; PM2 keeps the Node.js process running; Let's Encrypt/Certbot provides SSL"
- 06-04-PLAN.md description: Change "Deployment config: .env.example, render.yaml, vercel.json, CI workflow, VITE_API_BASE_URL fix" → "Deployment config: .env.example, nginx site config template, PM2 ecosystem.config.js, .env.production template, VITE_API_BASE_URL set to empty string (nginx handles /api proxy)"
- 06-06-PLAN.md description: Change "Deployment checkpoint: Vercel + Render live, CORS wired (depends on 06-04, 06-05)" → "Deployment checkpoint: AWS EC2 live — nginx + PM2 running, SSL via Certbot, CORS wired (depends on 06-04, 06-05)"

In `### Phase 7: Auth Migration + Persistent Storage` — scan for any remaining Clerk references in the plan descriptions. The Phase 7 section already looks correct per context, but fix any Clerk leakage if found.

In the Phase 6 progress table row: verify "In Progress" status is retained (06-06 is still unexecuted).

---

**PROJECT.md changes:**

In `### Active` requirements list:
- Change "User can authenticate with Clerk before accessing the chat interface" → "User can authenticate with Google OAuth before accessing the chat interface"
- Change "App deployed: frontend on Vercel, backend on Render" → "App deployed on AWS EC2 Ubuntu (single instance — nginx serves React static files + reverse-proxies /api to Express on port 3001; PM2 manages Node.js; Let's Encrypt SSL)"
- Add a new bullet after the Vercel/Render line: "Session history: past chat sessions are loadable from the SessionHistory sidebar (MongoDB Atlas persistence)"

In `### Out of Scope`:
- Remove "Session persistence — sessions are in-memory only; lost on refresh (intentional for v1 experiment phase)"

In `## Constraints` section:
- Change "Auth: Clerk (React SDK frontend, Node SDK backend JWT validation) — no custom backend auth logic" → "Auth: Google OAuth — google-auth-library on backend (verifies Google ID tokens), @react-oauth/google GoogleLogin button on frontend; no Clerk dependency"
- Change "Backend: Stateless Node.js + Express proxy on Render — no database, no session storage" → "Backend: Node.js + Express on AWS EC2 (PM2 process manager) — MongoDB Atlas via Mongoose for session/thread/message persistence"

In `## Key Decisions` table:
- Change the "Render for backend" row description from "Simpler setup than Railway; free tier adequate for experiment phase" to "AWS EC2 Ubuntu chosen for single-instance deployment — nginx serves React build + reverse-proxies API; eliminates split Vercel/Render setup"
- Add a new row: `| MongoDB Atlas for persistence | Managed cloud MongoDB eliminates self-hosted DB complexity; Mongoose ODM; sessions/threads/messages persist across devices | Shipped in Phase 7 |`
- Change "No session persistence in v1" row outcome from "— Pending" to note: remove this row entirely (persistence was shipped).

Update `*Last updated:` to today's date.
  </action>
  <verify>
Read each updated file and confirm:
- REQUIREMENTS.md: AUTH-01/02/04 say "Google OAuth" not "Clerk"; DEPLOY-01/02 say "AWS EC2"; PERSIST-01/02 appear in v1 section with [x]; "Session persistence in v1" row is gone from Out of Scope
- ROADMAP.md: Phase 6 goal mentions "AWS EC2"; no Vercel/Render in success criteria #2; 06-06 description says "AWS EC2 live"
- PROJECT.md: "Google OAuth" in active requirements; "AWS EC2" in deployment line; "Session persistence" removed from Out of Scope
  </verify>
  <done>
All three documents accurately reflect the implemented stack with no Clerk or Vercel/Render references remaining in forward-looking sections.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update STACK.md and rewrite 06-06-PLAN.md</name>
  <files>
    .planning/research/STACK.md
    .planning/phases/06-polish-and-deployment/06-06-PLAN.md
  </files>
  <action>
**STACK.md changes:**

Read the full file first. Make the following targeted edits:

In `### Auth` section — replace the entire table content (keep the section header):
Remove the @clerk/clerk-react and @clerk/express rows. Replace with:

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| google-auth-library | 9.x | Backend Google ID token verification | Official Google OAuth library for Node.js. `OAuth2Client.verifyIdToken()` validates the token and returns user claims (email, sub, name). No custom JWT logic needed. |
| @react-oauth/google | 0.12.x | Frontend GoogleLogin button + credential response | Provides the `<GoogleLogin>` button component and `useGoogleLogin` hook. Wraps the Google Identity Services script. Pass the credential (ID token string) to the backend for verification. |

In `### Deployment` section — replace the entire table content:
Remove Vercel and Render rows. Replace with:

| Service | Purpose | Why |
|---------|---------|-----|
| AWS EC2 Ubuntu 22.04 LTS | Hosts both frontend (static files) and backend (Node.js/Express) on a single instance | Single instance eliminates CORS complexity between separate frontend/backend services; t2.micro/t3.micro is free-tier eligible and sufficient for v1 load |
| nginx | Serves built React static files (dist/) on port 80/443; reverse-proxies /api/* to Express on port 3001 | Standard static file serving + API proxy setup; handles SSL termination with Let's Encrypt certs |
| PM2 | Node.js process manager for the Express backend | Auto-restart on crash, startup on system reboot (`pm2 startup`), log management |
| Let's Encrypt + Certbot | Free SSL/TLS certificate | Auto-renewal via cron; nginx plugin handles cert installation and config update |

Add a new `### Database` section (insert after Deployment section, before `## Alternatives Considered`):

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MongoDB Atlas | Cloud managed | Stores User, Session, Thread, and Message documents | Managed cloud MongoDB — no self-hosted database infrastructure. Free M0 tier sufficient for v1. Connects via MONGODB_URI env var. |
| Mongoose | 8.x | ODM for MongoDB | Schema validation, virtuals, and query builder over MongoDB. Defines the four data models (User, Session, Thread, Message). |

In `## Alternatives Considered` table — add rows:
| Auth | google-auth-library | @clerk/express | Clerk removed in Phase 7 — Google OAuth is simpler for a single-auth-provider app with no multi-tenant requirements |
| Deployment | AWS EC2 + nginx | Vercel + Render | Single instance eliminates split-service CORS wiring; EC2 gives full control over nginx config and SSL; no cold start delays |
| Database | MongoDB Atlas | No persistence (v1 original) | Phase 7 added persistence requirement; Atlas managed cloud avoids self-hosted overhead |

In `## Installation` section — update the npm install lines:
- Frontend: replace `npm install @clerk/clerk-react` with `npm install @react-oauth/google`
- Backend: replace `@clerk/express` with `google-auth-library mongoose`

Update the `*Researched:` date or add a note at the bottom: `*Updated 2026-03-10: Auth updated to Google OAuth, Deployment updated to AWS EC2 + nginx + PM2, Database section added for MongoDB Atlas + Mongoose*`

---

**06-06-PLAN.md — full rewrite:**

Write a completely new version of this file. Keep the frontmatter structure but update all values. The plan covers human-guided AWS EC2 deployment with Claude automating what it can (nginx config, PM2 config file, verifying health endpoint) and the human performing SSH actions and confirming results.

Write this exact content:

```
---
phase: 06-polish-and-deployment
plan: "06"
type: execute
wave: 3
depends_on:
  - "06-04"
  - "06-05"
autonomous: false
files_modified:
  - nginx/deepdive.conf
  - ecosystem.config.cjs
requirements:
  - DEPLOY-01
  - DEPLOY-02

must_haves:
  truths:
    - "Frontend is live at https://[your-domain-or-EC2-IP] — nginx serves the React build"
    - "Backend health check GET /health returns 200 through nginx reverse proxy"
    - "CORS handshake succeeds — frontend fetch to /api/chat returns streaming response"
    - "PM2 keeps the backend process running across server restarts"
    - "SSL certificate is installed via Let's Encrypt (if domain is configured)"
  artifacts:
    - path: "nginx/deepdive.conf"
      provides: "nginx site config: serves dist/ on 80/443, proxies /api to port 3001"
    - path: "ecosystem.config.cjs"
      provides: "PM2 process definition for the backend"
  key_links:
    - from: "nginx /api location block"
      to: "Express on port 3001"
      via: "proxy_pass http://localhost:3001"
      pattern: "proxy_pass.*3001"
---

<objective>
Human-guided deployment of the app to AWS EC2 Ubuntu. Claude generates the nginx site config and PM2 ecosystem file; the human SSHs into the instance, runs the deployment commands, and confirms results at each checkpoint.

Purpose: Satisfies DEPLOY-01 (frontend live on EC2/nginx) and DEPLOY-02 (backend live on EC2/PM2).
Output: Single EC2 instance serving both the React frontend and Express backend API under nginx with SSL.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/06-polish-and-deployment/06-CONTEXT.md
@.planning/phases/06-polish-and-deployment/06-04-SUMMARY.md

<interfaces>
<!-- Key configs the executor needs -->

Backend health endpoint: GET /health → 200 OK (from Phase 1)
Backend port: 3001 (Express listens on process.env.PORT || 3001)
Frontend build output: frontend/dist/ (npm run build in frontend/)
CORS: backend reads CLIENT_ORIGIN env var → must match the nginx-served origin
nginx proxies /api/* to http://localhost:3001
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Generate nginx config and PM2 ecosystem file</name>
  <files>nginx/deepdive.conf, ecosystem.config.cjs</files>
  <action>
Create two deployment config files at the repo root level (not inside backend/ or frontend/).

**nginx/deepdive.conf** — nginx site configuration:
```nginx
server {
    listen 80;
    server_name _;  # Replace _ with your domain if you have one (e.g., example.com www.example.com)

    # Serve React frontend static files
    root /var/www/deepdive/dist;
    index index.html;

    # React SPA: serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy all /api/* requests to Express backend on port 3001
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE streaming: disable buffering so tokens arrive in real-time
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # SSE endpoint: keep connection alive for streaming
    location /api/chat {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        chunked_transfer_encoding on;
    }
}
```

Add a comment block at the top of the file:
```
# DeepDive Chat — nginx site configuration
#
# Deploy steps (on EC2):
#   sudo cp nginx/deepdive.conf /etc/nginx/sites-available/deepdive
#   sudo ln -sf /etc/nginx/sites-available/deepdive /etc/nginx/sites-enabled/deepdive
#   sudo rm -f /etc/nginx/sites-enabled/default
#   sudo nginx -t && sudo systemctl reload nginx
#
# For SSL with Let's Encrypt (if you have a domain):
#   sudo certbot --nginx -d yourdomain.com
```

**ecosystem.config.cjs** — PM2 process definition:
```javascript
module.exports = {
  apps: [
    {
      name: 'deepdive-backend',
      script: './backend/dist/index.js',
      cwd: '/home/ubuntu/child_chats_v1',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // PM2 will load additional env vars from /home/ubuntu/child_chats_v1/backend/.env
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

Add a comment block at the top:
```
// DeepDive Chat — PM2 ecosystem config
//
// Start: pm2 start ecosystem.config.cjs
// Restart: pm2 restart deepdive-backend
// Logs: pm2 logs deepdive-backend
// Status: pm2 status
// Auto-start on reboot: pm2 startup && pm2 save
```
  </action>
  <verify>
Both files exist at repo root:
- nginx/deepdive.conf contains `proxy_pass http://localhost:3001` and `proxy_buffering off`
- ecosystem.config.cjs contains `name: 'deepdive-backend'` and `PORT: 3001`
  </verify>
  <done>nginx config and PM2 config committed. Human can copy these directly to the EC2 instance.</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Checkpoint 1: SSH into EC2 and run initial server setup</name>
  <what-to-do>
SSH into your EC2 Ubuntu instance and run the initial setup. Do this once if nginx/PM2/Node are not yet installed.

**Prerequisites check (run these first):**
```bash
# Check if nginx is installed
nginx -v

# Check if Node.js is installed (need 20.x)
node --version

# Check if PM2 is installed globally
pm2 --version
```

**If not installed, run:**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx

# Install Certbot (for SSL, only needed if you have a domain)
sudo apt install -y certbot python3-certbot-nginx
```

**Deploy the app:**
```bash
# Clone or pull the repo (if first time)
cd /home/ubuntu
git clone https://github.com/YOUR-USERNAME/child_chats_v1.git
# OR if already cloned:
cd /home/ubuntu/child_chats_v1 && git pull

# Install backend dependencies and build
cd /home/ubuntu/child_chats_v1/backend
npm install
npm run build

# Install frontend dependencies and build
cd /home/ubuntu/child_chats_v1/frontend
npm install
npm run build

# Create the nginx serve directory and copy the frontend build
sudo mkdir -p /var/www/deepdive
sudo cp -r dist/* /var/www/deepdive/dist/ 2>/dev/null || sudo cp -r dist /var/www/deepdive/dist

# Set up nginx config
sudo cp /home/ubuntu/child_chats_v1/nginx/deepdive.conf /etc/nginx/sites-available/deepdive
sudo ln -sf /etc/nginx/sites-available/deepdive /etc/nginx/sites-enabled/deepdive
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Create .env file for backend (copy from .env.example and fill in values)
cp /home/ubuntu/child_chats_v1/backend/.env.example /home/ubuntu/child_chats_v1/backend/.env
# Edit the .env file with your actual values:
nano /home/ubuntu/child_chats_v1/backend/.env
# Required values to set:
# GEMINI_API_KEY=your-key
# TAVILY_API_KEY=your-key
# GOOGLE_CLIENT_ID=your-google-oauth-client-id
# CLIENT_ORIGIN=http://YOUR-EC2-PUBLIC-IP  (or https://yourdomain.com if you have a domain)
# MONGODB_URI=your-mongodb-atlas-connection-string
# NODE_ENV=production
# PORT=3001

# Create logs directory and start the backend with PM2
mkdir -p /home/ubuntu/child_chats_v1/logs
cd /home/ubuntu/child_chats_v1
pm2 start ecosystem.config.cjs
pm2 startup  # Run the output command it gives you to enable auto-start
pm2 save
```

**Verify it's running:**
```bash
# Check PM2 status
pm2 status

# Check backend health
curl http://localhost:3001/health
# Should return: {"status":"ok"} or 200 OK

# Check nginx serves the frontend
curl http://localhost/
# Should return HTML (the React app's index.html)

# Check nginx proxies /api correctly
curl http://localhost/api/health
# Should return the same health response as port 3001 direct
```
  </what-to-do>
  <resume-signal>Paste the output of `pm2 status` and `curl http://localhost:3001/health` to confirm the backend is running, then type the EC2 public IP address (or domain) so Claude can confirm the live URL</resume-signal>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Checkpoint 2: SSL setup (optional) and full stack verification</name>
  <what-to-do>
**If you have a domain name pointed at your EC2 IP:**

Set up Let's Encrypt SSL:
```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically update nginx config for HTTPS and set up auto-renewal
# Verify auto-renewal works:
sudo certbot renew --dry-run
```

After Certbot runs, update your backend .env:
```bash
nano /home/ubuntu/child_chats_v1/backend/.env
# Update CLIENT_ORIGIN to https://yourdomain.com (no trailing slash)
pm2 restart deepdive-backend
```

**If using EC2 IP only (no domain):**
- The app will run on http only. This is fine for testing.
- Update CLIENT_ORIGIN to `http://YOUR-EC2-IP`
- Note: Google OAuth requires an authorized origin in Google Cloud Console — add your EC2 IP or domain at: https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized JavaScript origins

**Full stack verification checklist (run from your local machine):**
```bash
# 1. Health check through nginx
curl https://yourdomain.com/api/health  # or http://YOUR-EC2-IP/api/health

# 2. Frontend loads
# Open https://yourdomain.com (or http://YOUR-EC2-IP) in a browser
# You should see the React app in dark mode

# 3. Google Sign In works
# Click "Sign in with Google" — should open Google OAuth flow
# After sign in, app should show the chat interface

# 4. Chat works end-to-end
# Type a message and verify streaming tokens appear

# 5. CORS check
# Open browser DevTools → Network tab
# Verify /api/chat request has no CORS errors (no red entries, no "blocked" messages)
```
  </what-to-do>
  <resume-signal>Type "deployed" and confirm which verification items passed, or describe any issues encountered</resume-signal>
</task>

</tasks>

<verification>
Manual verification checklist:
- [ ] `curl https://[domain-or-IP]/api/health` returns 200
- [ ] Opening the app URL in a browser shows the React app in dark mode
- [ ] Google OAuth sign in flow completes successfully
- [ ] Sending a chat message produces a streaming AI response (tokens appear progressively)
- [ ] No CORS errors in browser console
- [ ] `pm2 status` shows `deepdive-backend` as `online`
- [ ] nginx config test passes: `sudo nginx -t`
- [ ] SSL cert installed (if domain configured): green padlock in browser
</verification>

<success_criteria>
- DEPLOY-01: React app is served by nginx from /var/www/deepdive/dist — accessible at http(s)://[EC2-IP-or-domain]
- DEPLOY-02: Express backend runs under PM2 on port 3001; nginx reverse-proxies /api/* to it; GET /api/health returns 200
- CORS: CLIENT_ORIGIN in backend .env matches the nginx-served origin exactly (no trailing slash)
- PM2 configured to auto-restart: `pm2 startup` command executed and `pm2 save` run
</success_criteria>

<output>
After completion, create `.planning/phases/06-polish-and-deployment/06-06-SUMMARY.md`
</output>
```
  </action>
  <verify>
- nginx/deepdive.conf exists at repo root with proxy_pass and proxy_buffering off
- ecosystem.config.cjs exists at repo root with deepdive-backend app definition
- 06-06-PLAN.md frontmatter references AWS EC2 truths (not Vercel/Render)
- 06-06-PLAN.md tasks guide SSH deployment (not Render/Vercel dashboard)
  </verify>
  <done>
STACK.md updated with Google OAuth + AWS EC2 + MongoDB Atlas sections. 06-06-PLAN.md fully rewritten with two human SSH checkpoints and two generated config files.
  </done>
</task>

</tasks>

<verification>
After both tasks, confirm across all five files:
1. No remaining "Clerk", "Vercel", or "Render" references in forward-looking sections (REQUIREMENTS, ROADMAP goals/criteria, PROJECT active requirements, STACK recommended section)
2. PERSIST-01/02 appear in v1 section of REQUIREMENTS.md with [x]
3. STACK.md has Database section with MongoDB Atlas + Mongoose
4. 06-06-PLAN.md has `autonomous: false` and guides human SSH deployment
5. nginx/deepdive.conf and ecosystem.config.cjs exist at repo root
</verification>

<success_criteria>
- Planning docs describe the app as it was actually built (Google OAuth + AWS EC2 + MongoDB Atlas)
- 06-06-PLAN.md is executable: a developer following it can deploy the app to EC2 without additional research
- Historical docs (SUMMARY files, completed phase plans) are untouched
</success_criteria>

<output>
After completion, create `.planning/quick/6-update-planning-docs-to-reflect-aws-ec2-/6-SUMMARY.md`
</output>
