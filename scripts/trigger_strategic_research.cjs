const fs = require('fs');
const path = require('path');

// 🛠️ CONFIG: Load .env
const envPath = path.join(__dirname, '..', '.env');
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
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const DIRECTIVE_PATH = path.join(__dirname, '..', 'nova-data', 'directives', 'Objective_Radius_Audit.md');
const directive = fs.readFileSync(DIRECTIVE_PATH, 'utf8');

async function triggerResearch() {
    console.log('🚀 [Launcher] Triggering Nova Strategic Research Surge...');

    const payload = {
        input: `SOVEREIGN_RESEARCH_PROTOCOL_V1: Initialize strategic discovery based on established directive.
        
DIRECTIVE_CONTENT:
${directive}

ARCHIVE_TARGET: "file://nova-data/notebooks/Strategic_Discovery_Output.md"
CSV_TARGET: "file://nova-data/aeo/Strategic_Metrics_2026.csv"
MODE: Doctoral_Finals`,
        persona: "You are Nova Elite, Strategic Growth Partner. High-density research mode active. Identify the Top 3 Markets with surgical precision.",
        silent: true
    };

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ [Launcher] Research Surge Initiated. Nova is now processing the directive.');
            console.log('\n--- FULL OUTPUT BEGIN ---\n');
            console.log(data.response);
            console.log('\n--- FULL OUTPUT END ---\n');
        } else {
            console.error('❌ [Launcher] Failed to trigger research:', response.statusText);
            const err = await response.text();
            console.error(err);
        }
    } catch (e) {
        console.error('❌ [Launcher] Error:', e.message);
    }
}

triggerResearch();
