// PM2 Ecosystem — agente-ceo only.
//
// Merge into ~/yaya-ecosystem.config.cjs alongside yaya-business and
// yaya-health, or run standalone with:
//   pm2 start deploy/pm2.ecosystem.cjs
//   pm2 save
//
// Uses Next.js standalone output so pm2 supervises a clean `node server.js`
// process tree (not `npm → next → node`).

module.exports = {
  apps: [
    {
      name: 'agente-ceo',
      cwd: '/home/yaya/agente-ceo',
      script: '.next/standalone/server.js',
      interpreter: '/usr/bin/node',
      node_args: '--enable-source-maps',
      env: {
        PORT: 3005,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production',
        SERVICE_NAME: 'agente-ceo',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      error_file: '/home/yaya/logs/agente-ceo-error.log',
      out_file: '/home/yaya/logs/agente-ceo-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 15,
      min_uptime: '10s',
      restart_delay: 3000,
      exp_backoff_restart_delay: 1000,
      kill_timeout: 10000,
      listen_timeout: 15000,
      shutdown_with_message: true,
      max_memory_restart: '2G',
    },
  ],
};
