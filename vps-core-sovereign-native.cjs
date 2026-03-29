const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');

// 🛠️ UTILITY: Silent execution for Windows (No pop-up consoles)
const executeHidden = (cmd) => {
    if (process.platform === 'win32') {
        const vbsPath = path.join(__dirname, 'scripts', 'silent_run.vbs');
        const escapedCmd = cmd.replace(/"/g, '""');
        const silentCmd = `wscript.exe "${vbsPath}" "C:\\Windows\\System32\\cmd.exe /c ${escapedCmd}"`;
        return new Promise((resolve) => {
            exec(silentCmd, () => resolve());
        });
    } else {
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout);
            });
        });
    }
};

// 🛡️ COGNITIVE FIREWALL: Universal Preamble & Capability Suppression 
function stripPreamble(text) {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
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
        /^(Yes,?\s+)?(I\s+)?(have\s+)?(just\s+)?received\s+the\s+update.*/i,
        /^(Yes,?\s+)?I\s+can\s+certainly\s+assist.*/i,
        /^(Yes,?\s+)?I\'ve\s+processed\s+your\s+request.*/i
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
const BRIDGE_PORT = 39923;

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
const AUDIO_URL = `http://${LOCAL_IP}:${BRIDGE_PORT}/speech`;

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

app.listen(BRIDGE_PORT, () => {
    console.log(`[VocalMirror] Server active on port ${BRIDGE_PORT}`);
});

// 🛠️ CONFIG: Load .env manually for standalone Node process
const envPath = path.join(__dirname, '.env');
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
    fs.appendFileSync(path.join(__dirname, 'bridge.log'), formatted + '\n');
};

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const openAiKey = env['VITE_OPENAI_API_KEY'];

console.log(`[Startup] Supabase URL: ${supabaseUrl}`);
console.log(`[Startup] Supabase Key Hint: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING'}`);
console.log(`[Startup] OpenAI Key Hint: ${openAiKey ? openAiKey.substring(0, 10) + '...' : 'MISSING'}`);

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    log(`[CRITICAL] Invalid Supabase URL: ${supabaseUrl}`);
    process.exit(1);
}

// Initialize Supabase Client for REALTIME MESH
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 📡 SOVEREIGN MESH: Realtime Subscription ---
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

            // 1. SILENT REASONING for Nova-bound messages (No instruction leakage to Ray)
            if (msg.recipient === 'nova') {
                log(`🧠 [Mesh] Triggering Nova's Reasoner for direct signal: ${msg.id}`);
                await triggerNovaResponse(msg);
                return; // Exit early to skip vocalization of instructions
            }

            // 2. VOCALIZATION for Ray/All/User
            if (msg.recipient === 'all' || msg.recipient === 'ray' || msg.recipient === 'user') {
                // 🛑 SAFETY: Never vocalize technical heartbeats or redundant logs
                if (msg.sender === 'vps_heartbeat' || msg.message.includes('v2.6.12-WEATHER')) {
                    log(`🔇 [Mesh] Skipping vocalization for technical heartbeat: ${msg.id}`);
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
                    await playAudio(filePath, { payload: { text: msg.message } });

                    // 📡 META-SYNC: Whispers Ray's messages to Nova
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
    if (incomingMsg.silent) {
        log(`📓 [Nova Context] Silently syncing Architect signal: ${incomingMsg.id}`);
    }
    log(`🧠 [Mesh] Triggering Nova's Brain (Sovereign Doctorate)...`);

    try {
        // 📡 FETCH CONTEXT: Get recent messages for continuity
        const { data: historyData } = await supabase
            .from('agent_architect_comms')
            .select('sender, message, created_at')
            .or(`sender.eq.nova,recipient.eq.nova,recipient.eq.ray,recipient.eq.all`)
            .order('created_at', { ascending: false })
            .limit(10);

        const history = (historyData || []).reverse().map(h => ({
            role: h.sender === 'nova' ? 'assistant' : 'user',
            content: h.message
        }));

        // 📡 FETCH ARCHITECT COMMS: Specifically for her 'Mesh Context'
        const { data: archData } = await supabase
            .from('agent_architect_comms')
            .select('sender, message')
            .eq('sender', 'architect')
            .order('created_at', { ascending: false })
            .limit(5);

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
            })
        });

        if (response.ok && !incomingMsg.silent) {
            const data = await response.json();
            const novaReply = data.response;
            log(`✨ [Mesh] Nova Responded: ${novaReply}`);

            // Insert response back into the mesh
            const { error } = await supabase.from('agent_architect_comms').insert([{
                sender: 'nova',
                recipient: incomingMsg.sender,
                message: novaReply,
                metadata: { in_response_to: incomingMsg.id }
            }]);

            if (error) log(`❌ [Mesh] Failed to post Nova response: ${error.message}`);

            // Speak the response too
            const filePath = await generateSpeech(novaReply);
            await playAudio(filePath, { payload: { text: novaReply } });
        } else {
            log(`❌ [Mesh] Brain Function failed: ${response.statusText}`);
        }
    } catch (e) {
        log(`❌ [Mesh] Response trigger failed: ${e.message}`);
    }
}

