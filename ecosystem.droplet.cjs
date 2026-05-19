/**
 * Droplet PM2 — 104.248.237.169 voice runtime (/root/nova)
 * Use: bash scripts/pm2-droplet-bootstrap.sh
 *
 * Voice uses `start` (not `dev`) — no watchfiles reload, fewer surprise restarts.
 */
module.exports = {
  apps: [
    {
      name: "nova-voice",
      cwd: "/root/nova",
      script: "scripts/start-nova-voice.sh",
      interpreter: "bash",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 50,
      min_uptime: 10000,
      kill_timeout: 20000,
      max_memory: "800M",
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
