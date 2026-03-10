#!/bin/bash
# Run this once on a fresh Ubuntu 22.04 / 24.04 LTS EC2 instance.
# Tested platform: Ubuntu 22.04 LTS and 24.04 LTS on Amazon EC2.
# Usage: bash setup-ec2.sh

set -e

APP_DIR="/var/www/branch-chat"
REPO="https://github.com/bilgehangul/branch-chat.git"

echo "==> Installing Node 20, Nginx, Git"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs nginx git

echo "==> Installing pm2 globally"
sudo npm install -g pm2

echo "==> Cloning repo"
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
git clone "$REPO" "$APP_DIR"

echo "==> Installing backend dependencies"
cd "$APP_DIR/backend"
npm install

echo "==> Installing frontend dependencies"
cd "$APP_DIR/frontend"
npm install

echo "==> Writing backend .env"
cat > "$APP_DIR/backend/.env" << 'EOF'
# Fill in your real values from the respective dashboards
CLERK_SECRET_KEY=sk_live_...
GEMINI_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
AI_PROVIDER=gemini
PORT=3001
CLIENT_ORIGIN=http://YOUR_EC2_PUBLIC_IP
NODE_ENV=production
EOF
echo "  !! Edit $APP_DIR/backend/.env with real values"

echo "==> Writing frontend .env.local"
cat > "$APP_DIR/frontend/.env.local" << 'EOF'
# Fill in your real Clerk publishable key from Clerk Dashboard > API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
# Leave empty — nginx proxies /api to localhost:3001 on EC2
VITE_API_BASE_URL=
EOF
echo "  !! Edit $APP_DIR/frontend/.env.local with real VITE_CLERK_PUBLISHABLE_KEY before building"

read -rp "Press ENTER after editing both .env files to continue the build..." _

echo "==> Building backend"
cd "$APP_DIR/backend"
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm run build

echo "==> Configuring Nginx"
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/branch-chat.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> Starting backend with pm2"
cd "$APP_DIR/backend"
pm2 start dist/index.js --name branch-chat-backend
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"

echo ""
echo "==> Done! The app should be running. If you need to update env vars later:"
echo "    Edit $APP_DIR/backend/.env and $APP_DIR/frontend/.env.local"
echo "    Then run: bash $APP_DIR/deploy/redeploy.sh"
