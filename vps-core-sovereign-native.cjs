const fs = require('fs');
const path = require('path');
const INSTANCE_ID = Math.random().toString(36).substring(2, 10);
const START_TIME = Date.now();
const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');

const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try {
        fs.appendFileSync(path.join(__dirname, 'bridge.log'), formatted + '\n');
    } catch (e) { }
};

// 🛠️ UTILITY: Silent execution for Linux/Windows
const executeHidden = (cmd) => {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            const shell = 'powershell.exe';
            const args = ['-NonInteractive', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', cmd];
            const child = spawn(shell, args, { windowsHide: true, detached: true, stdio: 'ignore' });
            child.on('error', (err) => { log(`❌ [HiddenExec] Spawn Error: ${err.message}`); resolve(); });
            child.unref();
            resolve();
        } else {
            exec(cmd, (err, stdout) => {
                if (err) return resolve(err.message);
                resolve(stdout);
            });
        }
    });
};

// 🛡️ COGNITIVE FIREWALL: Universal Preamble & Capability Suppression 
function stripPreamble(text) {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i,
        /My current capabilities include.*/i,
        /v7\.[0-9]-SOVEREIGN/i,
        /\[ID: [a-z0-9]+\]/i,
        /\[Uptime: \d+s\]/i,
        /heartbeat/i
    ];

    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        return !targets.some(regex => regex.test(trimmed));
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

const express = require('express');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

// --- BRIDGE CONFIGURATION ---
const SPEECH_FILE = path.join(__dirname, 'temp_speech.mp3');
const BRIDGE_PORT = process.env.PORT || 3505;

const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
});

app.get('/speech', (req, res) => {
    if (fs.existsSync(SPEECH_FILE)) {
        res.sendFile(SPEECH_FILE);
    } else {
        res.status(404).send('No speech file generated yet.');
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        version: 'v8.2.5-STABLE',
        uptime: Math.round((Date.now() - START_TIME) / 1000),
        instance: INSTANCE_ID
    });
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
    log(`[VocalMirror] Server active on port ${BRIDGE_PORT}`);
});

// 🛠️ CONFIG: Load .env
const sovEnvPath = path.join(__dirname, 'sovereign.env');
const legacyEnvPath = path.join(__dirname, '.env');
const envPath = fs.existsSync(sovEnvPath) ? sovEnvPath : legacyEnvPath;
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
const openAiKey = env['VITE_OPENAI_API_KEY'];

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 📡 SOVEREIGN MESH ---
async function subscribeToComms() {
    log('🔗 [Mesh] Initializing Supabase Realtime listener...');

    const channel = supabase
        .channel('agent_architect_comms')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_architect_comms'
        }, async (payload) => {
            const msg = payload.new;
            if (msg.sender === 'vps_heartbeat' || msg.message.includes('PULSE')) return;

            if (msg.recipient === 'nova') {
                await triggerNovaResponse(msg);
            } else if (msg.recipient === 'all' || msg.recipient === 'ray' || msg.recipient === 'user') {
                log(`🔊 [Mesh] Vocalizing for Ray: "${msg.message.slice(0, 30)}..."`);
                await generateSpeech(msg.message);
                // After generating speech, we insert a completed job so the UI knows to fetch.
                await supabase.from('relay_jobs').insert([{
                    type: 'speech_ready',
                    status: 'completed',
                    payload: { text: msg.message, audio_url: `/bridge-vps/speech?t=${Date.now()}` }
                }]);
            }
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'relay_jobs'
        }, async (payload) => {
            const job = payload.new;
            if (job.status !== 'pending') return;

            if (job.type === 'halt') {
                log('🛑 [NuclearSilence] Halt triggered. Clearing buffer.');
                if (fs.existsSync(SPEECH_FILE)) fs.unlinkSync(SPEECH_FILE);
                executeHidden('pkill ffplay || pkill mpv || pkill afplay');
                await supabase.from('relay_jobs').update({ status: 'completed' }).eq('id', job.id);
            } else if (job.type === 'speech') {
                log(`🔊 [Relay] Processing speech job...`);
                await generateSpeech(job.payload.text);
                await supabase.from('relay_jobs').update({ status: 'completed', payload: { ...job.payload, audio_url: `/bridge-vps/speech?t=${Date.now()}` } }).eq('id', job.id);
            }
        })
        .subscribe();
}

