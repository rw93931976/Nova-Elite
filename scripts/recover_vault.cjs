const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContentRaw = fs.readFileSync('.env', 'utf8');
const env = {};
envContentRaw.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Could not find Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recover() {
    console.log("🔍 [Vault] Recovering secrets from Supabase...");
    const { data, error } = await supabase.from('nova_secrets').select('*');

    if (error) {
        console.error("❌ Recovery failed:", error);
        return;
    }

    let envContent = fs.readFileSync('.env', 'utf8');

    data.forEach(secret => {
        const keyName = secret.key === 'GOOGLE_SESSION_COOKIE' ? 'GOOGLE_SESSION_COOKIE' : secret.key;
        if (!envContent.includes(keyName)) {
            console.log(`✅ Recovered: ${keyName}`);
            envContent += `\n${keyName}=${secret.value}`;
        } else {
            console.log(`ℹ️ Already exists: ${keyName}`);
        }
    });

    fs.writeFileSync('.env', envContent);
    console.log("✨ [Vault] Environment synchronized.");
}

recover();
