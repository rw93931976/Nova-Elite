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
      restart_delay: 10000,
      env: {
        NODE_ENV: "development",
      }
    }
    // Note: Bridge, Sentinel, and Schooling are now handled by the VPS to save local memory.
  ]
};
