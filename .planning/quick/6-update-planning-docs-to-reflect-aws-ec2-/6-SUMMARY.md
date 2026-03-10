---
phase: quick-6
plan: "01"
subsystem: planning-docs
tags: [documentation, aws-ec2, google-oauth, mongodb-atlas, deployment]
dependency_graph:
  requires: []
  provides:
    - REQUIREMENTS.md updated: Google OAuth + AWS EC2 + PERSIST-01/02 in v1
    - ROADMAP.md updated: Phase 6 goal/criteria/plans reference AWS EC2
    - PROJECT.md updated: constraints + key decisions reflect actual stack
    - STACK.md updated: Auth + Deployment + Database sections reflect actual stack
    - 06-06-PLAN.md rewritten: AWS EC2 deployment with SSH checkpoints
    - nginx/deepdive.conf: nginx site config for EC2 deployment
    - ecosystem.config.cjs: PM2 process definition for EC2 deployment
  affects: []
tech_stack:
  added: []
  patterns:
    - Planning docs updated to describe shipped stack, not original plan
key_files:
  created:
    - nginx/deepdive.conf
    - ecosystem.config.cjs
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md
    - .planning/research/STACK.md
    - .planning/phases/06-polish-and-deployment/06-06-PLAN.md
decisions:
  - REQUIREMENTS PERSIST-01/02 promoted to v1 (complete): sessions saved to MongoDB Atlas and restored on refresh
  - AUTH requirements rewritten for Google OAuth — no Clerk references remain in forward-looking sections
  - DEPLOY requirements updated to AWS EC2 + nginx + PM2 — single-instance replaces split Vercel/Render
  - 06-06-PLAN.md fully rewritten from Vercel/Render dashboard steps to SSH-based EC2 deployment
metrics:
  duration: 8 min
  completed: "2026-03-10"
  tasks_completed: 2
  files_modified: 7
---

# Quick Task 6: Update Planning Docs to Reflect AWS EC2 Stack

**One-liner:** Five planning docs updated to match shipped stack — Google OAuth (google-auth-library), AWS EC2 (nginx + PM2), MongoDB Atlas persistence; 06-06-PLAN.md rewritten with SSH deployment steps; nginx/deepdive.conf and ecosystem.config.cjs generated.

## What Was Done

### Task 1: REQUIREMENTS.md, ROADMAP.md, PROJECT.md

**REQUIREMENTS.md**
- AUTH-01: "email/password via Clerk" → "Google OAuth (no email/password option)"
- AUTH-02: "Google OAuth via Clerk" → "google-auth-library on backend, GoogleLogin button on frontend"
- AUTH-04: "validates the Clerk JWT" → "validates the Google ID token using google-auth-library"
- DEPLOY-01: "Vercel with auto-deploy" → "AWS EC2 Ubuntu — nginx serves the built React static files"
- DEPLOY-02: "Render (Node.js/Express proxy)" → "AWS EC2 Ubuntu — PM2 manages the Node.js process; nginx reverse-proxies /api"
- PERSIST-01 and PERSIST-02 moved from v2 to v1 section, marked `[x]` (complete, shipped Phase 7)
- "Session persistence in v1" row removed from Out of Scope table
- Traceability table: added PERSIST-01 and PERSIST-02 rows (Phase 7, Complete)
- Coverage updated: 46 → 48 total v1 requirements

**ROADMAP.md**
- Phase 2 overview line: "Clerk auth gate" → "Google OAuth auth gate"
- 02-01-PLAN.md description: "Clerk modal auth" → "Google OAuth auth (AuthContext + GoogleLogin button)"
- Phase 6 goal: "Vercel + Render" → "AWS EC2 (Ubuntu, nginx + PM2)"
- Phase 6 Success Criteria #2: Vercel/Render text → AWS EC2/nginx/PM2/Certbot text
- 06-04-PLAN.md description: "render.yaml, vercel.json" → "nginx site config template, PM2 ecosystem.config.js"
- 06-06-PLAN.md description: "Vercel + Render live" → "AWS EC2 live — nginx + PM2 running, SSL via Certbot"

**PROJECT.md**
- Active requirements: "Clerk" → "Google OAuth"; "Vercel + Render" → "AWS EC2 Ubuntu (single instance)"; added MongoDB Atlas session history bullet
- Out of Scope: "Session persistence" line removed
- Constraints: Auth updated to Google OAuth; Backend updated to Node.js+Express+PM2+MongoDB Atlas
- Key Decisions: "Render for backend" row updated to AWS EC2 rationale; MongoDB Atlas row added; "No session persistence in v1" row removed

### Task 2: STACK.md and 06-06-PLAN.md

**STACK.md**
- Auth section: @clerk/clerk-react and @clerk/express rows replaced with google-auth-library (9.x) and @react-oauth/google (0.12.x)
- Deployment section: Vercel and Render rows replaced with AWS EC2, nginx, PM2, Let's Encrypt + Certbot
- Database section: New section added with MongoDB Atlas (cloud managed) and Mongoose (8.x)
- Alternatives Considered: Three new rows added — Auth (google-auth-library vs @clerk/express), Deployment (AWS EC2+nginx vs Vercel+Render), Database (MongoDB Atlas vs no persistence)
- Installation: npm install commands updated — removed @clerk/clerk-react and @clerk/express; added @react-oauth/google, google-auth-library, mongoose
- Updated timestamp added at bottom

**06-06-PLAN.md (full rewrite)**
- Frontmatter truths: AWS EC2 / nginx / PM2 / SSL (not Vercel/Render)
- Artifacts: nginx/deepdive.conf and ecosystem.config.cjs
- Task 1 (auto): Generates both config files at repo root
- Checkpoint 1 (human-action): SSH EC2 setup — Node.js 20.x, PM2, nginx, Certbot install; git clone/pull; backend + frontend build; nginx config deploy; .env setup; PM2 start + startup + save
- Checkpoint 2 (human-action): SSL via Certbot (optional), Google OAuth Cloud Console authorized origins, full stack verification (health check, frontend load, Google Sign In, streaming chat, CORS check)

**nginx/deepdive.conf (new file)**
- Serves React dist/ as SPA (try_files → index.html fallback)
- /api/ location block: proxy_pass to localhost:3001, proxy_buffering off for SSE
- /api/chat location block: dedicated SSE config with chunked_transfer_encoding
- Deploy instructions as comment block at top

**ecosystem.config.cjs (new file)**
- PM2 app definition: name deepdive-backend, script ./backend/dist/index.js
- Production env: NODE_ENV=production, PORT=3001
- PM2 usage commands in comment block at top

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files created/modified:
- FOUND: .planning/REQUIREMENTS.md
- FOUND: .planning/ROADMAP.md
- FOUND: .planning/PROJECT.md
- FOUND: .planning/research/STACK.md
- FOUND: .planning/phases/06-polish-and-deployment/06-06-PLAN.md
- FOUND: nginx/deepdive.conf
- FOUND: ecosystem.config.cjs

Commits:
- e0fce03e: chore(quick-6): update REQUIREMENTS, ROADMAP, PROJECT to reflect actual stack
- 5e7aa184: chore(quick-6): update STACK.md, rewrite 06-06-PLAN, add nginx + PM2 configs

## Self-Check: PASSED
