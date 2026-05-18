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
            name: "nova-relay",
            script: "./relay-vps.cjs",
            watch: false,
            autorestart: true,
            restart_delay: 5000,
            env: {
                NODE_ENV: "production",
            }
        },
        // nova-schooling removed 2026-05-18 (autonomous cycles paused — API cost).
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
