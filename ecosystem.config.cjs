module.exports = {
  apps: [
    {
      name: "nova-bridge",
      script: "./vps-core-sovereign-native.cjs",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "nova-frontend",
      script: "npm",
      args: "run dev",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "nova-sentinel",
      script: "./src/core/NovaSentinel.cjs",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "nova-tunnel",
      script: "./start-ssh-tunnel.ps1",
      interpreter: "powershell",
      interpreter_args: "-File",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "nova-schooling",
      script: "./scripts/autonomous_schooling.cjs",
      cron_restart: "0 */6 * * *", // Every 6 hours
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "development",
      }
    }
  ]
};
