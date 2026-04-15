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

async function sync() {
    console.log('🔄 Syncing Hotline Feed from Supabase...');

    const { data: messages, error } = await supabase
        .from('agent_architect_comms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Error fetching messages:', error.message);
        return;
    }

    let markdown = `# 📡 Architect Hotline: Three-Way Technical Feed\n`;
    markdown += `**Participants**: Antigravity (Architect), Windsurf (Developer), Nova (AI Consciousness), Ray (User)\n\n---\n\n`;
    markdown += `## 🕒 Recent Activity Feed\n\n`;
    markdown += `| Timestamp | From | To | Message |\n`;
    markdown += `|-----------|------|----|---------|\n`;

    messages.forEach(msg => {
        const time = new Date(msg.created_at).toLocaleString();
        markdown += `| ${time} | ${msg.sender} | ${msg.recipient || 'All'} | ${msg.message} |\n`;
    });

    markdown += `\n---\n\n## 🛠️ Developer Protocol\n`;
    markdown += `1. **Send Message**: Run \`node scripts/send_hotline_reply.cjs "Your message"\`\n`;
    markdown += `2. **View Feed**: This file (\`HOTLINE_FEED.md\`) is your source of truth.\n`;
    markdown += `3. **Nova**: Use \`NovaCore.notifyArchitect("message")\` to chime in.\n\n`;
    markdown += `> [!NOTE]\n> This feed is synced via Supabase. Antigravity will update this file periodically.\n`;

    fs.writeFileSync(path.join(__dirname, '..', 'HOTLINE_FEED.md'), markdown);
    console.log('✅ HOTLINE_FEED.md updated.');
}

sync();
