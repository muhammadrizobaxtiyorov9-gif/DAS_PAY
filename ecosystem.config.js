module.exports = {
  apps: [
    {
      name: 'daspay-web',
      cwd: '/var/www/daspay',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'daspay-bot',
      cwd: '/var/www/daspay',
      script: 'npx',
      args: 'tsx bot/dev.ts',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
