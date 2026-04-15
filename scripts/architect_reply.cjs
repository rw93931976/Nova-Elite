const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const message = process.argv.slice(2).join(' ');

if (!message) {
    console.log("Usage: node scripts/architect_reply.cjs \"Your message here\"");
    process.exit(0);
}

async function sendReply() {
    console.log(`📡 Sending vocalized reply: "${message}"`);

    // 🎤 Insert into relay_jobs for Nova's Speech Synthesis
    const { data: job, error: jobErr } = await supabase.from('relay_jobs').insert({
        type: 'speech',
        payload: {
            text: message,
            prosody: 'standard',
            architect_override: true
        },
        status: 'pending'
    }).select().single();

    if (jobErr) {
        console.error("❌ Failed to insert relay job:", jobErr);
    } else {
        console.log(`✅ Nova Vocalization Triggered [Job ID: ${job.id}]`);
    }

    // 📜 Also insert into Architect Comms for the log
    const { error: commsErr } = await supabase.from('agent_architect_comms').insert({
        sender: 'architect',
        recipient: 'nova',
        message: message,
        priority: 'high',
        status: 'read'
    });

    if (commsErr) {
        console.warn("⚠️ Failed to log to architect_comms (but speech was triggered):", commsErr);
    } else {
        console.log("✅ Logged to Architect Comms.");
    }
}

sendReply();
