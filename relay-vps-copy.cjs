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

console.log('🛰️ [Relay] Sovereign Relay Live on 127.0.0.1:3512');
console.log(`🧠 [Relay] Gemini endpoint: ${GEMINI_URL.substring(0, 60)}...`);
console.log(`🛡️ [Relay] Expected Security Key: "${SOVEREIGN_SECRET}"`);

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
    console.log(`\n--- NEW CONNECTION REQUEST ---`);
    console.log(`UPGRADE Req: ${request.url}`);

    // Safety against weird URLs
    let url;
    try {
        url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    } catch (e) {
        console.log('❌ [Relay] Bad URL format', e.message);
        socket.destroy();
        return;
    }

    const key = (url.searchParams.get('key') || '').trim();
    if (key !== SOVEREIGN_SECRET) {
        console.log(`❌ [Relay] Bad key. Received: "${key}" | Expected: "${SOVEREIGN_SECRET}"`);
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] UI Connected. Opening Bridge to Gemini...');

        const gemini = new WebSocket(GEMINI_URL);
        const messageQueue = [];

        gemini.on('open', () => {
            console.log('✅ [Relay] Bridge to Gemini OPEN. Flushing buffer:', messageQueue.length);
            while (messageQueue.length > 0) {
                gemini.send(messageQueue.shift());
            }
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
            if (gemini.readyState === WebSocket.OPEN) {
                gemini.send(data);
            } else {
                console.log('⏳ [Relay] Gemini not ready, queuing message');
                messageQueue.push(data);
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
