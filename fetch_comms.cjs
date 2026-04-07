const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContentRaw = fs.readFileSync(envPath, 'utf8');
const env = {};
envContentRaw.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchComms() {
    const { data, error } = await supabase
        .from('agent_architect_comms')
        .select('sender, message, created_at')
        .or('message.ilike.%last study%,message.ilike.%file://%')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("❌ Supabase Error:", error);
        return;
    }

    console.log("📜 --- RECENT COMMS ---");
    data.reverse().forEach(row => {
        console.log(`[${row.created_at}] ${row.sender.toUpperCase()}: ${row.message}`);
    });
}

fetchComms();