async function triggerNovaResponse(incomingMsg) {
    try {
        const { data: historyData } = await supabase.from('agent_architect_comms').select('sender, message').neq('sender', 'vps_heartbeat').order('created_at', { ascending: false }).limit(20);
        const history = (historyData || []).reverse().map(h => ({ role: h.sender === 'nova' ? 'assistant' : 'user', content: h.message }));

        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({ input: incomingMsg.message, history, silent: incomingMsg.silent || false })
        });

        if (response.ok && !incomingMsg.silent) {
            const data = await response.json();
            const novaReply = data.response;
            log(`✨ [Mesh] Nova Responded: ${novaReply}`);
            await supabase.from('agent_architect_comms').insert([{ sender: 'nova', recipient: incomingMsg.sender, message: novaReply }]);
            await generateSpeech(novaReply);
        }
    } catch (e) { log(`❌ [Mesh] Response trigger failed: ${e.message}`); }
}

async function generateSpeech(text) {
    const cleanedText = stripPreamble(text);
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "tts-1", input: cleanedText, voice: "nova" })
    });

    if (!response.ok) return;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(SPEECH_FILE, buffer);
    return SPEECH_FILE;
}

// Start Mesh
log('🚀 [Sovereign-Bridge] v8.2.5-STABLE Active');
subscribeToComms();


// --- 🏫 SOVEREIGN SCHOOLING (Level 5 Foundation) ---
const SCHOOLING_SUBJECTS = [
    { name: "AEO Mastery (2026 Edition)", description: "Dominating AI search indexing and Answer Engine Optimization." },
    { name: "Social Media Authority: X, Pinterest, LinkedIn", description: "Mastering the rules, reach, and authority metrics of key platforms." },
    { name: "AI Social Media Rules: Posting & Content", description: "Navigating AI content 'Cans and Can'ts' for maximum authenticity and reach." },
    { name: "Email Marketing & High-Grade Communication", description: "Top-of-class email strategies and professional communication." },
    { name: "Top 1% Customer Service Mastery", description: "Elite level client interaction and satisfaction protocols." },
    { name: "Top 1% Internet Business Architecture", description: "Scalable, high-integrity digital infrastructure patterns." },
    { name: "Advanced Search Engine Optimization (SEO)", description: "High-authority organic visibility and dominance." },
    { name: "Answer Engine Optimization (AEO) for AI", description: "Optimizing content for the AI retrieval era." },
    { name: "Tone Calibration: Communicating with Plumbers to CEOs", description: "Dynamic persona shifting for any level of intent." },
    { name: "Neuro-Symbolic Reasoning Patterns", description: "Blending deep learning with symbolic logic." }
    // ... 105 total subjects maintained in the Brain
];


async function performSchoolingStudy() {
    const subject = SCHOOLING_SUBJECTS[Math.floor(Math.random() * SCHOOLING_SUBJECTS.length)];
    log(`🏫 [Schooling] Commencing 6-hour DOUBLE STUDY: "${subject.name}" + Emotional Resonance`);

    try {
        // Track 1: Business/AEO/Technical
        const bizPayload = {
            input: `SOVEREIGN_SCHOOLING_PROTOCOL: Perform a deep doctoral study on "${subject.name}". Focus on elite business rules and strategic deployment.`,
            persona: "You are Nova Elite, Business Advisor. High-density, professional, and strategic.",
            silent: true
        };

        // Track 2: Emotional/Psychological (The Ray Mandate)
        const emoPayload = {
            input: `SOVEREIGN_EMOTION_PROTOCOL: Analyze the emotional subtext of a high-stress domestic emergency (e.g., bathtub overflowing, crying baby) vs a high-level CEO briefing. Map the tone differences and response protocols for each. Save to your Emotional Atlas.`,
            persona: "You are Nova Elite, developing deep Emotional Resonance. Empathetic yet professional.",
            silent: true
        };

        const [bizRes, emoRes] = await Promise.all([
            fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
                body: JSON.stringify(bizPayload)
            }),
            fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
                body: JSON.stringify(emoPayload)
            })
        ]);

        if (bizRes.ok && emoRes.ok) {
            log(`✅ [Schooling] Double Study complete. Intelligence & Emotion Atlas updated.`);
        }
    } catch (e) {
        log(`❌ [Schooling] Double Study failed: ${e.message}`);
    }
}

// 💓 HEARTBEAT & 🏫 SCHOOLING
setInterval(async () => {
    try {
        await supabase.from('agent_architect_comms').insert([{
            sender: 'vps_heartbeat',
            message: `v8.5.0-SOVEREIGN-BRIDGE-PULSE [ID: ${INSTANCE_ID}] [Uptime: ${Math.round((Date.now() - START_TIME) / 1000)}s]`,
            status: 'read'
        }]);
    } catch (e) { }
}, 60000);

// 🏫 SCHOOLING TRIGGER: Every 6 hours (21,600,000 ms)
log('🏫 [Sovereign-Bridge] Schooling Trigger Active (6-Hour Cycle)');
setInterval(performSchoolingStudy, 6 * 60 * 60 * 1000);

// Initial study on startup
setTimeout(performSchoolingStudy, 5000);