// 🎧 BRIDGE: Poll for speech jobs (Kept for legacy apps/mobile redundancy)
async function poll() {
    log('🔄 [Polling] checking for new jobs...');
    try {
        const url = `${supabaseUrl}/rest/v1/relay_jobs?status=eq.pending&order=created_at.asc`;
        const options = {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        };

        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                if (res.statusCode === 200) {
                    const jobs = JSON.parse(data);
                    for (const job of jobs) {
                        await executeJob(job);
                    }
                }
                setTimeout(poll, 500); // 🏎️ FASTER POLLING: Reduced from 10s to 0.5s for 'Snap' responsiveness
            });
        });

        req.on('error', (err) => {
            log(`[ERROR] Request failed: ${err.message}`);
            setTimeout(poll, 10000);
        });

    } catch (err) {
        log(`[ERROR] Polling loop failed: ${err.message}`);
        setTimeout(poll, 10000);
    }
}

async function uploadToStorage(filePath, fileName) {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from('vocal_assets')
        .upload(fileName, fileContent, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) {
        log(`❌ [Storage] Upload failed: ${error.message}`);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('vocal_assets')
        .getPublicUrl(fileName);

    return publicUrl;
}

async function executeJob(job) {
    log(`🏃 [Executor] Processing job: ${job.type} (${job.id})`);
    // Legacy support for manual speech/notebook jobs
    if (job.type === 'speech') {
        const text = job.payload.text;
        log(`🔊 [Legacy Job] Speech: ${text.substring(0, 50)}...`);
        await updateJob(job.id, { status: 'processing' });
        try {
            const filePath = await generateSpeech(text);

            // 📡 SOVEREIGN SYNC (v3.6.0): Upload to Cloud for Mobile Access
            const fileName = `speech-${job.id}-${Date.now()}.mp3`;
            const publicUrl = await uploadToStorage(filePath, fileName);
            log(`✨ [Cloud] Vocal Asset synced: ${publicUrl}`);

            await updateJob(job.id, {
                status: 'completed',
                payload: { ...job.payload, audio_url: publicUrl } // Use PUBLIC URL
            });
            await playAudio(filePath, job); // Still play locally for desktop parity
        } catch (err) {
            log(`[ERROR] Job failed: ${err.message}`);
            await updateJob(job.id, { status: 'failed', error: err.message });
        }
    } else if (job.type === 'notebook_add_source' || job.type === 'notebook_create') {
        // ... (existing notebook logic)
        await handleNotebookJob(job);
    } else if (job.type === 'update_goal') {
        const goal = job.payload.goal;
        log(`🎯 [Sovereign] NEW GOAL BROADCAST: ${goal}`);
        await updateJob(job.id, { status: 'completed' });

        await supabase.from('agent_architect_comms').insert([{
            sender: 'bridge',
            recipient: 'nova',
            message: `Sovereign Goal Adopted: ${goal}`,
            metadata: { type: 'goal_update', goal }
        }]);
    } else if (job.type === 'update_syllabus') {
        const subject = job.payload.subject;
        const fs = require('fs');
        const path = require('path');
        const syllabusPath = path.join(__dirname, 'master_syllabus.md');

        log(`📚 [Sovereign] EXPANDING SYLLABUS: ${subject}`);
        if (fs.existsSync(syllabusPath)) {
            fs.appendFileSync(syllabusPath, `\n- ${subject} (Discovered: ${new Date().toLocaleDateString()})`);
        }
        await updateJob(job.id, { status: 'completed' });
    } else if (job.type === 'backup') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, 'backups');
        const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

        log(`🛡️ [Backup] Starting autonomous snapshot: ${backupFile}`);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        try {
            // Attempt npx-based dump (safest if CLI isn't global)
            const dbUrl = job.payload.db_url || supabaseUrl;
            const cmd = `npx supabase db dump --db-url "${dbUrl}" -f "${backupFile}"`;
            await executeHidden(cmd);
            await updateJob(job.id, { status: 'completed', payload: { ...job.payload, local_path: backupFile } });
        } catch (err) {
            log(`❌ [Backup] Final failure: ${err.message}`);
            await updateJob(job.id, { status: 'failed', error: err.message });
        }
    }
}




