const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const http = require('http');
const WebSocket = require('ws');

const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try {
        fs.appendFileSync(path.join(__dirname, 'bridge.log'), formatted + '\n');
    } catch (e) { }
};

// 🛠️ CONFIG: Load .env
const env = {};
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const k = parts[0].trim();
            const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            env[k] = v;
        }
    });
}

const googleKey = env['VITE_GOOGLE_AI_KEY'] || env['VITE_GEMINI_API_KEY'];
log(`🔑 [Env] Sovereign Gateway Active. Google Key: ${googleKey ? 'OK' : 'MISSING'}`);

// --- 📡 SOVEREIGN LIVE RELAY (v11.9.2 Model-Agnostic) ---
const RELAY_PORT = 4501;
const wss = new WebSocket.Server({ port: RELAY_PORT, host: '0.0.0.0' });

log(`🛰️ [Relay] Sovereign Live Gateway initializing on port ${RELAY_PORT}...`);

wss.on('connection', (ws) => {
    log('🤝 [Relay] Browser handshaking with Sovereign Node.');
    let googleSocket = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'setup') {
                // MODEL-AGNOSTIC SETUP (v11.9.2): Use client's model or fallback to 3.1
                const requestedModel = data.setup?.model || "models/gemini-3.1-flash-live-preview";
                log(`🛠️ [Relay] Deploying Gemini Session: ${requestedModel}`);

                if (!googleKey) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Relay Error: No API Key found on VPS.' }));
                    return;
                }

                // USE v1beta for widest model support (including 3.1)
                const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${googleKey}`;
                log(`📡 [Relay] Opening outbound stream to Google: ${requestedModel}`);
                googleSocket = new WebSocket(googleUrl);

                googleSocket.on('open', () => {
                    log('✅ [Gemini] Connection Established. Sending Setup Message...');

                    // Map client setup to server protocol
                    const setupMsg = {
                        setup: {
                            model: requestedModel,
                            generation_config: data.setup?.generation_config || {
                                response_modalities: ["audio"]
                            },
                        }
                    };

                    log('📤 [Relay] Sending setup to Gemini: ' + JSON.stringify(setupMsg));
                    googleSocket.send(JSON.stringify(setupMsg));
                });

                googleSocket.on('message', (gMsg) => {
                    try {
                        const gData = JSON.parse(gMsg.toString());
                        if (gData.setupComplete) log('✨ [Gemini] Setup Complete!');
                        if (gData.error) log('❌ [Gemini] Protocol Error: ' + JSON.stringify(gData.error));
                    } catch (e) { }

                    if (ws.readyState === WebSocket.OPEN) ws.send(gMsg);
                });

                googleSocket.on('close', (code, reason) => {
                    log(`🔌 [Relay] Google session ended (Code: ${code}, Reason: ${reason}).`);
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                });

                googleSocket.on('error', (err) => {
                    log(`❌ [Relay] Google Socket Error: ${err.message}`);
                    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: `Relay: Google Connection Failed: ${err.message}` }));
                });

            } else if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(message.toString());
            }
        } catch (e) {
            // Pure binary audio handler
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

const BRIDGE_PORT = 3505;
const http = require('http');
const app = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', version: 'v11.9.2-AGNOSTIC', gateway: '4501 active' }));
    } else {
        res.writeHead(200);
        res.end('Sovereign Bridge active');
    }
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
    log(`[VocalMirror] Base Bridge active on port ${BRIDGE_PORT}`);
});
