/** PM2: chạy sau `npm run build`, biến NEXT_PUBLIC_* phải có lúc build (xem .env.production). */
module.exports = {
  apps: [
    {
      name: 'fouderd-web',
      cwd: __dirname,
      script: 'npm',
      args: 'run start -- -H 0.0.0.0 -p 3000',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
