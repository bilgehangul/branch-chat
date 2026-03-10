---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - deploy/setup-ec2.sh
  - deploy/redeploy.sh
autonomous: true
requirements: []
must_haves:
  truths:
    - "setup-ec2.sh succeeds on a fresh Ubuntu EC2 without permission-denied errors"
    - "Frontend build on EC2 has VITE_CLERK_PUBLISHABLE_KEY set before npm run build runs"
    - "redeploy.sh rebuilds both backend and frontend cleanly"
    - "nginx serves the React SPA and proxies /api with SSE buffering disabled"
  artifacts:
    - path: "deploy/setup-ec2.sh"
      provides: "Working first-run provisioning script for Ubuntu EC2"
    - path: "deploy/redeploy.sh"
      provides: "Working redeploy script that rebuilds frontend with env vars"
  key_links:
    - from: "deploy/setup-ec2.sh"
      to: "frontend/.env.local"
      via: "Written before npm run build in frontend dir"
      pattern: "VITE_CLERK_PUBLISHABLE_KEY"
---

<objective>
Fix AWS EC2 Ubuntu deployment scripts so they succeed without permission-denied errors and
correctly supply frontend build-time environment variables.

Purpose: The current setup-ec2.sh writes a backend .env but never writes a frontend .env.local,
so the Vite build silently produces an app with no Clerk key (broken auth). It also does not
handle the pm2 startup command robustly. redeploy.sh has the same missing frontend env issue.

Output: Updated deploy/setup-ec2.sh and deploy/redeploy.sh that work correctly on Ubuntu 22/24.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@deploy/setup-ec2.sh
@deploy/redeploy.sh
@deploy/nginx.conf
@backend/package.json
@frontend/package.json
@.env.example
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix setup-ec2.sh — add frontend env and harden pm2 startup</name>
  <files>deploy/setup-ec2.sh</files>
  <action>
Rewrite deploy/setup-ec2.sh with the following fixes:

1. FRONTEND ENV BEFORE BUILD: After writing backend/.env and before running
   `npm run build` in the frontend directory, write frontend/.env.local with
   VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL. For EC2 self-hosted, VITE_API_BASE_URL
   should be empty string (same host, nginx proxies /api). Use the same placeholder-with-comment
   pattern as the backend .env block so the operator knows to fill it in.

   Write the block immediately before the "Building frontend" step:
   ```
   echo "==> Writing frontend .env.local"
   cat > "$APP_DIR/frontend/.env.local" << 'EOF'
   # Fill in your real Clerk publishable key from Clerk Dashboard > API Keys
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   # Leave empty — nginx proxies /api to localhost:3001 on EC2
   VITE_API_BASE_URL=
   EOF
   echo "  !! Edit $APP_DIR/frontend/.env.local with real VITE_CLERK_PUBLISHABLE_KEY before building"
   ```
   Then add an explicit pause so the operator edits both .env files before the build continues.
   Use: `read -rp "Press ENTER after editing both .env files to continue the build..." _`

2. MOVE BUILD STEPS AFTER .ENV PROMPTS: Restructure so the sequence is:
   a. npm install (backend)
   b. npm install (frontend)
   c. Write backend/.env and frontend/.env.local
   d. Prompt operator to fill in values
   e. npm run build (backend) — uses `npm run build` which delegates to `npx tsc`, no permission issue
   f. npm run build (frontend) — uses `npm run build` which delegates to `npx tsc -b && npx vite build`
   g. Configure nginx
   h. Start pm2

3. PM2 STARTUP: Replace `pm2 startup | tail -1 | sudo bash` with the more reliable:
   ```
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"
   ```
   This is the canonical Ubuntu/systemd approach. Keep `pm2 save` before it.

4. Keep all existing logic unchanged except the above three fixes. Keep set -e, APP_DIR,
   REPO variables, nginx copy, and echo messages consistent with current style.

5. Add a comment at the top noting Ubuntu 22.04/24.04 LTS is the tested platform.
  </action>
  <verify>
    <automated>bash -n "C:/gmu/coding/GenAI Web interface/child_chats_v1/deploy/setup-ec2.sh" && echo "Syntax OK"</automated>
  </verify>
  <done>
    - setup-ec2.sh passes bash -n (no syntax errors)
    - File contains VITE_CLERK_PUBLISHABLE_KEY
    - File contains the read -rp pause prompt
    - npm install steps appear before npm run build steps
    - pm2 startup uses `sudo env PATH=` form, not tail -1 pipe
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix redeploy.sh — add frontend env refresh and correct build order</name>
  <files>deploy/redeploy.sh</files>
  <action>
Update deploy/redeploy.sh with these fixes:

1. FRONTEND ENV CHECK: After `git pull`, before rebuilding frontend, check if
   frontend/.env.local exists. If it does not, print a clear error and exit:
   ```
   if [ ! -f "$APP_DIR/frontend/.env.local" ]; then
     echo "ERROR: $APP_DIR/frontend/.env.local missing. Create it with VITE_CLERK_PUBLISHABLE_KEY before redeploying."
     exit 1
   fi
   ```
   This prevents a silent broken build where the frontend compiles without Clerk.

2. The existing `npm run build` calls are correct (package.json scripts already use npx tsc
   and npx vite build). No changes needed to the build commands themselves.

3. Keep everything else unchanged — set -e, APP_DIR, git pull, npm install calls, pm2 restart,
   and echo messages.

4. Add a comment at the top: "Requires frontend/.env.local to exist (created by setup-ec2.sh)"
  </action>
  <verify>
    <automated>bash -n "C:/gmu/coding/GenAI Web interface/child_chats_v1/deploy/redeploy.sh" && echo "Syntax OK"</automated>
  </verify>
  <done>
    - redeploy.sh passes bash -n (no syntax errors)
    - File contains the frontend/.env.local existence check with exit 1
    - File contains the ERROR message referencing VITE_CLERK_PUBLISHABLE_KEY
  </done>
</task>

</tasks>

<verification>
After both tasks, manually review the full setup-ec2.sh to confirm the step order is:
1. apt install nodejs nginx git
2. npm install -g pm2
3. git clone
4. npm install (backend + frontend)
5. Write backend/.env and frontend/.env.local
6. Pause for operator to fill values
7. npm run build (backend)
8. npm run build (frontend)
9. nginx config + restart
10. pm2 start + save + startup (systemd form)

Confirm redeploy.sh has the .env.local guard before any build step.

Run `bash -n` on both files to confirm no syntax errors.
</verification>

<success_criteria>
- Both scripts pass `bash -n` with no errors
- setup-ec2.sh writes frontend/.env.local before building frontend
- setup-ec2.sh pauses for operator input before builds
- setup-ec2.sh uses `sudo env PATH=` pm2 startup form
- redeploy.sh exits with a clear message if frontend/.env.local is missing
- nginx.conf unchanged (already correct for SSE + React Router)
- No bare `tsc` or `vite` calls anywhere in deploy scripts (builds go through `npm run build`)
</success_criteria>

<output>
No SUMMARY.md needed for quick tasks. Update .planning/STATE.md Quick Tasks Completed table
to add entry: "3 | Fix EC2 deploy scripts (frontend env + pm2 startup) | 2026-03-09 | {commit} | [3-fix-aws-ec2-deployment-configs-and-tsc-p](.planning/quick/3-fix-aws-ec2-deployment-configs-and-tsc-p/)"
</output>
