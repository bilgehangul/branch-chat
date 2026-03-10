// DeepDive Chat — PM2 ecosystem config
//
// Start: pm2 start ecosystem.config.cjs
// Restart: pm2 restart deepdive-backend
// Logs: pm2 logs deepdive-backend
// Status: pm2 status
// Auto-start on reboot: pm2 startup && pm2 save

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
