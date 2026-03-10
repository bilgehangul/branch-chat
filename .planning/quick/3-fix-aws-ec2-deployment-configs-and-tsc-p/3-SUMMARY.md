---
phase: quick-3
plan: 01
subsystem: deploy
tags: [ec2, deploy, nginx, pm2, frontend-env]
key-files:
  modified:
    - deploy/setup-ec2.sh
    - deploy/redeploy.sh
decisions:
  - "setup-ec2.sh writes frontend/.env.local with VITE_CLERK_PUBLISHABLE_KEY placeholder before build, then pauses for operator input"
  - "pm2 startup uses sudo env PATH= systemd form (not tail -1 pipe) for Ubuntu/systemd reliability"
  - "redeploy.sh guards against missing frontend/.env.local with exit 1 and actionable error message"
metrics:
  duration: "5 min"
  completed: "2026-03-09"
  tasks: 2
  files: 2
---

# Quick Task 3: Fix EC2 Deploy Scripts (Frontend Env + pm2 Startup) Summary

**One-liner:** Ubuntu EC2 deploy scripts fixed — frontend .env.local written with Clerk key placeholder before build, operator pause added, pm2 startup uses systemd form, redeploy guards against missing env file.

## What Was Done

### Task 1: Fix setup-ec2.sh
- Restructured script so all `npm install` calls happen before any `npm run build` calls
- Added `frontend/.env.local` write block with `VITE_CLERK_PUBLISHABLE_KEY` placeholder immediately before the build section
- Added `read -rp` pause so the operator can fill in both `.env` files before builds execute
- Replaced unreliable `pm2 startup | tail -1 | sudo bash` with the Ubuntu/systemd canonical form: `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"`
- Added Ubuntu 22.04/24.04 LTS platform note at the top of the file

### Task 2: Fix redeploy.sh
- Added check after `git pull` that verifies `frontend/.env.local` exists before any build step
- Script exits with code 1 and a clear `ERROR:` message referencing `VITE_CLERK_PUBLISHABLE_KEY` if the file is missing
- Added header comment noting the file requires `frontend/.env.local` (created by `setup-ec2.sh`)

## Verification

Both scripts pass `bash -n` with no syntax errors.

`setup-ec2.sh` step order confirmed:
1. apt install nodejs nginx git
2. npm install -g pm2
3. git clone
4. npm install (backend then frontend)
5. Write backend/.env and frontend/.env.local with placeholders
6. Pause for operator to fill in both files
7. npm run build (backend)
8. npm run build (frontend)
9. nginx config + restart
10. pm2 start + save + startup (systemd form)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | d103836f | fix(quick-3): write frontend .env.local, pause for operator, fix pm2 startup |
| 2 | 239a79e3 | fix(quick-3): guard redeploy against missing frontend/.env.local |

## Self-Check: PASSED

- deploy/setup-ec2.sh: exists and modified
- deploy/redeploy.sh: exists and modified
- Commit d103836f: present in git log
- Commit 239a79e3: present in git log
