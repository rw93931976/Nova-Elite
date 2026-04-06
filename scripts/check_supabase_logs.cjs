const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'sovereign.env');
const env = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    });
}

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
    const { data, error } = await supabase.from('agent_architect_comms').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
check();
