#!/bin/bash
# Run this to pull latest code and redeploy.
# Usage: bash redeploy.sh

set -e

APP_DIR="/var/www/branch-chat"

echo "==> Pulling latest code"
cd "$APP_DIR"
git pull origin main

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
