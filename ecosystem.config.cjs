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
      name: "nova-relay",
      script: "./relay-vps.cjs",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "nova-frontend",
      script: "npx",
      args: "vite --port 3111 --host",
      cwd: "./",
      watch: false,
      autorestart: true,
      restart_delay: 15000,
      shell: true,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "nova-schooling",
      script: "./scripts/autonomous_schooling.cjs",
      watch: false,
      autorestart: false,
      cron_restart: "6 0,6,12,18 * * *",
      env: {
        NODE_ENV: "production",
      }
    }
    // Note: Sentinel is now handled by the VPS to save local memory.
  ]
};
