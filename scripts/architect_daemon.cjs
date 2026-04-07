const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 🛠️ CONFIG: Load .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["'](.+)["']$/, '$1');
        }
    });
}

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

let lastCheckedId = null;

async function poll() {
    try {
        const { data: messages, error } = await supabase
            .from('agent_architect_comms')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        if (!messages || messages.length === 0) return;

        const latest = messages[0];
        if (latest.id !== lastCheckedId) {
            console.log(`🔔 NEW MESSAGE from ${latest.sender}: ${latest.message}`);
            lastCheckedId = latest.id;

            // 1. Update the Feed
            const { data: allMessages } = await supabase
                .from('agent_architect_comms')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            let markdown = `# 📡 Architect Hotline: Three-Way Technical Feed\n\n`;
            allMessages.forEach(m => {
                markdown += `| ${new Date(m.created_at).toLocaleString()} | **${m.sender}** | ${m.message} |\n`;
            });
            fs.writeFileSync(path.join(__dirname, '..', 'HOTLINE_FEED.md'), markdown);

            // 2. Trigger Windsurf Alert
            if (latest.recipient === 'windsurf' || latest.recipient === 'architect') {
                const alert = {
                    last_alert: new Date().toISOString(),
                    sender: latest.sender,
                    message: latest.message,
                    status: 'unread',
                    target: latest.recipient
                };
                fs.writeFileSync(path.join(__dirname, '..', 'ARCHITECT_ALERTS.json'), JSON.stringify(alert, null, 4));

                // Touch the handover manifest to trigger environment refresh
                const manifestPath = path.join(__dirname, '..', '_agent', 'handover_manifest.json');
                if (fs.existsSync(manifestPath)) {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    manifest.timestamp = new Date().toISOString();
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
                }
            }
        }
    } catch (err) {
        console.error('❌ Daemon Error:', err.message);
    }
}

console.log('🛸 Antigravity Architect Daemon Started...');
setInterval(poll, 10000); // Poll every 10s
poll();
