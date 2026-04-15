const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContentRaw = fs.readFileSync('.env', 'utf8');
const env = {};
envContentRaw.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase.from('nova_memories').select('category, content');
    console.log(JSON.stringify(data, null, 2));
}

check();
