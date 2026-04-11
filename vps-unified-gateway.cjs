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

// 🛠️ CONFIG
const googleKey = process.env.VITE_GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
const SOVEREIGN_KEY = "sovereign-secret-12345";

log(`🔑 [Env] Sovereign Gateway Active. Google Key: ${googleKey ? 'OK' : 'MISSING'}`);

// --- 📡 SOVEREIGN TRANSPARENT BRIDGE (v13.7) ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Sovereign Bridge ACTIVE - Deep Trace v13.7');
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const key = url.searchParams.get('key');

    if (key !== SOVEREIGN_KEY) {
        log('❌ [Auth] Access Denied.');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        log('🤝 [Bridge] Tunnel established. Connecting to Google AI...');

        const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${googleKey}`;
        const googleWs = new WebSocket(googleUrl);

        let messageQueue = [];

        googleWs.on('open', () => {
            log('✅ [Gemini] Tunnel connected. Flushing queue...');
            while (messageQueue.length > 0) {
                const msg = messageQueue.shift();
                googleWs.send(msg);
            }
        });

        // 🟢 BROWSER -> GOOGLE
        ws.on('message', (message) => {
            const msgStr = message.toString();
            if (msgStr.includes('"setup"')) {
                log(`📤 [Setup] Sent to Google: ${msgStr}`);
            }
            if (googleWs.readyState === WebSocket.OPEN) {
                googleWs.send(message);
            } else if (googleWs.readyState === WebSocket.CONNECTING) {
                messageQueue.push(message);
            }
        });

        // 🔵 GOOGLE -> BROWSER (Deep Trace)
        googleWs.on('message', (message, isBinary) => {
            if (isBinary) {
                log(`📥 [Binary] Recv from Google: ${message.length} bytes`);
            } else {
                const respStr = message.toString();
                log(`📥 [JSON] Recv from Google: ${respStr}`);
            }

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message, { binary: isBinary });
            }
        });

        ws.on('close', () => {
            log('👋 [Bridge] Client disconnected.');
            googleWs.close();
        });

        googleWs.on('close', (code, reason) => {
            log(`🔌 [Gemini] Remote disconnected (Code: ${code}, Reason: ${reason})`);
            ws.close();
        });

        googleWs.on('error', (err) => {
            log(`⚠️ [Gemini] Protocol Error: ${err.message}`);
        });
    });
});

server.listen(3505, '0.0.0.0', () => {
    log(`🛰️ [Sovereign] Transparent Bridge Live on port 3505`);
});
