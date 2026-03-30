const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * STABILITY SENTINEL v1.0
 * ----------------------
 * Performs periodic health checks on the Nova Sovereign architecture.
 * Logs results to nova-data/stability.json
 */

const LOG_DIR = path.resolve(__dirname, '../nova-data');
const STABILITY_FILE = path.join(LOG_DIR, 'stability.json');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logStability(report) {
    const data = fs.existsSync(STABILITY_FILE) ? JSON.parse(fs.readFileSync(STABILITY_FILE, 'utf8')) : [];
    data.push({
        timestamp: new Date().toISOString(),
        ...report
    });
    // Keep only last 50 checks
    if (data.length > 50) data.shift();
    fs.writeFileSync(STABILITY_FILE, JSON.stringify(data, null, 2));
}

async function runHealthCheck() {
    console.log(`[${new Date().toLocaleString()}] Starting Stability Health Check...`);
    const report = {
        status: 'HEALTHY',
        checks: {},
        errors: []
    };

    // 1. Check PM2 Processes
    try {
        const pm2Status = execSync('pm2 jlist').toString();
        const processes = JSON.parse(pm2Status);
        const required = ['nova-bridge', 'nova-schooling'];

        required.forEach(pName => {
            const proc = processes.find(p => p.name === pName);
            const status = proc ? (proc.pm2_env ? proc.pm2_env.status : proc.status) : 'MISSING';
            if (status !== 'online') {
                report.checks[pName] = status;
                report.status = 'DEGRADED';
                report.errors.push(`Process ${pName} is ${status}.`);
            } else {
                report.checks[pName] = 'ONLINE';
            }
        });
    } catch (err) {
        report.checks.pm2 = 'ERROR';
        report.errors.push(`Failed to check PM2 status: ${err.message}`);
    }

    // 2. Check File System Integrity (VPS Flat Structure)
    const criticalFiles = [
        'vps-core-sovereign-native.cjs',
        'ecosystem.config.cjs',
        'sovereign.env',
        '.env'
    ];
    criticalFiles.forEach(file => {
        const rootPath = path.resolve(__dirname, '../', file);
        if (!fs.existsSync(rootPath)) {
            // Check if it's in the same dir as the script (if running differently)
            const sameDirPath = path.resolve(__dirname, file);
            if (!fs.existsSync(sameDirPath)) {
                report.checks[file] = 'MISSING';
                if (report.status !== 'CRITICAL') report.status = 'DEGRADED';
                report.errors.push(`Critical file missing: ${file}`);
            } else {
                report.checks[file] = 'PRESENT';
            }
        } else {
            report.checks[file] = 'PRESENT';
        }
    });

    // 3. Finalize
    console.log(`[SENTINEL] Result: ${report.status} (${report.errors.length} errors)`);
    logStability(report);
}

runHealthCheck();
