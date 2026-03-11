#!/bin/bash
# Run this once on a fresh Ubuntu 22.04 / 24.04 LTS EC2 instance.
# Tested platform: Ubuntu 22.04 LTS and 24.04 LTS on Amazon EC2.
# Usage: bash setup-ec2.sh

set -e

APP_DIR="/home/ubuntu/deepdive-chat"
REPO="https://github.com/bilgehangul/branch-chat.git"

echo "==> Installing Node 20, Nginx, Git"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs nginx git

echo "==> Installing pm2 globally"
sudo npm install -g pm2

echo "==> Cloning repo"
mkdir -p "$APP_DIR"
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
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GEMINI_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
AI_PROVIDER=gemini
PORT=3001
CLIENT_ORIGIN=http://YOUR_EC2_PUBLIC_IP
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/deepdive?retryWrites=true&w=majority
NODE_ENV=production
EOF
echo "  !! Edit $APP_DIR/backend/.env with real values"

echo "==> Writing frontend .env.local"
cat > "$APP_DIR/frontend/.env.local" << 'EOF'
# Fill in your Google OAuth client ID from Google Cloud Console > Credentials
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
# Leave empty — nginx proxies /api to localhost:3001 on EC2
VITE_API_BASE_URL=
EOF
echo "  !! Edit $APP_DIR/frontend/.env.local with real VITE_GOOGLE_CLIENT_ID before building"

read -rp "Press ENTER after editing both .env files to continue the build..." _

echo "==> Building backend"
cd "$APP_DIR/backend"
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm run build

echo "==> Configuring Nginx"
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/deepdive-chat.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> Creating logs directory"
mkdir -p "$APP_DIR/logs"

echo "==> Starting backend with pm2"
cd "$APP_DIR"
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"

echo ""
echo "==> Done! The app should be running. If you need to update env vars later:"
echo "    Edit $APP_DIR/backend/.env and $APP_DIR/frontend/.env.local"
echo "    Then run: bash $APP_DIR/deploy/redeploy.sh"
