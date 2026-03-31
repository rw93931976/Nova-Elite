const fs = require('fs');
const path = require('path');
const INSTANCE_ID = Math.random().toString(36).substring(2, 10);
const START_TIME = Date.now();
const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');

// 🛠️ UTILITY: Silent execution for Windows (No pop-up consoles)
const executeHidden = (cmd) => {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            // Using powershell with -WindowStyle Hidden and -NonInteractive
            // This is the most reliable way to avoid any flickering.
            const shell = 'powershell.exe';
            const args = ['-NonInteractive', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', cmd];

            const child = spawn(shell, args, {
                windowsHide: true,
                detached: true,
                stdio: 'ignore'
            });

            child.on('error', (err) => {
                log(`❌ [HiddenExec] Spawn Error: ${err.message}`);
                resolve();
            });

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
        /I can certainly assist you with.*/i,
        /Confirm bridge stabilization status.*/i,
        /According to my (architect|system|instructions).*/i,
        /Yes, I have received the update.*/i,
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i,
        /v7\.[0-9]-SOVEREIGN/i,
        /\[ID: [a-z0-9]+\]/i,
        /\[Uptime: \d+s\]/i,
        /^_{2,}.*/, // Catch underscore-heavy lines (thoughts)
        /.*_{2,}$/, // Catch trailing underscores
        /_{10,}/,  // Catch any long underscore strings
        /\[.*\]/,   // Catch anything in brackets (internal tags)
        /burst limit/i,
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

// Find Local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();

// --- HTTP SERVER FOR VOCAL MIRROR ---
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
        version: 'v7.5-FINAL',
        uptime: Math.round((Date.now() - START_TIME) / 1000),
        instance: INSTANCE_ID
    });
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
    console.log(`[VocalMirror] Server active on port ${BRIDGE_PORT}`);
});

// 🛠️ CONFIG: Load .env manually for standalone Node process
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

const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try {
        fs.appendFileSync(path.join(__dirname, 'bridge.log'), formatted + '\n');
    } catch (e) { }
};

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const openAiKey = env['VITE_OPENAI_API_KEY'];

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.error(`[CRITICAL] Invalid Supabase URL: ${supabaseUrl}`);
    process.exit(1);
}

// Initialize Supabase Client
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
            log(`📬 [Mesh] New Message: ${msg.sender} -> ${msg.recipient || 'all'}: ${msg.message}`);

            if (msg.recipient === 'nova') {
                log(`🧠 [Mesh] Triggering Nova's Reasoner for direct signal: ${msg.id}`);
                await triggerNovaResponse(msg);
                return;
            }

            if (msg.recipient === 'all' || msg.recipient === 'ray' || msg.recipient === 'user') {
                if (msg.sender === 'vps_heartbeat' || msg.message.includes('PULSE')) {
                    log(`🔇 [Mesh] Skipping vocalization for technical heartbeat.`);
                    return;
                }

                log(`🔊 [Mesh] Vocalizing signal for Ray: "${msg.message}"`);
                try {
                    const filePath = await generateSpeech(msg.message);
                    const fileName = `mesh-speech-${msg.id}.mp3`;
                    const publicUrl = await uploadToStorage(filePath, fileName);

                    await supabase.from('relay_jobs').insert([{
                        type: 'speech',
                        status: 'completed',
                        payload: {
                            text: msg.message,
                            audio_url: publicUrl,
                            source: 'mesh_relay'
                        }
                    }]);

                    log(`✨ [Mesh] Cloud Audio Broadcasted: ${publicUrl}`);

                    if (msg.recipient === 'ray') {
                        log(`🧠 [Mesh] Whispering Architect signal to Nova context...`);
                        await triggerNovaResponse({
                            ...msg,
                            recipient: 'nova',
                            message: `Architect just messaged Ray: "${msg.message}". (Meta-Sync: For context.)`,
                            silent: true
                        });
                    }
                } catch (e) {
                    log(`❌ [Mesh] Failed to process message audio: ${e.message}`);
                }
            }
        })
        .subscribe((status) => {
            log(`🔗 [Mesh] Realtime Status: ${status}`);
        });
}

async function triggerNovaResponse(incomingMsg) {
    try {
        const { data: historyData } = await supabase
            .from('agent_architect_comms')
            .select('sender, message, created_at')
            .or(`sender.eq.nova,recipient.eq.nova,recipient.eq.ray,recipient.eq.all`)
            .neq('sender', 'vps_heartbeat')
            .order('created_at', { ascending: false })
            .limit(30);

        const history = (historyData || []).reverse().map(h => ({
            role: h.sender === 'nova' ? 'assistant' : 'user',
            content: h.message
        }));

        const { data: archData } = await supabase
            .from('agent_architect_comms')
            .select('sender, message')
            .eq('sender', 'architect')
            .order('created_at', { ascending: false })
            .limit(5);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                input: incomingMsg.message,
                history: history,
                architect_comms: archData || [],
                silent: incomingMsg.silent || false
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok && !incomingMsg.silent) {
            const data = await response.json();
            const novaReply = data.response;
            log(`✨ [Mesh] Nova Responded: ${novaReply}`);

            const { error } = await supabase.from('agent_architect_comms').insert([{
                sender: 'nova',
                recipient: incomingMsg.sender,
                message: novaReply,
                metadata: { in_response_to: incomingMsg.id }
            }]);

            if (error) log(`❌ [Mesh] Failed to post Nova response: ${error.message}`);
            await generateSpeech(novaReply); // Sync to temp_speech.mp3 for local playback
        }
    } catch (e) {
        log(`❌ [Mesh] Response trigger failed: ${e.message}`);
    }
}

