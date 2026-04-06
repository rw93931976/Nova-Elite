const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 🛠️ CONFIG: Load .env (Same logic as bridge)
const sovEnvPath = path.join(__dirname, '..', 'sovereign.env');
const legacyEnvPath = path.join(__dirname, '..', '.env');
const envPath = fs.existsSync(sovEnvPath) ? sovEnvPath : legacyEnvPath;
const env = {};

if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const k = parts[0].trim();
            let v = parts.slice(1).join('=').trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
            env[k] = v;
        }
    });
}

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ [DirectWire] Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const message = process.argv.slice(2).join(' ');
if (!message) {
    console.log("Usage: node scripts/architect_direct.cjs \"Your message to Antigravity\"");
    process.exit(0);
}

async function sendDirect() {
    console.log(`🛸 [DirectWire] Transmitting to Antigravity: "${message}"`);

    const { error } = await supabase.from('agent_architect_comms').insert([{
        sender: 'ray_direct',
        recipient: 'antigravity',
        message: message,
        status: 'unread'
    }]);

    if (error) {
        console.error("❌ [DirectWire] Transmission Failed:", error.message);
    } else {
        console.log("✅ [DirectWire] Handshake Successful. Antigravity will receive this on the next pulse.");
    }
}

sendDirect();
