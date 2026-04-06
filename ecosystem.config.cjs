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
      args: "run dev -- --host --port 3111",
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
      autorestart: true,
      restart_delay: 21600000, // 6 Hours
      env: {
        NODE_ENV: "production",
      }
    }
    // Note: Sentinel is now handled by the VPS to save local memory.
  ]
};
