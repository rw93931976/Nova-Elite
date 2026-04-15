const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const wss = new WebSocket.Server({ noServer: true });
const SOVEREIGN_SECRET = process.env.SOVEREIGN_SECRET || 'sovereign-secret-12345';
const GEMINI_URL = process.env.GEMINI_REALTIME_URL;

if (!GEMINI_URL) {
    console.error('❌ [Relay] FATAL: GEMINI_REALTIME_URL not set in .env');
    process.exit(1);
}

console.log('🛰️ [Relay] Sovereign Relay Live on 127.0.0.1:3512');
console.log(`🧠 [Relay] Gemini endpoint: ${GEMINI_URL.substring(0, 60)}...`);

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', relay: 'sovereign', uptime: process.uptime() }));
        return;
    }
    res.writeHead(200);
    res.end('Relay Active');
});

server.on('upgrade', (request, socket, head) => {
    console.log(`UPGRADE Req: ${request.url}`);
    const url = new URL(request.url, `http://${request.headers.host}`);
    const key = url.searchParams.get('key');
    if (key !== SOVEREIGN_SECRET) {
        console.log('❌ [Relay] Bad key, rejecting');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] UI Connected. Opening Bridge to Gemini...');

        const gemini = new WebSocket(GEMINI_URL);

        gemini.on('open', () => {
            console.log('✅ [Relay] Bridge to Gemini OPEN');
            wss.emit('connection', ws, request);
        });

        gemini.on('message', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        gemini.on('error', (err) => {
            console.error('❌ [Relay] Gemini WS Error:', err.message);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: `Gemini Error: ${err.message}` }));
            }
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
            }
        });

        gemini.on('close', (code, reason) => {
            console.log(`🔌 [Relay] Gemini closed: ${code} ${reason}`);
            ws.close();
        });

        ws.on('close', () => {
            console.log('🔌 [Relay] UI disconnected, closing Gemini bridge');
            gemini.close();
        });
    });
});

server.listen(3512, '127.0.0.1', () => {
    console.log('🛰️ [Relay] Server listening on 127.0.0.1:3512');
});
