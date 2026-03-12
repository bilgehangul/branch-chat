#!/bin/bash
# Run this to pull latest code and redeploy.
# Requires backend/.env to exist (created by setup-ec2.sh).
# Usage: bash redeploy.sh

set -e

APP_DIR="/home/ubuntu/deepdive-chat"

echo "==> Pulling latest code"
cd "$APP_DIR"
git reset --hard HEAD
git pull origin main

echo "==> Checking required env files"
if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo "ERROR: $APP_DIR/backend/.env missing. Create it with GOOGLE_CLIENT_ID, MONGODB_URI, etc. before redeploying."
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
pm2 restart deepdive-backend

echo "==> Done"
