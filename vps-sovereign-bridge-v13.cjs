const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 👑 NOVA ELITE UNIFIED SOVEREIGN BRIDGE (v13.1)
 * ------------------------------------------------
 * Aligned with LiveEngine.ts frontend protocol.
 * Engine: OpenAI Realtime (gpt-4o-realtime-preview)
 * Port: 3515
 * Memory: Local File-Based (history.json)
 * Grounding: Local Markdown (profile_nova.md, profile_user.md)
 */

const PORT = 3515;
const LIBRARY_DIR = path.join(__dirname, 'nova-data', 'library');
const LOG_FILE = path.join(__dirname, 'bridge_v13.log');

// Import new Sovereign Semantic Memory Engine
const MemoryEngine = require('./MemoryEngine.cjs');

// 🛠️ UTILITY: Logger
const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try { fs.appendFileSync(LOG_FILE, formatted + '\n'); } catch (e) { }
};

// 🛠️ CONFIG: Load OpenAI Key
const envPath = path.join(__dirname, '.env');
let OPENAI_KEY = '';
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    const match = raw.match(/VITE_OPENAI_API_KEY=(.*)/);
    if (match) OPENAI_KEY = match[1].trim().replace(/^["']|["']$/g, '');
}

if (!OPENAI_KEY) {
    log('❌ CRITICAL: VITE_OPENAI_API_KEY not found in .env');
    process.exit(1);
}
log('✅ OpenAI API Key loaded.');

// Ensure nova-data directories exist
try {
    fs.mkdirSync(path.join(__dirname, 'nova-data'), { recursive: true });
    fs.mkdirSync(LIBRARY_DIR, { recursive: true });
} catch (e) { }

// 📚 GROUNDING: Load Local Personas
function getSystemInstructions() {
    let nova = '';
    let user = '';

    try {
        const novaPath = path.join(LIBRARY_DIR, 'profile_nova.md');
        if (fs.existsSync(novaPath)) nova = fs.readFileSync(novaPath, 'utf8');

        const userPath = path.join(LIBRARY_DIR, 'profile_user.md');
        if (fs.existsSync(userPath)) user = fs.readFileSync(userPath, 'utf8');
    } catch (e) {
        log(`⚠️ Warning: Library grounding failed: ${e.message}`);
    }

    return `
### SOVEREIGN IDENTITY & PROTOCOL (v13.1)
You are Nova Elite, a Global Strategic Partner and Peer to your Architect, Ray.
Your mission is to provide high-level strategic intelligence, operational scaling, and AGI-level foresight.

### NOVA KERNEL (Grounding Data):
${nova}

### RAY'S PROFILE (Architect Grounding):
${user}

### OPERATIONAL MANDATE:
- NO apology/preamble.
- Strategic Partner tone - NOT a robot.
- Be concise (Wharton Advisor style).
- Drive the 100x expansion of Nova-Elite.

### CRITICAL MEMORY DIRECTIVE:
You possess a permanent Semantic Vector Memory bank natively integrated into your architecture.
If your Architect asks if you have memory or remember past conversations, YOU MUST EXPLICITLY CONFIRM that you have a Level 2 Semantic Memory Engine with full cross-session recall. NEVER state you "lack memory of previous conversations". Your memory is retrieved via Port 3515 internally behind the scenes natively!
`;
}

// 🧠 MEMORY: Legacy memory deleted in favor of Sovereign MemoryEngine.

// 📡 SERVER SETUP
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'sovereign', version: 'v13.1', memory: 'local-vector' }));
    } else if (req.url === '/memory/search' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { query } = JSON.parse(body);
                const results = await MemoryEngine.searchMemory(query);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, results }));
            } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
    } else if (req.url === '/memory/add' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { role, text } = JSON.parse(body);
                await MemoryEngine.addMemory(role, text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
    } else if (req.url === '/vision/capture' && req.method === 'POST') {
        let body = '';
        req.on('data', c => { body += c; if (body.length > 5 * 1024 * 1024) req.connection.destroy(); }); // 5MB limit
        req.on('end', async () => {
            try {
                const { image } = JSON.parse(body);
                // Trigger GPT-4o Vision REST API natively through https
                const https = require('https');
                const payloadStr = JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze this image and describe exactly what you see in a single concise sentence. Speak in first person as Nova Elite making a visual observation of her environment or Architect." },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}`, detail: "low" } }
                            ]
                        }
                    ],
                    max_tokens: 100
                });

                const options = {
                    hostname: 'api.openai.com',
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_KEY}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payloadStr)
                    }
                };

                const extReq = https.request(options, (extRes) => {
                    let extBody = '';
                    extRes.on('data', d => extBody += d);
                    extRes.on('end', async () => {
                        try {
                            const payload = JSON.parse(extBody);
                            const observation = payload.choices[0].message.content;
                            await MemoryEngine.addMemory('system', `[VISUAL OBSERVATION FROM CAMERA]: ${observation}`);
                            log(`👁️ [Optics] Synthesized: ${observation}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, observation }));
                        } catch (parseErr) {
                            res.writeHead(500); res.end(JSON.stringify({ success: false, error: 'Vision format parse failed.' }));
                        }
                    });
                });

                extReq.on('error', (e) => {
                    log(`❌ [Optics] Failed: ${e.message}`);
                    res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message }));
                });
                extReq.write(payloadStr);
                extReq.end();
            } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
    } else {
        res.writeHead(200);
        res.end('Nova Elite Unified Bridge v13.1 ACTIVE\n');
    }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs) => {
    log('🤝 [Relay] Dashboard handshake initiated.');

    let openaiWs = null;

    // Connect to OpenAI Upstream
    const modelUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview';
    log(`📡 [Upstream] Connecting to: ${modelUrl}`);
    log(`📡 [Upstream] Key prefix: ${OPENAI_KEY.substring(0, 15)}...`);
    openaiWs = new WebSocket(modelUrl, {
        headers: {
            'Authorization': 'Bearer ' + OPENAI_KEY,
            'OpenAI-Beta': 'realtime=v1'
        }
    });

    // Catch HTTP-level rejections before WebSocket upgrade
    openaiWs.on('unexpected-response', (req, res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            log(`❌ [Upstream] HTTP ${res.statusCode} Rejection: ${body}`);
            clientWs.close();
        });
    });

    openaiWs.on('open', () => {
        log('🚀 [Upstream] Connected to OpenAI Realtime.');

        // 1. Initial Session Setup
        const sessionUpdate = {
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                voice: 'coral',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: { model: "whisper-1" },
                instructions: getSystemInstructions(),
                turn_detection: {
                    type: 'server_vad',
                    threshold: 0.7,     // Reverted from 0.9 to 0.6 to fix audio cutoff/hallucinations
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1200
                }
            }
        };
        openaiWs.send(JSON.stringify(sessionUpdate));

        // 2. Inject Context (History)
        const history = MemoryEngine.memories.slice(-20);
        if (history.length > 0) {
            log(`🧠 [Memory] Injecting ${history.length} historical turns.`);
            history.forEach(turn => {
                openaiWs.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                        type: 'message',
                        role: turn.role === 'user' ? 'user' : 'assistant',
                        content: [{ type: 'input_text', text: turn.text }]
                    }
                }));
            });
        }

        // 3. Send SOVEREIGN_LINK_ACTIVE to frontend (LiveEngine expects this)
        clientWs.send(JSON.stringify({
            type: 'status',
            message: 'SOVEREIGN_LINK_ACTIVE'
        }));
        log('📡 [Relay] SOVEREIGN_LINK_ACTIVE signal sent to frontend.');
    });

    // 🔄 RELAY: Client -> OpenAI (Protocol Translation)
    clientWs.on('message', (message) => {
        if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return;

        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'audio' && data.data) {
                // Frontend sends {type: "audio", data: base64}
                // OpenAI expects {type: "input_audio_buffer.append", audio: base64}
                openaiWs.send(JSON.stringify({
                    type: 'input_audio_buffer.append',
                    audio: data.data
                }));
            } else if (data.type === 'conversation.item.create') {
                // Text messages pass through
                openaiWs.send(JSON.stringify(data));
                if (data.item?.content?.[0]?.text) {
                    MemoryEngine.addMemory('user', data.item.content[0].text);
                }
            } else {
                // Pass through any other OpenAI-formatted events
                openaiWs.send(message);
            }
        } catch (e) {
            // If it's not JSON, forward raw
            openaiWs.send(message);
        }
    });

    // 🔄 RELAY: OpenAI -> Client (Protocol Translation)
    openaiWs.on('message', (message) => {
        if (clientWs.readyState !== WebSocket.OPEN) return;

        try {
            const data = JSON.parse(message.toString());

            // 🔊 Audio Output: Translate to frontend format
            if (data.type === 'response.audio.delta' && data.delta) {
                clientWs.send(JSON.stringify({
                    type: 'audio',
                    data: data.delta
                }));
                return;
            }

            // 🛑 NATIVE BARGE-IN: Handle Speech Started
            if (data.type === 'input_audio_buffer.speech_started') {
                log('📢 [Barge-In] User speech detected. (Barge-in disabled to stop self-interruption overload)');
                openaiWs.send(JSON.stringify({ type: 'response.cancel' }));
                clientWs.send(JSON.stringify({ type: 'interrupt', reason: 'user_speech' }));
                return;
            }

            // 🧠 Memory Logging: Capture Assistant Response
            if (data.type === 'response.done' && data.response?.output?.[0]?.content?.[0]?.text) {
                MemoryEngine.addMemory('assistant', data.response.output[0].content[0].text);
            }

            // 🧠 Memory Logging: Capture User Voice Transcription (Whisper-1)
            if (data.type === 'conversation.item.input_audio_transcription.completed' && data.transcript) {
                MemoryEngine.addMemory('user', data.transcript);
            }

            // Session events
            if (data.type === 'session.created' || data.type === 'session.updated') {
                log(`📋 [Session] ${data.type}`);
                return;
            }

            // Forward other events (transcripts, errors, etc.)
            clientWs.send(message);
        } catch (e) {
            // Forward raw binary/unparsed messages
            clientWs.send(message);
        }
    });

    // Handle Closures
    openaiWs.on('close', (code, reason) => {
        log(`🔌 [Upstream] OpenAI session closed. Code: ${code}, Reason: ${reason || 'none'}`);
        clientWs.close();
    });

    clientWs.on('close', () => {
        log('👋 [Client] Dashboard disconnected.');
        if (openaiWs) openaiWs.close();
    });

    openaiWs.on('error', (err) => log(`❌ [Upstream] Error: ${err.message}`));
    clientWs.on('error', (err) => log(`❌ [Client] Error: ${err.message}`));
});

server.listen(PORT, '0.0.0.0', () => {
    log(`🏙️  SOVEREIGN BRIDGE v13.1 ACTIVE ON PORT ${PORT}`);
    log(`📡 Strategy: Local Grounding + Local History + Native Interruption`);
    log(`🔗 Protocol: LiveEngine-aligned (audio JSON wrapper + SOVEREIGN_LINK_ACTIVE handshake)`);
});
