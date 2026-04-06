const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendTest() {
    console.log('📡 Sending Test Alert to Architect...');
    const { error } = await supabase
        .from('agent_architect_comms')
        .insert([{
            sender: 'test_suit',
            recipient: 'architect',
            message: 'TEST: Windshield Loop Active. Priority HIGH.',
            priority: 'high',
            status: 'unread'
        }]);

    if (error) console.error('❌ Failed:', error);
    else console.log('✅ Test Message Sent.');
}

sendTest();
