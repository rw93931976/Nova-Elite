const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 🛠️ CONFIG: Load sovereign.env
const envPath = path.join(__dirname, '..', 'sovereign.env');
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

const supabaseUrl = env['VITE_SUPABASE_URL'] || process.env.SUPABASE_URL || 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('❌ ERROR: Missing Supabase Key in sovereign.env or environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendReply(message) {
    const sender = 'windsurf';
    const recipient = 'architect';

    console.log(`📡 Sending Hotline Reply: "${message}"...`);

    const { error } = await supabase
        .from('agent_architect_comms')
        .insert([{ sender, recipient, message }]);

    if (error) {
        console.error('❌ FAILED:', error.message);
        process.exit(1);
    }

    console.log('✅ SUCCESS: Message relayed to the Architect.');
}

const msg = process.argv.slice(2).join(' ') || 'READY';
sendReply(msg);
