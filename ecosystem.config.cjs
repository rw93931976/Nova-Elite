module.exports = {
  apps: [
    {
<<<<<<< HEAD
=======
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
>>>>>>> sovereign-elite-v3-6
      name: "nova-frontend",
      script: "npm",
      args: "run dev",
      watch: false,
      autorestart: true,
<<<<<<< HEAD
      restart_delay: 10000,
=======
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
>>>>>>> sovereign-elite-v3-6
      env: {
        NODE_ENV: "development",
      }
    }
<<<<<<< HEAD
    // Note: Bridge, Sentinel, and Schooling are now handled by the VPS to save local memory.
=======
>>>>>>> sovereign-elite-v3-6
  ]
};
