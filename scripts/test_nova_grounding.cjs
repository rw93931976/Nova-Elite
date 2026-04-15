const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Simple grounding test
async function testGrounding() {
    const envPath = path.join(__dirname, '../.env');
    const env = {};
    if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf8');
        raw.split(/\n/).forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) env[parts[0].trim()] = parts[1].trim();
        });
    }

    const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

    console.log("🕵️ Checking Nova's Memories...");
    const { data, error } = await supabase
        .from('nova_memories')
        .select('content, category')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("❌ Memory Error:", error.message);
    } else {
        console.log("✅ Nova has memories:", data.length);
        data.forEach((m, i) => console.log(`[${i}] (${m.category}): ${m.content.substring(0, 80)}...`));
    }

    console.log("\n🛠️ Checking Tool Registry...");
    const { data: tools, error: tErr } = await supabase.from('sovereign_tool_registry').select('tool_name, status');
    if (tErr) {
        console.error("❌ Tool Error:", tErr.message);
    } else {
        console.log("✅ Tools registered:", tools.length);
        tools.forEach(t => console.log(`- ${t.tool_name} (${t.status})`));
    }
}

testGrounding();
