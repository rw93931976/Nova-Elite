module.exports = {
    apps: [
        {
            name: "nova-bridge",
            script: "./vps-core-sovereign-native.cjs",
            watch: false,
            autorestart: true,
            restart_delay: 5000,
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "nova-schooling",
            script: "./scripts/autonomous_schooling.cjs",
            cron_restart: "0 */6 * * *", // Every 6 hours
            autorestart: false,
            watch: false,
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "nova-stability-sentinel",
            script: "./scripts/stability_sentinel.cjs",
            cron_restart: "0 */6 * * *", // Every 6 hours
            autorestart: false,
            watch: false,
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};
