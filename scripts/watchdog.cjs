const { exec } = require('child_process');
const http = require('http');

/**
 * Nova Watchdog v1.0 (Sovereign Auto-Healer)
 * Purpose: Ensure the Frontend and Bridge are ALWAYS active.
 */

const CONFIG = {
    CHECK_INTERVAL: 60000, // 1 minute
    FRONTEND_PORT: 3111,
    BRIDGE_URL: 'http://localhost:3505/health'
};

async function checkFrontend() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${CONFIG.FRONTEND_PORT}`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
}

async function checkBridge() {
    return new Promise((resolve) => {
        const req = http.get(CONFIG.BRIDGE_URL, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
}

async function heal() {
    console.log(`[Watchdog] 🛰️ Running sovereign health check... ${new Date().toLocaleString()}`);

    const frontOk = await checkFrontend();
    const bridgeOk = await checkBridge();

    if (!frontOk) {
        console.warn("[Watchdog] ⚠️ Frontend down. Restarting via PM2...");
        exec('npx pm2 restart nova-frontend');
    }

    if (!bridgeOk) {
        console.warn("[Watchdog] ⚠️ Bridge down. Restarting via PM2...");
        exec('npx pm2 restart nova-bridge');
    }

    if (frontOk && bridgeOk) {
        console.log("[Watchdog] ✅ System is locked and loaded.");
    }
}

// Initial heal and interval
heal();
setInterval(heal, CONFIG.CHECK_INTERVAL);
