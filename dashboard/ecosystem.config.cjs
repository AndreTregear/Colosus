module.exports = {
  apps: [{
    name: 'agente-ceo',
    script: '.next/standalone/server.js',
    cwd: '/home/yaya/agente-ceo',
    node_args: '--max-old-space-size=2048',
    env: {
      PORT: 3005,
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
    },
    max_memory_restart: '2G',
    kill_timeout: 5000,
  }],
};
