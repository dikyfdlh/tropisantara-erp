// PM2 process manager config — untuk deploy produksi di VPS.
// Pakai: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'provisio-erp',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',         // ganti port bila bentrok
      cwd: __dirname,
      instances: 1,                   // naikkan ke 'max' untuk cluster mode bila CPU > 2 core
      exec_mode: 'fork',              // 'cluster' butuh sticky sessions kalau dipakai
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Log files
      error_file: 'logs/err.log',
      out_file:   'logs/out.log',
      time: true,
    },
  ],
};
