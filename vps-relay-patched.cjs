const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const wss = new WebSocket.Server({ noServer: true });
const SOVEREIGN_SECRET = (process.env.SOVEREIGN_SECRET || 'sovereign-secret-12345').trim();
const GEMINI_URL = (process.env.GEMINI_REALTIME_URL || '').trim();

if (!GEMINI_URL) {
    console.error('❌ [Relay] FATAL: GEMINI_REALTIME_URL not set in .env');
    process.exit(1);
}

console.log('🛰️ [Relay] Patched Sovereign Relay starting...');
console.log(`🧠 [Relay] Gemini endpoint: ${GEMINI_URL.substring(0, 60)}...`);

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', relay: 'sovereign-patched', uptime: process.uptime() }));
        return;
    }
    res.writeHead(200);
    res.end('Patched Relay Active');
});

server.on('upgrade', (request, socket, head) => {
    let url;
    try {
        url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    } catch (e) {
        socket.destroy();
        return;
    }

    const key = (url.searchParams.get('key') || '').trim();
    if (key !== SOVEREIGN_SECRET) {
        console.log(`❌ [Relay] Auth failed.`);
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] UI Connected. Bridging to Gemini...');
        const gemini = new WebSocket(GEMINI_URL);
        const messageQueue = [];

        gemini.on('open', () => {
            console.log('✅ [Relay] Gemini Bridge OPEN.');
            while (messageQueue.length > 0) {
                gemini.send(messageQueue.shift());
            }
        });

        gemini.on('message', (data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        ws.on('message', (data) => {
            // --- HANDSHAKE PATCH ---
            try {
                const msg = JSON.parse(data.toString());
                if (msg.setup && msg.setup.generation_config && msg.setup.generation_config.audio_format) {
                    console.log('⚡ [Relay] Patching 1007 setup handshake...');
                    delete msg.setup.generation_config.audio_format;
                    data = JSON.stringify(msg);
                }
            } catch (e) { }

            if (gemini.readyState === WebSocket.OPEN) {
                gemini.send(data);
            } else {
                messageQueue.push(data);
            }
        });

        gemini.on('error', (err) => {
            console.error('❌ [Relay] Gemini Error:', err.message);
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: err.message }));
        });

        gemini.on('close', () => ws.close());
        ws.on('close', () => gemini.close());
    });
});

const PORT = process.env.PORT || 3505;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`🛰️ [Relay] Listening on ${HOST}:${PORT}`);
});