async function handleNotebookJob(job) {
    const isCreate = job.type === 'notebook_create';
    const { title, content, notebookId } = job.payload;
    log(`📓 [Notebook] ${isCreate ? 'Creating' : 'Archiving'}: ${title || notebookId}`);

    await updateJob(job.id, { status: 'processing' });
    try {
        const pythonRunner = "c:\\Users\\Ray\\.gemini\\antigravity\\skills\\notebooklm\\scripts\\run.py";
        const script = isCreate
            ? "c:\\Users\\Ray\\.gemini\\antigravity\\skills\\notebooklm\\scripts\\create_notebook.py"
            : "c:\\Users\\Ray\\.gemini\\antigravity\\skills\\notebooklm\\scripts\\add_source.py";

        const args = isCreate
            ? `--title "${title.replace(/"/g, '\\"')}"`
            : `--content "${content.replace(/"/g, '\\"').replace(/\n/g, ' ')}" --notebook-id "${notebookId}"`;

        const cmd = `python "${pythonRunner}" "${script}" ${args}`;
        await executeHidden(cmd);
        log(`[Notebook Success]`);
        await updateJob(job.id, { status: 'completed' });
    } catch (err) {
        log(`[ERROR] Notebook failed: ${err.message}`);
        await updateJob(job.id, { status: 'failed', error: err.message });
    }
}

async function updateJob(id, data) {
    const url = `${supabaseUrl}/rest/v1/relay_jobs?id=eq.${id}`;
    const options = {
        method: 'PATCH',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(url, options, (res) => {
            res.on('data', () => { });
            res.on('end', () => resolve());
        });
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function generateSpeech(text) {
    const cleanedText = stripPreamble(text);
    log(`🔊 [Speech Prep] Cleaned: ${cleanedText.substring(0, 50)}...`);
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: "tts-1", input: cleanedText, voice: "nova" });
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/audio/speech',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`OpenAI TTS Failed: ${res.statusCode}`));
            const outPath = path.join(__dirname, 'temp_speech.mp3');
            const file = fs.createWriteStream(outPath);
            res.pipe(file);
            file.on('finish', () => resolve(outPath));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function playAudio(filePath, job) {
    return new Promise(async (resolve) => {
        const winPlayer = `
    $player = New-Object -ComObject WMPLib.WindowsMediaPlayer;
    $player.URL = '${filePath.replace(/\\/g, '\\\\')}';
    $player.settings.volume = 100;
    $player.controls.play();
    while ($player.playState -ne 1) { Start-Sleep -Milliseconds 100 }
    $player.close();
    `;
        await executeHidden(winPlayer.replace(/\n/g, ' '));
        resolve();
    });
}

// Start Mesh & Polling
log('🚀 [Sovereign-Bridge] Starting Mesh Engine...');
subscribeToComms();
poll();

