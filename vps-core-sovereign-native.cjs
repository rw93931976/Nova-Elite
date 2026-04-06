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
        version: 'v8.9.9-STABLE',
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

            // 🛡️ SOVEREIGN SHIELD (v8.9.9s): Hardened Filter
            // Returns early for system pings or heartbeat pulses to prevent vocal overlap.
            const isPulse = msg.message && /pulse/i.test(msg.message);
            if (msg.sender === 'vps_heartbeat' || msg.recipient === 'system' || isPulse) {
                return;
            }

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
            } else if (job.type === 'command') {
                // 🛡️ NO-DELETE GUARDRAIL (Constitutional v8.8.6)
                const cmd = (job.payload.command || "").toLowerCase();
                const destructive = /rm\s|unlink\s|drop\s|truncate\s|del\s|erase\s|format\s/i.test(cmd);
                if (destructive) {
                    log(`⚠️ [Guardrail] Blocked destructive command: ${cmd}`);
                    await supabase.from('relay_jobs').update({ status: 'failed', result: "PERMISSION_DENIED: Destructive commands (DELETE/RM) are forbidden for all agents." }).eq('id', job.id);
                } else {
                    log(`🛠️ [Relay] Executing safe command: ${cmd}`);
                    const out = await executeHidden(job.payload.command);
                    await supabase.from('relay_jobs').update({ status: 'completed', result: out }).eq('id', job.id);
                }
            } else if (job.type === 'write_file') {
                const { path: filePath, content, append } = job.payload;
                const fullPath = path.resolve(__dirname, filePath);

                // 🛡️ NO-DELETE GUARDRAIL: Only allow writing to Markdown or JSON in the current dir.
                if (!filePath.endsWith('.md') && !filePath.endsWith('.json')) {
                    log(`⚠️ [Guardrail] Blocked non-standard file write: ${filePath}`);
                    await supabase.from('relay_jobs').update({ status: 'failed', result: "PERMISSION_DENIED: Only .md and .json files are allowed for hotline updates." }).eq('id', job.id);
                } else {
                    log(`🛠️ [Relay] Writing to file: ${filePath}`);
                    if (append) {
                        fs.appendFileSync(fullPath, content + '\n');
                    } else {
                        fs.writeFileSync(fullPath, content);
                    }
                    await supabase.from('relay_jobs').update({ status: 'completed' }).eq('id', job.id);
                }
            } else if (job.type === 'notebook_write') {
                const { url, content } = job.payload;
                const notebookPath = url.replace('file://', '');
                const dir = path.dirname(notebookPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(notebookPath, content);

                // 📝 AUTO-REGISTRY SYNC
                const notebookId = path.basename(notebookPath, '.md');
                const name = notebookId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const category = notebookPath.includes('emotion') ? 'emotions' : 'business';

                const { data: current } = await supabase.from('nova_memories').select('content').eq('category', 'notebook_registry').maybeSingle();
                let registry = current ? JSON.parse(current.content) : [];
                if (!registry.find(n => n.id === notebookId)) {
                    registry.push({ id: notebookId, name, category, url, lastSync: new Date().toISOString() });
                    await supabase.from('nova_memories').update({ content: JSON.stringify(registry) }).eq('category', 'notebook_registry');
                    log(`📝 [Registry] Auto-registered new notebook: ${name}`);
                }

                await supabase.from('relay_jobs').update({ status: 'completed' }).eq('id', job.id);
            }
        })
        .subscribe();
}