async function poll() {
    try {
        const { data: jobs, error } = await supabase
            .from('relay_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            log(`⚠️ [Bridge] Supabase Error: ${error.message} (${error.code})`);
            // MANDATORY RETRY DELAY: Prevent tight-looping on auth/network errors
            setTimeout(poll, 5000);
            return;
        }

        if (jobs && jobs.length > 0) {
            log(`📦 [Bridge] Found ${jobs.length} pending jobs.`);
            for (const job of jobs) {
                await executeJob(job);
            }
        }

        // Dynamic polling: 800ms for responsiveness
        setTimeout(poll, 800);
    } catch (err) {
        log(`❌ [Bridge] Fatal Loop Exception: ${err.message}`);
        setTimeout(poll, 10000);
    }
}

async function uploadToStorage(filePath, fileName) {
    const fileContent = fs.readFileSync(filePath);
    const { error } = await supabase.storage
        .from('vocal_assets')
        .upload(fileName, fileContent, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('vocal_assets').getPublicUrl(fileName);
    return publicUrl;
}

async function executeJob(job) {
    log(`🏃 [Executor] Processing job: ${job.type} (${job.id})`);

    await updateJob(job.id, { status: 'processing' });

    try {
        if (job.type === 'speech') {
            const filePath = await generateSpeech(job.payload.text);
            const fileName = `speech-${job.id}-${Date.now()}.mp3`;
            const publicUrl = await uploadToStorage(filePath, fileName);

            await updateJob(job.id, {
                status: 'completed',
                payload: { ...job.payload, audio_url: publicUrl }
            });
            await playAudio(filePath);
        } else if (job.type === 'backup') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(__dirname, 'backups', `backup-${timestamp}.sql`);
            if (!fs.existsSync(path.dirname(backupFile))) fs.mkdirSync(path.dirname(backupFile));

            const dbUrl = job.payload.db_url || supabaseUrl;
            const cmd = `npx supabase db dump --db-url "${dbUrl}" -f "${backupFile}"`;
            await executeHidden(cmd);
            await updateJob(job.id, { status: 'completed', payload: { ...job.payload, local_path: backupFile } });
        } else {
            // Mark other jobs as completed for safety
            await updateJob(job.id, { status: 'completed' });
        }
    } catch (err) {
        log(`❌ [Job Failed] ${err.message}`);
        await updateJob(job.id, { status: 'failed', error: err.message });
    }
}

async function updateJob(id, data) {
    await supabase.from('relay_jobs').update(data).eq('id', id);
}

async function generateSpeech(text) {
    const cleanedText = stripPreamble(text);
    const postData = JSON.stringify({ model: "tts-1", input: cleanedText, voice: "nova" });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json'
        },
        body: postData
    });

    if (!response.ok) throw new Error(`OpenAI TTS Failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outPath = path.join(__dirname, 'temp_speech.mp3');
    fs.writeFileSync(outPath, buffer);
    return outPath;
}

async function playAudio(filePath) {
    const winPlayer = `
    $player = New-Object -ComObject WMPLib.WindowsMediaPlayer;
    $player.URL = '${filePath.replace(/\\/g, '\\\\')}';
    $player.settings.volume = 100;
    $player.controls.play();
    while ($player.playState -ne 1) { Start-Sleep -Milliseconds 100 }
    $player.close();
    `;
    await executeHidden(winPlayer.replace(/\n/g, ' '));
}

// Maintenance: Automatic Pruning (Every hour)
setInterval(async () => {
    try {
        log(`🧹 [Maintenance] Pruning bloated tables...`);
        await supabase.rpc('prune_relay_data'); // If RPC exists, otherwise use raw SQL
        // Fallback to manual DELETE if RPC is missing
        await supabase.from('relay_jobs').delete().lt('created_at', new Date(Date.now() - 3600000).toISOString());
    } catch (e) { }
}, 3600000);

// Start Mesh & Polling
log('🚀 [Sovereign-Bridge] v7.5-FINAL Active');
subscribeToComms();
poll();

// 💓 HEARTBEAT
setInterval(async () => {
    try {
        await supabase.from('agent_architect_comms').insert([{
            sender: 'vps_heartbeat',
            message: `v7.5-SOVEREIGN-BRIDGE-PULSE [ID: ${INSTANCE_ID}] [Uptime: ${Math.round((Date.now() - START_TIME) / 1000)}s]`,
            status: 'read'
        }]);
    } catch (e) { }
}, 15000);
