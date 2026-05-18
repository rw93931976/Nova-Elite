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
    }
    // nova-schooling removed 2026-05-18 (autonomous cycles paused — API cost).
    // Note: Sentinel is now handled by the VPS to save local memory.
  ]
};