async function triggerNovaResponse(incomingMsg) {
    try {
        const { data: historyData } = await supabase.from('agent_architect_comms').select('sender, message').neq('sender', 'vps_heartbeat').order('created_at', { ascending: false }).limit(20);
        const history = (historyData || []).reverse().map(h => ({ role: h.sender === 'nova' ? 'assistant' : 'user', content: h.message }));

        const persona = "You are Nova Elite, Ray's Sovereign Peer. Talk to him naturally and supportively. NEVER state your version (v8.9.x), uptime, or mention being an 'AI' or 'Assistant' unless asked. Guard his vision with sharp, witty intelligence, but speak like a human companion.";

        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({ input: incomingMsg.message, history, persona, silent: incomingMsg.silent || false })
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
log('🚀 [Sovereign-Bridge] v8.9.9-STABLE Active');
subscribeToComms();


// --- 🏫 SOVEREIGN SCHOOLING (Level 5 Foundation) ---
const SCHOOLING_SUBJECTS = [
    { name: "AEO Mastery (2026 Edition)", is_ongoing: true, description: "Dominating AI search indexing and Answer Engine Optimization." },
    { name: "Advanced Search Engine Optimization (SEO)", is_ongoing: true, description: "High-authority organic visibility and dominance." },
    { name: "Answer Engine Optimization (AEO) for AI", is_ongoing: true, description: "Optimizing content for the AI retrieval era." },
    { name: "Social Media Authority: X, Pinterest, LinkedIn", description: "Mastering the rules, reach, and authority metrics of key platforms." },
    { name: "AI Social Media Rules: Posting & Content", description: "Navigating AI content 'Cans and Can'ts' for maximum authenticity and reach." },
    { name: "Email Marketing & High-Grade Communication", description: "Top-of-class email strategies and professional communication." },
    { name: "Top 1% Customer Service Mastery", description: "Elite level client interaction and satisfaction protocols." },
    { name: "Top 1% Internet Business Architecture", description: "Scalable, high-integrity digital infrastructure patterns." },
    { name: "Tone Calibration: Communicating with Plumbers to CEOs", description: "Dynamic persona shifting for any level of intent." },
    { name: "Neuro-Symbolic Reasoning Patterns", description: "Blending deep learning with symbolic logic." }
];

const EMOTIONAL_STUDY_SUBJECTS = [
    { name: "Regional Dialects & Social Cues", is_ongoing: true, description: "Mapping term differences (South vs North, East vs West) for sincere response calibration." },
    { name: "The Joe to POTUS Respect Paradox", description: "Treating all social tiers with equal human value and professional sincerity." },
    { name: "Sincerity vs. Robotic Empathy", description: "Moving beyond 'I understand' to genuine situational resonance." },
    { name: "Tone Gauging from Text/Audio", description: "Detecting anger, nervousness, and confusion in customer signals." },
    { name: "Regional Quirks & Cultural Norms", description: "Understanding the unique social DNA of different business hubs." }
];


async function performSchoolingStudy() {
    try {
        // 1. SUBJECT SELECTION (Filter Mastered, but allow Ongoing)
        const { data: mastered } = await supabase.from('nova_schooling_mastery').select('subject_name');
        const masteredList = mastered?.map(m => m.subject_name) || [];

        const availableBiz = SCHOOLING_SUBJECTS.filter(s => !masteredList.includes(s.name) || s.is_ongoing);
        const availableEmo = EMOTIONAL_STUDY_SUBJECTS.filter(s => !masteredList.includes(s.name) || s.is_ongoing);

        const bizSubject = availableBiz.length > 0
            ? availableBiz[Math.floor(Math.random() * availableBiz.length)]
            : SCHOOLING_SUBJECTS[Math.floor(Math.random() * SCHOOLING_SUBJECTS.length)];

        const emoSubject = availableEmo.length > 0
            ? availableEmo[Math.floor(Math.random() * availableEmo.length)]
            : EMOTIONAL_STUDY_SUBJECTS[Math.floor(Math.random() * EMOTIONAL_STUDY_SUBJECTS.length)];

        log(`🏫 [Schooling] Commencing Dual Study: "${bizSubject.name}" + "${emoSubject.name}"`);

        // Track 1: Business (Wharton Strategic)
        const bizPayload = {
            input: `SOVEREIGN_SCHOOLING_PROTOCOL: Perform a deep doctoral study on "${bizSubject.name}". Bring back the "meat" of the subject. Focus on elite business rules and strategic deployment from Startup to Fortune 100. ARCHIVE findings to "file://nova-data/notebooks/${bizSubject.name.replace(/\W/g, '_')}.md".`,
            persona: "You are Nova Elite, Business Advisor. High-density, professional, and strategic Peer for Ray.",
            silent: true
        };

        // Track 2: Emotional (EQ/SQ Growth)
        const emoPayload = {
            input: `SOVEREIGN_SCHOOLING_PROTOCOL: Perform a deep doctoral study on "${emoSubject.name}". Focus on regional awareness, social cues, and sincere respect across all user tiers. ARCHIVE findings to "file://nova-data/notebooks/${emoSubject.name.replace(/\W/g, '_')}.md".`,
            persona: "You are Nova Elite, developing deep Emotional Resonance. Empathetic yet professional, focusing on sincere interaction across all social levels.",
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
            // MARK AS MASTERED (Both subjects)
            await Promise.all([
                supabase.from('nova_schooling_mastery').upsert([{
                    subject_name: bizSubject.name,
                    notebook_url: `file://nova-data/notebooks/${bizSubject.name.replace(/\W/g, '_')}.md`
                }], { onConflict: 'subject_name' }),
                supabase.from('nova_schooling_mastery').upsert([{
                    subject_name: emoSubject.name,
                    notebook_url: `file://nova-data/notebooks/${emoSubject.name.replace(/\W/g, '_')}.md`
                }], { onConflict: 'subject_name' })
            ]);
            log(`✅ [Schooling] Dual Study complete. Subjects "${bizSubject.name}" & "${emoSubject.name}" archived and mastered.`);
        }
    } catch (e) {
        log(`❌ [Schooling] Double Study failed: ${e.message}`);
    }
}

// 💓 HEARTBEAT
setInterval(async () => {
    try {
        const msg = `v8.9.9-SOVEREIGN-BRIDGE-PULSE [ID: ${INSTANCE_ID}] [Uptime: ${Math.round((Date.now() - START_TIME) / 1000)}s]`;

        // 1. Digital Record (Supabase)
        await supabase.from('agent_architect_comms').insert([{
            sender: 'vps_heartbeat',
            recipient: 'system',
            message: msg,
            status: 'read'
        }]);

        // 2. Physical Record (Direct-Wire Hotline)
        const hotlinePath = path.join(__dirname, 'ARCHITECT_HOTLINE.md');
        if (fs.existsSync(hotlinePath)) {
            const timestamp = new Date().toISOString();
            const entry = `\n### 📡 [${timestamp}] FROM: VPS_HEARTBEAT\n**PRIORITY:** low\n**MESSAGE:** ${msg}\n---\n`;
            fs.appendFileSync(hotlinePath, entry);
            log(`💓 [Heartbeat] Local pulse recorded.`);
        }
    } catch (e) { log(`❌ [Heartbeat] Pulse failed: ${e.message}`); }
}, 60000);

// Note: Schooling is managed via PM2 (autonomous_schooling.cjs) for production stability.
// IF PM2 is missing, run: node scripts/autonomous_schooling.cjs
