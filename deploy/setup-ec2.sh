#!/bin/bash
# Run this once on a fresh Amazon Linux 2023 / Ubuntu EC2 instance.
# Usage: bash setup-ec2.sh

set -e

APP_DIR="/var/www/branch-chat"
REPO="https://github.com/bilgehangul/branch-chat.git"

echo "==> Installing Node 20, Nginx, Git, pm2"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -   # Amazon Linux
# For Ubuntu use: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs nginx git   # Amazon Linux
# For Ubuntu use: sudo apt-get install -y nodejs nginx git

sudo npm install -g pm2

echo "==> Cloning repo"
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
git clone "$REPO" "$APP_DIR"

echo "==> Building backend"
cd "$APP_DIR/backend"
npm install
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "==> Writing backend .env"
cat > "$APP_DIR/backend/.env" << 'EOF'
# Fill in your real values
CLERK_SECRET_KEY=sk_live_...
GEMINI_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
AI_PROVIDER=gemini
PORT=3001
CLIENT_ORIGIN=http://YOUR_EC2_PUBLIC_IP
NODE_ENV=production
EOF
echo "  !! Edit $APP_DIR/backend/.env with real values before starting"

echo "==> Configuring Nginx"
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/branch-chat.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> Starting backend with pm2"
cd "$APP_DIR/backend"
pm2 start dist/index.js --name branch-chat-backend
pm2 save
pm2 startup | tail -1 | sudo bash   # auto-start on reboot

echo ""
echo "==> Done! Edit $APP_DIR/backend/.env then: pm2 restart branch-chat-backend"
