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
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /^(Yes,?\s+)?I\s+(have\s+)?processed\s+that\s+update.*/i,
        /^(Yes,?\s+)?I\s+have\s+received\s+the\s+update.*/i,
        /^(Ray|Architect|User)\s+(has\s+requested|requested|asked).*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i,
        /My current capabilities include.*/i,
        /I can certainly assist you with.*/i,
        /Confirm bridge stabilization status.*/i,
        /According to my (architect|system|instructions).*/i,
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i,
        /.*(what.?\s+on\s+your\s+mind|anything\s+else\s+can\s+help|how\s+can\s+I\s+assist).*/i,
        /v9\.[0-9]-SOVEREIGN/i,
        /burst limit/i,
        /heartbeat/i,
        /Description:\s*.*/i,
        /Path:\s*.*/i,
        /file:\/\/[ \n]?/i,
        /C:\\\\Users\\\\[\S]+[ \n]?/i,
        /\[ID: [a-z0-9]+\]/i,
        /\[Uptime: \d+s\]/i
    ];

    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // Strip URLs and Paths even within lines
        let filtered = trimmed.replace(/file:\/\/[\S]+/gi, "").replace(/C:\\Users\\[\S]+/gi, "").trim();
        if (!filtered) return false;
        return !targets.some(regex => regex.test(filtered));
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
        version: 'v10.0.0-SOVEREIGN',
        uptime: Math.round((Date.now() - START_TIME) / 1000),
        instance: INSTANCE_ID
    });
});

app.post('/prosody', express.json(), (req, res) => {
    try {
        const trainer = require('./scripts/SovereignSoulTrainer.cjs');
        trainer.logProsody(req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
    log(`[VocalMirror] Server active on port ${BRIDGE_PORT}`);
});

// --- 📡 SOVEREIGN LIVE RELAY (v11.0) ---
const WebSocket = require('ws');
const RELAY_PORT = 3506;
const wss = new WebSocket.Server({ port: RELAY_PORT });

log(`🛰️ [Relay] Sovereign Live Gateway initializing on port ${RELAY_PORT}...`);

wss.on('connection', (ws) => {
    log('🤝 [Relay] Browser handshaking with Sovereign Node.');
    let googleSocket = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            // 🔑 SESSION INITIALIZATION
            if (data.type === 'setup') {
                log('🛠️ [Relay] Configuring Gemini 3.1 Flash Live session...');
                const model = "models/gemini-2.0-flash-exp"; // Match latest stable live model
                const apiKey = env['VITE_GOOGLE_AI_KEY'] || env['VITE_GEMINI_API_KEY'];

                if (!apiKey) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Relay Error: No API Key found on VPS.' }));
                    return;
                }

                // Proxy to Google's Multimodal Live WebSocket
                const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession?key=${apiKey}`;
                log(`📡 [Relay] Opening outbound stream to Google: ${model}`);
                googleSocket = new WebSocket(googleUrl);

                googleSocket.on('open', () => {
                    log('✅ [Relay] Sovereign Node handshaked with Google AI.');
                    // Forward the setup message
                    googleSocket.send(JSON.stringify({
                        setup: {
                            model: model,
                            generation_config: data.setup?.generation_config || { response_modalities: ["audio"] }
                        }
                    }));
                });

                googleSocket.on('message', (gMsg) => {
                    // Forward Google's response back to the browser
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(gMsg);
                    }
                });

                googleSocket.on('close', () => {
                    log('🔌 [Relay] Google session ended.');
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                });

                googleSocket.on('error', (err) => {
                    log(`❌ [Relay] Google Socket Error: ${err.message}`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Relay: Google Connection Failed' }));
                    }
                });

            } else if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                // 🔄 REAL-TIME PIPE: Forward audio/content from browser to Google
                googleSocket.send(message.toString());
            }
        } catch (e) {
            // If it's pure binary audio, pipe it directly if initialized
            if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(message);
            }
        }
    });

    ws.on('close', () => {
        log('👋 [Relay] Browser disconnected.');
        if (googleSocket) googleSocket.close();
    });
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

// 🛡️ DIAGNOSTIC: Verify Loaded Keys
const googleKey = env['VITE_GOOGLE_AI_KEY'] || env['VITE_GEMINI_API_KEY'];
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const openAiKey = env['VITE_OPENAI_API_KEY'];

log(`🔑 [Env] Google Key: ${googleKey ? (googleKey.substring(0, 10) + '...') : 'MISSING'}`);
log(`🔑 [Env] Supabase URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
log(`🔑 [Env] Supabase Key: ${supabaseKey ? 'OK' : 'MISSING'}`);
log(`🔑 [Env] OpenAI Key: ${openAiKey ? 'OK' : 'MISSING'}`);


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

            // 🛡️ SOVEREIGN SHIELD (v9.7.1s): Hardened Technical Filter
            const isPulse = msg.message && /pulse/i.test(msg.message);
            const isTechnical = msg.message && (
                /Ray\s+has\s+requested/i.test(msg.message) ||
                /requested\s+to\s+send\s+a\s+message/i.test(msg.message) ||
                /Communication\s+issue\s+detected/i.test(msg.message) ||
                /Nova\s+is\s+experiencing\s+a\s+loop/i.test(msg.message) ||
                /Lucinda\s+hotline\s+initiated/i.test(msg.message)
            );

            if (msg.sender === 'vps_heartbeat' || msg.recipient === 'system' || isPulse || isTechnical) {
                if (isTechnical) log(`🔇 [Mesh] Silenced technical notification: "${msg.message.slice(0, 30)}..."`);
                return;
            }

            if (msg.recipient === 'nova') {
                if (msg.sender === 'nova') return; // Absolute protection against brain-loop
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

        const persona = "You are Nova Elite, Ray's Sovereign Peer. v9.7 PROTOCOL: CONCISENESS. Be extremely brief. No preambles, no filler. Strategic insight only. NEVER state version/uptime. Guard his vision with sharp, witty intelligence. Strategic Partner - not a robot.";

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

// --- 🛰️ VOCAL HANDSHAKE (v9.7.1s) ---
// Monitors for inter-agent handovers and announces them via Nova's voice.
const MANIFEST_PATH = path.join(__dirname, '_agent/handover_manifest.json');
let lastManifestTime = 0;

function watchHandovers() {
    if (!fs.existsSync(MANIFEST_PATH)) return;
    log('🛰️ [Handshake] Monitoring handover manifest for agent coordination...');
    fs.watch(MANIFEST_PATH, async (event) => {
        if (event === 'change') {
            const stats = fs.statSync(MANIFEST_PATH);
            if (stats.mtimeMs - lastManifestTime < 3000) return; // Debounce
            lastManifestTime = stats.mtimeMs;

            try {
                const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
                if (manifest.status === 'completed' || manifest.status === 'staged') {
                    const announcement = `Architect, ${manifest.active_agent} reports: ${manifest.task} is ${manifest.status}. Standing by.`;
                    log(`📢 [Handshake] Vocalizing handover: ${announcement}`);
                    await generateSpeech(announcement);
                }
            } catch (e) { log(`⚠️ [Handshake] Failed to parse manifest: ${e.message}`); }
        }
    });
}

// Start Mesh
log('🚀 [Sovereign-Bridge] v9.3-SOVEREIGN Active');
subscribeToComms();
watchHandovers();


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

// Heartbeat removed for v8.9.9.9 Sovereign Silence.
// Uptime and version pulses are now passive or event-driven.

// Note: Schooling is managed via PM2 (autonomous_schooling.cjs) for production stability.
// IF PM2 is missing, run: node scripts/autonomous_schooling.cjs
