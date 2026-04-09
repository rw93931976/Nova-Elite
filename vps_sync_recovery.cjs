/**
 * SOVEREIGN RECOVERY: VPS SYNC (v5.1)
 * Run this on the VPS to align ports correctly.
 */
const { execSync } = require('child_process');

console.log("🛠️ Starting Sovereign Port Alignment...");

try {
    // 1. Kill potentially conflicting PM2 processes
    console.log("🛑 Cleaning up old processes...");
    try { execSync('npx pm2 stop core relay nova-bridge'); } catch (e) { }

    // 2. Start Core v7 on 3508
    console.log("🚀 Launching Core v7 (Brain) on Port 3509...");
    execSync('npx pm2 start core_v7.cjs --name core');

    // 3. Start Relay v5 on 3512 (bridging to 3508)
    console.log("📡 Launching Relay v5 (Gateway) on Port 3515...");
    execSync('npx pm2 start relay_v5.cjs --name relay');

    // 4. Save state
    execSync('npx pm2 save');

    console.log("\n✅ [SUCCESS] Sovereign Gateway is now aligned.");
    console.log("Port Map:");
    console.log(" - Brain: 3509");
    console.log(" - Gateway: 3515");
    console.log(" - Nginx: Proxying /relay -> 3515");
} catch (error) {
    console.error("❌ FAILED:", error.message);
}
