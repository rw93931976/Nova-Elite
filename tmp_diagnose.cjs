const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const k = parts[0].trim();
            let v = parts.slice(1).join('=').trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
            env[k] = v;
        }
    });
}

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- NOTEBOOK REGISTRY ---');
    const { data: reg, error: err1 } = await supabase.from('nova_memories').select('*').eq('category', 'notebook_registry');
    console.log(JSON.stringify(reg, null, 2));

    console.log('\n--- RECENT COMMS (TOOL CHECK) ---');
    const { data: comms, error: err2 } = await supabase.from('agent_architect_comms').select('*').order('created_at', { ascending: false }).limit(5);
    console.log(JSON.stringify(comms, null, 2));
}

check();
