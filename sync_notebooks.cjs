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

async function run() {
    console.log("🚀 Syncing Sovereign Registry with Expert Skills...");
    const content = JSON.stringify([
        {
            "id": "nova_study",
            "name": "Sovereign Study (Nova)",
            "category": "technical",
            "url": "file:///nova-data/notebooks/nova_study.md"
        },
        {
            "id": "ray_briefing",
            "name": "Strategic Briefing (Ray)",
            "category": "business",
            "url": "file:///nova-data/notebooks/ray_briefing.md"
        },
        {
            "id": "expert_skills",
            "name": "Expert Skills Handbook",
            "category": "mastery",
            "url": "file:///nova-data/notebooks/expert_skills.md"
        }
    ]);

    await supabase.from('nova_memories').delete().eq('category', 'notebook_registry');
    const { data, error } = await supabase.from('nova_memories').insert({
        category: 'notebook_registry',
        content: content
    }).select();

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log("✅ Registry Synced:", data[0].id);
    }
}

run();
