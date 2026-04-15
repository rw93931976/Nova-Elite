const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * NOVA SENTINEL v1.0
 * -----------------
 * Watches the Nova Elite source code and creates automatic backups.
 * 5-minute debounce to prevent zipping during active editing.
 */

const PROJECT_DIR = path.resolve(__dirname, '../../');
const WATCH_DIR = path.join(PROJECT_DIR, 'src');
const BACKUP_DIR = path.resolve(PROJECT_DIR, '../nova-backups');
const MAX_BACKUPS = 10;
const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let timeout = null;

function log(msg) {
    const ts = new Date().toLocaleString();
    console.log(`[${ts}] [SENTINEL] ${msg}`);
}

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const fileName = `nova-elite-AUTO-${timestamp}.zip`;
    const destPath = path.join(BACKUP_DIR, fileName);

    log(`Creating auto-backup: ${fileName}...`);

    // Using powershell for reliable zipping on Windows
    const cmd = `powershell -WindowStyle Hidden -c "Compress-Archive -Path '${PROJECT_DIR}' -DestinationPath '${destPath}' -Force"`;

    exec(cmd, { windowsHide: true }, (err) => {
        if (err) {
            log(`🚨 Backup failed: ${err.message}`);
        } else {
            log(`✅ Backup successful.`);
            cleanupOldBackups();
        }
    });
}

function cleanupOldBackups() {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return;

        const backups = files
            .filter(f => f.startsWith('nova-elite-AUTO'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (backups.length > MAX_BACKUPS) {
            backups.slice(MAX_BACKUPS).forEach(f => {
                fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                log(`🗑️ Removed old backup: ${f.name}`);
            });
        }
    });
}

log(`📡 Sentinel is watching: ${WATCH_DIR}`);

fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            createBackup();
        }, DEBOUNCE_MS);
    }
});

// Initial heartbeat
log('Sentinel active. Your progress is now protected.');
