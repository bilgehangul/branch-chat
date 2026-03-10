#!/bin/bash
# Run this to pull latest code and redeploy.
# Requires frontend/.env.local to exist (created by setup-ec2.sh).
# Usage: bash redeploy.sh

set -e

APP_DIR="/var/www/branch-chat"

echo "==> Pulling latest code"
cd "$APP_DIR"
git pull origin main

echo "==> Checking required env files"
if [ ! -f "$APP_DIR/frontend/.env.local" ]; then
  echo "ERROR: $APP_DIR/frontend/.env.local missing. Create it with VITE_CLERK_PUBLISHABLE_KEY before redeploying."
  exit 1
fi

echo "==> Rebuilding backend"
cd "$APP_DIR/backend"
npm install
npm run build

echo "==> Rebuilding frontend"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "==> Restarting backend"
pm2 restart branch-chat-backend

echo "==> Done"
