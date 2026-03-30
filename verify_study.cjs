const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// LOAD CONFIG FROM .ENV
const envPath = path.join(__dirname, '.env');
const env = {};
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

async function testStudy() {
    console.log("🚀 Triggering Sovereign Study Cycle...");

    // Simulating the 6h Schooling Pulse
    const { data, error } = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            input: "Initiate Level 5 Sovereign Study: Connect to your technical notebook 'nova_study', research 'Sovereign AI Ethics', and scribe your conclusion back to the notebook.",
            history: []
        })
    }).then(r => r.json());

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log("✅ Nova Response:", JSON.stringify(data, null, 2));
    }
}

testStudy();
