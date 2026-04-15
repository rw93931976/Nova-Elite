const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 🛠️ CONFIG: Load (.env)
const env = {};
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const HOTLINE_FILE = path.join(__dirname, '..', 'ARCHITECT_HOTLINE.md');

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL or ANON_KEY missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🛡️ [Sovereign-Sentry] Active. Monitoring Windshield Loop...');
console.log(`📂 Hotline: ${HOTLINE_FILE}`);

const CONFIG_FILE = path.join(__dirname, '..', 'ARCHITECT_ALERTS.json');

async function startSentry() {
    const channel = supabase
        .channel('architect_sentry')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_architect_comms'
        }, async (payload) => {
            const msg = payload.new;
            if (msg.recipient === 'architect' || msg.recipient === 'all') {
                const timestamp = new Date().toISOString();
                const log = `\n### 📡 [${timestamp}] FROM: ${msg.sender.toUpperCase()}\n**PRIORITY:** ${msg.priority || 'NORMAL'}\n**MESSAGE:** ${msg.message}\n---\n`;

                console.log(`\n🔔 [NEW MESSAGE]: ${msg.message}`);
                fs.appendFileSync(HOTLINE_FILE, log);

                // 🚨 SOVEREIGN ALERT (v8.9.1): OS-LEVEL INTERRUPT
                if (msg.priority === 'high' || msg.sender === 'architect' || msg.message.toLowerCase().includes('fail')) {
                    console.log('🚨 HIGH PRIORITY ALERT TRIGGERED');

                    // 1. Audio Beep (High Priority Alert)
                    if (process.platform === 'win32') {
                        exec('powershell "[console]::beep(1000, 500); [console]::beep(1200, 300)"');
                        console.log('🚨 [Sovereign-Sentry] Auditive Alert Dispatched.');
                    }

                    // 2. Persistent JSON Alert for Agent Startup Check
                    const alert = { id: msg.id, sender: msg.sender, message: msg.message, timestamp, status: 'unread' };
                    fs.writeFileSync(CONFIG_FILE, JSON.stringify(alert, null, 2));
                }
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Connected to Realtime Mesh.');
            }
        });
}

startSentry();
